import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  // Get logged in user's profile with permissions
  async getMyProfile(userId: number) {
    const userRows: {
      id: number;
      name: string;
      email: string;
      phone: string | null;
      role: string;
    }[] = await this.prisma.$queryRawUnsafe(
      `SELECT id, name, email, phone, role FROM finsync."User" WHERE id = ${userId}`,
    );
    if (!userRows[0]) throw new NotFoundException('User not found');
    const user = userRows[0];

    // Get company memberships with role and permissions via raw SQL
    const memberRows: {
      company_id: number;
      company_name: string;
      role: string;
      company_role_id: number | null;
    }[] = await this.prisma.$queryRawUnsafe(
      `SELECT cm.company_id, c.name AS company_name, cm.role, cm.company_role_id
       FROM finsync."CompanyMember" cm
       JOIN finsync."Company" c ON cm.company_id = c.id
       WHERE cm.user_id = ${userId}`,
    );

    // Get all permission codes across all company roles
    const permRows: { code: string }[] = await this.prisma.$queryRawUnsafe(
      `SELECT DISTINCT p.code FROM finsync."CompanyMember" cm
       JOIN finsync."CompanyRole" r ON cm.company_role_id = r.id
       JOIN finsync."CompanyRolePermission" crp ON crp.role_id = r.id
       JOIN finsync."Permission" p ON p.id = crp.permission_id
       WHERE cm.user_id = ${userId}`,
    );

    // Get per-company permissions
    const companies: {
      id: number;
      name: string;
      role: string;
      companyRoleId: number | null;
      permissions: string[];
    }[] = [];
    for (const m of memberRows) {
      let perms: string[] = [];
      if (m.company_role_id) {
        const rolePerms: { code: string }[] = await this.prisma.$queryRawUnsafe(
          `SELECT p.code FROM finsync."CompanyRolePermission" crp
           JOIN finsync."Permission" p ON p.id = crp.permission_id
           WHERE crp.role_id = ${m.company_role_id}`,
        );
        perms = rolePerms.map((p) => p.code);
      }
      companies.push({
        id: m.company_id,
        name: m.company_name,
        role: m.role,
        companyRoleId: m.company_role_id,
        permissions: perms,
      });
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      companies,
      permissions: permRows.map((p) => p.code),
    };
  }

  // Get logged in user's assigned company (for non-owners)
  async getMyCompany(userId: number) {
    const member = await this.prisma.companyMember.findFirst({
      where: { userId },
      include: {
        company: {
          select: { id: true, name: true, industry: true, type: true },
        },
      },
    });

    if (!member) {
      // Check if user is an Owner — they may have owned companies instead
      const ownedCompany = await this.prisma.company.findFirst({
        where: { ownerId: userId },
        select: { id: true, name: true, industry: true, type: true },
      });
      if (ownedCompany) {
        return { company: ownedCompany, role: 'Owner' as const };
      }
      throw new NotFoundException(
        'You are not assigned to any company. Contact your owner.',
      );
    }

    return {
      company: member.company,
      role: member.role,
      companyId: member.companyId,
    };
  }

  // Owner creates a staff member and assigns them to a company
  /**
   * Return the list of system roles that can be assigned to an employee.
   * Excludes Owner (single-owner per deployment). Used to populate the
   * "System Role" dropdown in the employee form via the API.
   */
  async getAssignableRoles() {
    return Object.values(SystemRole)
      .filter((r) => r !== SystemRole.Owner)
      .map((role) => ({
        value: role,
        label: role.replace(/([a-z])([A-Z])/g, '$1 $2'),
      }));
  }

  async createStaff(dto: CreateStaffDto, ownerId: number) {
    // 1. Prevent creating users with the Owner role
    if (dto.role === SystemRole.Owner) {
      throw new ForbiddenException(
        'Cannot assign the Owner role to staff members',
      );
    }

    // 2. Verify the Owner actually owns the company they are assigning to
    const company = await this.prisma.company.findUnique({
      where: { id: dto.companyId },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (company.ownerId !== ownerId)
      throw new ForbiddenException('You do not own this company');

    // 3. Check if email is already in use
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    // 4. Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // 5. Use a transaction to create the User AND the CompanyMember link simultaneously
    return this.prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          name: dto.name,
          email: dto.email,
          password: hashedPassword,
          phone: dto.phone,
          role: dto.role,
        },
        select: { id: true, name: true, email: true, phone: true, role: true },
      });

      const memberLink = await prisma.companyMember.create({
        data: {
          userId: newUser.id,
          companyId: dto.companyId,
          role: dto.role,
        },
      });

      // Auto-create employee record so staff appears in personnel, payroll, attendance etc.
      const nameParts = newUser.name.split(' ');
      const firstName = nameParts[0];
      const lastName = nameParts.slice(1).join(' ') || firstName;
      const employeeCode = 'EMP-' + newUser.id;

      const employee = await prisma.employee.create({
        data: {
          companyId: dto.companyId,
          userId: newUser.id,
          employeeCode,
          firstName,
          lastName,
          email: newUser.email,
          designation: dto.role,
          employmentType: dto.employmentType || 'FULL_TIME',
          hourlyRate: dto.hourlyRate,
          dailyRate: dto.dailyRate,
          weeklyRate: dto.weeklyRate,
          baseSalary: dto.baseSalary,
          phone: dto.phone,
        },
      });

      return { user: newUser, companyAssignment: memberLink, employee };
    });
  }

  // Owner updates staff details/role (scoped to staff they own)
  async updateStaff(userId: number, dto: UpdateUserDto, ownerId: number) {
    const userToUpdate = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyMemberships: {
          include: { company: { select: { ownerId: true } } },
        },
      },
    });
    if (!userToUpdate) throw new NotFoundException('User not found');

    // Prevent Owner from editing another Owner
    if (userToUpdate.role === SystemRole.Owner) {
      throw new ForbiddenException('Cannot edit other owners');
    }

    // Verify ownership: the target user must belong to a company owned by the requesting owner
    const isOwnedByRequester = userToUpdate.companyMemberships.some(
      (m) => m.company.ownerId === ownerId,
    );
    if (!isOwnedByRequester) {
      throw new ForbiddenException(
        'You do not manage this staff member in any of your companies',
      );
    }

    // If role is being changed, prevent setting to Owner
    if (dto.role === SystemRole.Owner) {
      throw new ForbiddenException(
        'Cannot assign the Owner role to staff members',
      );
    }

    return this.prisma.$transaction(async (prisma) => {
      // Update user record
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          name: dto.name,
          email: dto.email,
          phone: dto.phone,
          role: dto.role,
        },
        select: { id: true, name: true, email: true, phone: true, role: true },
      });

      // If role changed, update all CompanyMember links for companies this owner controls
      let ownedCompanyIds: number[] = [];
      if (dto.role) {
        ownedCompanyIds = userToUpdate.companyMemberships
          .filter((m) => m.company.ownerId === ownerId)
          .map((m) => m.companyId);

        if (ownedCompanyIds.length > 0) {
          await prisma.companyMember.updateMany({
            where: {
              userId,
              companyId: { in: ownedCompanyIds },
            },
            data: { role: dto.role },
          });
        }
      }

      // ── Staff → Employee sync ──
      // If this user has a linked Employee record, update it too.
      const linkedEmployee = await prisma.employee.findFirst({
        where: { userId },
      });
      if (linkedEmployee) {
        await prisma.employee.update({
          where: { id: linkedEmployee.id },
          data: {
            ...(dto.name && {
              firstName: dto.name.split(' ')[0],
              lastName: dto.name.split(' ').slice(1).join(' ') || dto.name,
            }),
            ...(dto.email !== undefined && { email: dto.email }),
            ...(dto.phone !== undefined && { phone: dto.phone }),
            ...(dto.role && { designation: dto.role }),
          },
        });
      }

      return updatedUser;
    });
  }

  // Owner deletes a staff member (scoped to staff they own)
  async deleteStaff(userId: number, ownerId: number) {
    const userToDelete = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        companyMemberships: {
          include: { company: { select: { ownerId: true } } },
        },
      },
    });
    if (!userToDelete) throw new NotFoundException('User not found');
    if (userToDelete.role === SystemRole.Owner)
      throw new ForbiddenException('Cannot delete owners');

    // Verify ownership: the target user must belong to a company owned by the requesting owner
    const isOwnedByRequester = userToDelete.companyMemberships.some(
      (m) => m.company.ownerId === ownerId,
    );
    if (!isOwnedByRequester) {
      throw new ForbiddenException(
        'You do not manage this staff member in any of your companies',
      );
    }

    // Prisma will automatically cascade delete their CompanyMember links
    return this.prisma.user.delete({ where: { id: userId } });
  }
}

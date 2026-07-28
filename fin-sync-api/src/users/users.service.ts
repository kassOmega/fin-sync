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

  // Get logged in user's profile
  async getMyProfile(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, phone: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
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

      return { user: newUser, companyAssignment: memberLink };
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
      if (dto.role) {
        const ownedCompanyIds = userToUpdate.companyMemberships
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

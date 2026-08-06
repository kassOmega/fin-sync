import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Injectable()
export class CompaniesService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateCompanyDto, ownerId: number) {
    return this.prisma.$transaction(async (tx) => {
      const company = await tx.company.create({
        data: { ...dto, currency: dto.currency || 'USD', ownerId },
      });
      // Auto-create a default store for this company
      await tx.store.create({
        data: { name: company.name, companyId: company.id },
      });
      return company;
    });
  }

  async findAllByOwner(ownerId: number) {
    return this.prisma.company.findMany({
      where: { ownerId },
      include: {
        _count: { select: { members: true, expenses: true, incomes: true } },
      },
    });
  }

  async findOne(id: number) {
    const company = await this.prisma.company.findUnique({ where: { id } });
    if (!company) throw new NotFoundException('Company not found');
    return company;
  }

  // Get all staff members of a company
  async getCompanyStaff(companyId: number) {
    return this.prisma.companyMember.findMany({
      where: { companyId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
          },
        },
      },
    });
  }

  // Owner removes a staff member from the company (deletes CompanyMember + User)
  async removeStaffMember(
    companyId: number,
    memberId: number,
    ownerId: number,
  ) {
    await this.verifyOwnership(companyId, ownerId);

    const member = await this.prisma.companyMember.findUnique({
      where: { id: memberId },
      include: { user: true },
    });
    if (!member || member.companyId !== companyId) {
      throw new NotFoundException('Staff member not found in this company');
    }

    if (member.user.role === 'Owner') {
      throw new ForbiddenException('Cannot remove owners from company staff');
    }

    // Delete the CompanyMember link AND the user
    return this.prisma.$transaction([
      this.prisma.companyMember.delete({ where: { id: memberId } }),
      this.prisma.user.delete({ where: { id: member.userId } }),
    ]);
  }

  // Owner updates a staff member's role within a specific company
  async updateStaffRole(
    companyId: number,
    memberId: number,
    newRole: string,
    ownerId: number,
  ) {
    await this.verifyOwnership(companyId, ownerId);

    if (newRole === 'Owner') {
      throw new ForbiddenException(
        'Cannot assign the Owner role to staff members',
      );
    }

    const member = await this.prisma.companyMember.findUnique({
      where: { id: memberId },
    });
    if (!member || member.companyId !== companyId) {
      throw new NotFoundException('Staff member not found in this company');
    }

    // Update both the CompanyMember role and the User's system role
    return this.prisma.$transaction([
      this.prisma.companyMember.update({
        where: { id: memberId },
        data: { role: newRole as any },
      }),
      this.prisma.user.update({
        where: { id: member.userId },
        data: { role: newRole as any },
      }),
    ]);
  }

  async update(id: number, ownerId: number, dto: UpdateCompanyDto) {
    await this.verifyOwnership(id, ownerId);
    return this.prisma.company.update({ where: { id }, data: dto });
  }

  async remove(id: number, ownerId: number) {
    await this.verifyOwnership(id, ownerId);
    return this.prisma.company.delete({ where: { id } });
  }

  private async verifyOwnership(companyId: number, ownerId: number) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException('Company not found');
    if (company.ownerId !== ownerId)
      throw new ForbiddenException('You do not own this company');
  }
}

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
    return this.prisma.company.create({
      data: { ...dto, currency: dto.currency || 'USD', ownerId },
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

  // Add this method to the CompaniesService class
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

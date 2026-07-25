import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyIncomeDto } from './dto/create-company-income.dto';
import { UpdateCompanyIncomeDto } from './dto/update-company-income.dto';

@Injectable()
export class CompanyIncomesService {
  constructor(private prisma: PrismaService) {}

  async create(
    companyId: number,
    dto: CreateCompanyIncomeDto,
    registeredById: number,
  ) {
    return this.prisma.companyIncome.create({
      data: {
        ...dto,
        companyId,
        date: dto.date ? new Date(dto.date) : new Date(),
        registeredBy: registeredById,
      },
    });
  }

  async findAll(companyId: number) {
    return this.prisma.companyIncome.findMany({
      where: { companyId },
      orderBy: { date: 'desc' },
    });
  }

  async update(id: number, dto: UpdateCompanyIncomeDto) {
    const income = await this.prisma.companyIncome.findUnique({
      where: { id },
    });
    if (!income) throw new NotFoundException('Income record not found');

    return this.prisma.companyIncome.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
  }

  async remove(id: number) {
    const income = await this.prisma.companyIncome.findUnique({
      where: { id },
    });
    if (!income) throw new NotFoundException('Income record not found');
    return this.prisma.companyIncome.delete({ where: { id } });
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyIncomeDto } from './dto/create-company-income.dto';
import { UpdateCompanyIncomeDto } from './dto/update-company-income.dto';

@Injectable()
export class CompanyIncomesService {
  constructor(
    private prisma: PrismaService,
    private ledger: LedgerService,
  ) {}

  async create(
    companyId: number,
    dto: CreateCompanyIncomeDto,
    registeredById: number,
  ) {
    const income = await this.prisma.companyIncome.create({
      data: {
        ...dto,
        companyId,
        date: dto.date ? new Date(dto.date) : new Date(),
        registeredBy: registeredById,
      },
    });

    // Auto-create journal entry: Debit Bank, Credit Income
    try {
      await this.ledger.createAutoEntry(
        companyId,
        {
          sourceType: 'INCOME',
          sourceId: income.id,
          description: `Income: ${dto.category} - ${dto.note || ''}`,
          date: income.date,
          projectId: dto.projectId ?? undefined,
          lines: [
            {
              accountCode: '1001',
              description: 'Cash/Bank received',
              debit: dto.amount,
              credit: 0,
            },
            {
              accountCode: '4100',
              description: dto.category,
              debit: 0,
              credit: dto.amount,
            },
          ],
        },
        registeredById,
      );
    } catch {
      // Journal entry creation should not block the main transaction
    }

    return income;
  }

  async getCategories(companyId: number) {
    const incomes = await this.prisma.companyIncome.findMany({
      where: { companyId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return incomes.map((i) => i.category);
  }

  async findAll(companyId: number) {
    return this.prisma.companyIncome.findMany({
      where: { companyId },
      include: { user: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async findByProject(projectId: number) {
    return this.prisma.companyIncome.findMany({
      where: { projectId },
      include: { user: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async getCategoriesByProject(companyId: number, projectId: number) {
    const incomes = await this.prisma.companyIncome.findMany({
      where: { companyId, projectId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return incomes.map((i) => i.category);
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
    await this.prisma.companyIncome.delete({ where: { id } });
    return { id, deleted: true };
  }
}

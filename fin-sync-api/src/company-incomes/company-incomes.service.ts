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
              ...(dto.accountId
                ? { accountId: dto.accountId }
                : {
                    accountId:
                      (await this.ledger.resolveAccountForCategory(
                        companyId,
                        dto.category,
                      )) || undefined,
                    ...((await this.ledger.resolveAccountForCategory(
                      companyId,
                      dto.category,
                    ))
                      ? {}
                      : { accountCode: '4100' }),
                  }),
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

  async update(id: number, dto: UpdateCompanyIncomeDto, userId?: number) {
    const income = await this.prisma.companyIncome.findUnique({
      where: { id },
    });
    if (!income) throw new NotFoundException('Income record not found');

    const updated = await this.prisma.companyIncome.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });

    // Void old journal entry, then re-post with new values (ledger consistency)
    try {
      await this.ledger.voidBySource(income.companyId, 'INCOME', id);
      if (dto.amount !== undefined || dto.category !== undefined || dto.date) {
        await this.ledger.createAutoEntry(
          income.companyId,
          {
            sourceType: 'INCOME',
            sourceId: id,
            description: `Income: ${updated.category} - ${updated.note || ''}`,
            date: updated.date,
            projectId: updated.projectId ?? undefined,
            lines: [
              {
                accountCode: '1001',
                description: 'Cash/Bank received',
                debit: updated.amount,
                credit: 0,
              },
              {
                accountCode: '4100',
                description: updated.category,
                debit: 0,
                credit: updated.amount,
              },
            ],
          },
          userId,
        );
      }
    } catch {
      // Journal sync should not block the main update
    }

    return updated;
  }

  async remove(id: number) {
    const income = await this.prisma.companyIncome.findUnique({
      where: { id },
    });
    if (!income) throw new NotFoundException('Income record not found');

    // Void the linked journal entry (soft-void, never hard-delete)
    try {
      await this.ledger.voidBySource(income.companyId, 'INCOME', id);
    } catch {
      // Journal sync should not block the deletion
    }

    await this.prisma.companyIncome.delete({ where: { id } });
    return { id, deleted: true };
  }
}

import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SystemRole } from '@prisma/client';
import { guessCategory } from '../common/utils/category-guesser';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCompanyExpenseDto } from './dto/create-company-expense.dto';
import { UpdateCompanyExpenseDto } from './dto/update-company-expense.dto';

@Injectable()
export class CompanyExpensesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(
    companyId: number,
    dto: CreateCompanyExpenseDto,
    registeredById: number,
  ) {
    let finalCategory = dto.category;
    if (!finalCategory && dto.note) {
      finalCategory = guessCategory(dto.note) || 'Misc';
    }

    const expense = await this.prisma.companyExpense.create({
      data: {
        ...dto,
        category: finalCategory,
        companyId,
        date: dto.date ? new Date(dto.date) : new Date(),
        registeredBy: registeredById,
      },
    });

    // Notify company members about large expenses
    if (dto.amount > 1000) {
      await this.notifications.notifyCompany(
        companyId,
        '💰 Large Expense Recorded',
        `A ${finalCategory} expense of $${dto.amount} was recorded.`,
        registeredById,
      );
    }

    return expense;
  }

  async getCategories(companyId: number) {
    const expenses = await this.prisma.companyExpense.findMany({
      where: { companyId },
      select: { category: true },
      distinct: ['category'],
      orderBy: { category: 'asc' },
    });
    return expenses.map((e) => e.category);
  }

  async findAll(companyId: number, user: any) {
    const where =
      user.role === SystemRole.Cashier
        ? { companyId, registeredBy: user.id }
        : { companyId };
    return this.prisma.companyExpense.findMany({
      where,
      include: { user: { select: { name: true } } },
      orderBy: { date: 'desc' },
    });
  }

  async update(id: number, dto: UpdateCompanyExpenseDto, user: any) {
    const expense = await this.prisma.companyExpense.findUnique({
      where: { id },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    if (user.role === SystemRole.Cashier) {
      if (expense.registeredBy !== user.id)
        throw new ForbiddenException('You can only edit your own entries');
      const today = new Date();
      const expDate = new Date(expense.date);
      if (today.toDateString() !== expDate.toDateString()) {
        throw new ForbiddenException(
          'Cashiers can only edit expenses on the day they were created',
        );
      }
    }

    return this.prisma.companyExpense.update({
      where: { id },
      data: { ...dto, date: dto.date ? new Date(dto.date) : undefined },
    });
  }

  async remove(id: number, user: any) {
    const expense = await this.prisma.companyExpense.findUnique({
      where: { id },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    if (user.role === SystemRole.Cashier) {
      if (expense.registeredBy !== user.id)
        throw new ForbiddenException('You can only delete your own entries');
      const today = new Date();
      const expDate = new Date(expense.date);
      if (today.toDateString() !== expDate.toDateString()) {
        throw new ForbiddenException(
          'Cashiers can only delete expenses on the day they were created',
        );
      }
    }

    return this.prisma.companyExpense.delete({ where: { id } });
  }
}

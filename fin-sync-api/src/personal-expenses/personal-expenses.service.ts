import { Injectable, NotFoundException } from '@nestjs/common';
import { BudgetType } from '@prisma/client';
import { guessCategory } from '../common/utils/category-guesser';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePersonalExpenseDto } from './dto/create-personal-expense.dto';
import { UpdatePersonalExpenseDto } from './dto/update-personal-expense.dto';

@Injectable()
export class PersonalExpensesService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  async create(dto: CreatePersonalExpenseDto, userId: number) {
    let finalCategory = dto.category;
    if (!finalCategory && dto.note) {
      finalCategory = guessCategory(dto.note) || 'Misc';
    }
    return this.prisma.$transaction(async (prisma) => {
      const expense = await prisma.personalExpense.create({
        data: {
          amount: dto.amount,
          category: finalCategory,
          note: dto.note,
          isCategorized: dto.isCategorized ?? false,
          date: dto.date ? new Date(dto.date) : new Date(),
          accountId: dto.accountId ? parseInt(dto.accountId) : null,
          userId,
        },
      });

      // If an account is selected, decrement its balance
      if (expense.accountId) {
        await prisma.personalAccount.update({
          where: { id: expense.accountId },
          data: { balance: { decrement: expense.amount } },
        });
      }

      // Check budget status after adding expense
      if (expense.category) {
        const budget = await prisma.personalBudget.findFirst({
          where: { userId, category: expense.category },
        });
        if (budget) {
          const spent = await prisma.personalExpense.aggregate({
            where: { userId, category: expense.category },
            _sum: { amount: true },
          });
          const totalSpent = spent._sum.amount || 0;
          const remaining = budget.amount - totalSpent;

          if (remaining < 0) {
            await this.notifications.notifyUser(
              userId,
              '⚠️ Budget Exceeded',
              `You've exceeded your "${expense.category}" budget of $${budget.amount} by $${Math.abs(remaining).toFixed(2)}.`,
            );
          } else if (remaining < budget.amount * 0.2) {
            await this.notifications.notifyUser(
              userId,
              '⚡ Budget Almost Gone',
              `Only $${remaining.toFixed(2)} left in your "${expense.category}" budget.`,
            );
          }
        }
      }

      return expense;
    });
  }

  async findAll(userId: number, category?: string, isCategorized?: boolean) {
    return this.prisma.personalExpense.findMany({
      where: {
        userId,
        category,
        isCategorized,
      },
      orderBy: { date: 'desc' },
    });
  }
  async update(id: number, dto: UpdatePersonalExpenseDto, userId: number) {
    const expense = await this.prisma.personalExpense.findFirst({
      where: { id, userId },
    });
    if (!expense) throw new NotFoundException('Expense not found');

    // Check if category is being updated
    if (dto.category && dto.category !== expense.category) {
      const budgetExists = await this.prisma.personalBudget.findFirst({
        where: { userId, category: dto.category },
      });

      // If it's a new category and not "Misc", auto-create a budget starting on the expense's date
      if (
        !budgetExists &&
        dto.category !== 'Misc' &&
        dto.category !== 'Uncategorized'
      ) {
        await this.prisma.personalBudget.create({
          data: {
            userId,
            category: dto.category,
            amount: 0, // User can update the limit later
            frequency: BudgetType.MONTHLY,
            startDate: expense.date, // Start tracking from the expense date
          },
        });
      }
    }

    return this.prisma.$transaction(async (prisma) => {
      if (dto.accountId !== undefined) {
        const newAccountId = dto.accountId ? parseInt(dto.accountId) : null;
        if (expense.accountId) {
          await prisma.personalAccount.update({
            where: { id: expense.accountId },
            data: { balance: { increment: expense.amount } },
          });
        }
        if (newAccountId) {
          await prisma.personalAccount.update({
            where: { id: newAccountId },
            data: { balance: { decrement: expense.amount } },
          });
        }
      }

      return prisma.personalExpense.update({
        where: { id },
        data: {
          ...dto,
          accountId:
            dto.accountId !== undefined
              ? dto.accountId
                ? parseInt(dto.accountId)
                : null
              : undefined,
          date: dto.date ? new Date(dto.date) : undefined,
        },
      });
    });
  }

  async remove(id: number, userId: number) {
    const expense = await this.prisma.personalExpense.findFirst({
      where: { id, userId },
    });
    if (!expense) throw new NotFoundException('Expense not found');
    return this.prisma.personalExpense.delete({ where: { id } });
  }
}

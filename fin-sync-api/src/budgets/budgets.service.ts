import { Injectable, NotFoundException } from '@nestjs/common';
import { BudgetType } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BudgetsService {
  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Helper: Find the start of the current cycle based on the budget's startDate
  private getCurrentCycleStart(startDate: Date, frequency: BudgetType): Date {
    const now = new Date();
    let currentStart = new Date(startDate);

    if (currentStart > now) return currentStart;

    if (frequency === BudgetType.DAILY) {
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    }

    while (true) {
      const nextStart = new Date(currentStart);
      if (frequency === BudgetType.WEEKLY)
        nextStart.setDate(nextStart.getDate() + 7);
      if (frequency === BudgetType.MONTHLY)
        nextStart.setMonth(nextStart.getMonth() + 1);
      if (frequency === BudgetType.YEARLY)
        nextStart.setFullYear(nextStart.getFullYear() + 1);

      if (nextStart > now) break;
      currentStart = nextStart;
    }
    return currentStart;
  }

  async create(
    dto: {
      category: string;
      amount: number;
      frequency: BudgetType;
      startDate?: string;
    },
    userId: number,
  ) {
    const existing = await this.prisma.personalBudget.findFirst({
      where: { userId, category: dto.category },
    });
    if (existing) throw new NotFoundException('Budget category already exists');

    const budget = await this.prisma.personalBudget.create({
      data: {
        userId,
        category: dto.category,
        amount: dto.amount,
        frequency: dto.frequency,
        startDate: dto.startDate ? new Date(dto.startDate) : new Date(),
      },
    });

    // Notify user about new budget
    await this.notifications.notifyUser(
      userId,
      '📊 Budget Created',
      `New budget "${dto.category}" created with $${dto.amount} (${dto.frequency.toLowerCase()}).`,
    );

    return budget;
  }

  async findAll(userId: number) {
    const budgets = await this.prisma.personalBudget.findMany({
      where: { userId },
    });

    const budgetsWithSpent = await Promise.all(
      budgets.map(async (b) => {
        const cycleStart = this.getCurrentCycleStart(
          new Date(b.startDate),
          b.frequency,
        );

        const expenses = await this.prisma.personalExpense.findMany({
          where: {
            userId,
            category: b.category,
            date: { gte: cycleStart },
          },
        });

        const spent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
        return { ...b, spent };
      }),
    );

    return budgetsWithSpent;
  }

  async update(
    id: number,
    dto: { category?: string; amount?: number; frequency?: BudgetType },
    userId: number,
  ) {
    const budget = await this.prisma.personalBudget.findFirst({
      where: { id, userId },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return this.prisma.personalBudget.update({ where: { id }, data: dto });
  }

  async remove(id: number, userId: number) {
    const budget = await this.prisma.personalBudget.findFirst({
      where: { id, userId },
    });
    if (!budget) throw new NotFoundException('Budget not found');
    return this.prisma.personalBudget.delete({ where: { id } });
  }
}

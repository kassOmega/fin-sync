import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PersonalFinanceService {
  constructor(private prisma: PrismaService) {}

  // 1. Get today's budget status (Prompts the user)
  async getBudgetStatus(userId: number) {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const budget = await this.prisma.personalBudget.findFirst({
      where: { userId, frequency: 'DAILY' },
    });

    if (!budget) throw new NotFoundException('Daily budget not found');

    const expensesToday = await this.prisma.personalExpense.findMany({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } },
    });

    const totalSpent = expensesToday.reduce((sum, exp) => sum + exp.amount, 0);
    const remaining = budget.amount - totalSpent;

    let prompt: { action: string; message: string; amount: number } | null =
      null;
    if (remaining < 0) {
      prompt = {
        action: 'BORROW',
        message: `You exceeded your budget by $${Math.abs(remaining)}. Do you want to borrow from tomorrow?`,
        amount: Math.abs(remaining),
      };
    } else if (remaining > 0 && remaining > budget.amount * 0.2) {
      prompt = {
        action: 'ROLLOVER',
        message: `You have $${remaining} left. Roll over to tomorrow or add to savings?`,
        amount: remaining,
      };
    }

    return { budget: budget.amount, spent: totalSpent, remaining, prompt };
  }

  // 2. Execute Rollover (Pass to next day or add to savings)
  async executeRollover(
    userId: number,
    action: 'ROLLOVER' | 'SAVINGS',
    amount: number,
  ) {
    if (action === 'ROLLOVER') {
      // Create a budget entry for the rollover amount
      await this.prisma.personalBudget.create({
        data: {
          userId,
          category: 'Rollover',
          amount: amount,
          frequency: 'DAILY',
        },
      });
      return {
        message: `Successfully rolled over $${amount} to tomorrow's budget.`,
      };
    } else {
      // Add to savings goal
      const savings = await this.prisma.personalSaving.findFirst({
        where: { userId },
      });
      if (savings) {
        await this.prisma.personalSaving.update({
          where: { id: savings.id },
          data: { currentAmount: { increment: amount } },
        });
      }
      return { message: `Successfully added $${amount} to your savings goal.` };
    }
  }

  // 3. Execute Borrow (Take from tomorrow's budget)
  async executeBorrow(userId: number, amount: number) {
    // Create a negative-amount budget entry to track the borrow
    await this.prisma.personalBudget.create({
      data: {
        userId,
        category: 'Borrow',
        amount: -amount,
        frequency: 'DAILY',
      },
    });
    return {
      message: `Successfully borrowed $${amount} from tomorrow's budget.`,
    };
  }
}

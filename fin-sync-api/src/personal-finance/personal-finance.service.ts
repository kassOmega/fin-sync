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
      where: { userId, type: 'DAILY' },
    });

    if (!budget) throw new NotFoundException('Daily budget not found');

    const expensesToday = await this.prisma.personalExpense.findMany({
      where: { userId, date: { gte: startOfDay, lte: endOfDay } },
    });

    const totalSpent = expensesToday.reduce((sum, exp) => sum + exp.amount, 0);
    const effectiveBudget = budget.amount + budget.carriedOverAmount;
    const remaining = effectiveBudget - totalSpent;

    let prompt: { action: string; message: string; amount: number } | null =
      null;
    if (remaining < 0) {
      prompt = {
        action: 'BORROW',
        message: `You exceeded your budget by $${Math.abs(remaining)}. Do you want to borrow from tomorrow?`,
        amount: Math.abs(remaining),
      };
    } else if (remaining > 0 && remaining > effectiveBudget * 0.2) {
      prompt = {
        action: 'ROLLOVER',
        message: `You have $${remaining} left. Roll over to tomorrow or add to savings?`,
        amount: remaining,
      };
    }

    return { budget: effectiveBudget, spent: totalSpent, remaining, prompt };
  }

  // 2. Execute Rollover (Pass to next day or add to savings)
  async executeRollover(
    userId: number,
    action: 'ROLLOVER' | 'SAVINGS',
    amount: number,
  ) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (action === 'ROLLOVER') {
      // Find or create tomorrow's budget and add the amount
      await this.prisma.personalBudget.updateMany({
        where: { userId, type: 'DAILY' },
        data: { carriedOverAmount: { increment: amount } },
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
    await this.prisma.personalBudget.updateMany({
      where: { userId, type: 'DAILY' },
      data: { carriedOverAmount: { decrement: amount } },
    });
    return {
      message: `Successfully borrowed $${amount} from tomorrow's budget.`,
    };
  }
}

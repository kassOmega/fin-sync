import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutomationService {
  private readonly logger = new Logger(AutomationService.name);

  constructor(private prisma: PrismaService) {}

  // Run at 2:00 AM every day
  @Cron('0 2 * * *')
  async handleRecurringTransactions() {
    this.logger.log('Running recurring transactions cron job...');
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
    );

    // 1. Process Company Expenses
    const companyRecurring = await this.prisma.companyExpense.findMany({
      where: { isRecurring: true, date: { lt: startOfDay } },
    });

    for (const exp of companyRecurring) {
      // Check if it should run today based on frequency (Simple logic: run monthly on the same day)
      if (
        exp.recurringFrequency === 'MONTHLY' &&
        today.getDate() === new Date(exp.date).getDate()
      ) {
        await this.prisma.companyExpense.create({
          data: {
            companyId: exp.companyId,
            registeredBy: exp.registeredBy,
            amount: exp.amount,
            category: exp.category,
            note: `${exp.note || 'Recurring'} (Auto)`,
            date: today,
            // Do not set isRecurring on the new one to prevent infinite multiplication
          },
        });
      }
    }

    // 2. Process Personal Expenses
    const personalRecurring = await this.prisma.personalExpense.findMany({
      where: { isRecurring: true, date: { lt: startOfDay } },
    });

    for (const exp of personalRecurring) {
      if (
        exp.recurringFrequency === 'MONTHLY' &&
        today.getDate() === new Date(exp.date).getDate()
      ) {
        await this.prisma.personalExpense.create({
          data: {
            userId: exp.userId,
            amount: exp.amount,
            category: exp.category,
            note: `${exp.note || 'Recurring'} (Auto)`,
            isCategorized: true,
            date: today,
          },
        });
      }
    }

    this.logger.log('Recurring transactions cron job completed.');
  }
}

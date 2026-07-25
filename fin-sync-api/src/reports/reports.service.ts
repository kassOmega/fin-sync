import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getCompanyReport(
    companyId: number,
    startDate?: string,
    endDate?: string,
  ) {
    const where = {
      companyId,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    const incomes = await this.prisma.companyIncome.findMany({ where });
    const expenses = await this.prisma.companyExpense.findMany({ where });

    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const profit = totalIncome - totalExpense;

    const expensesByCategory = expenses.reduce((acc, exp) => {
      acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
      return acc;
    }, {});

    const incomesByCategory = incomes.reduce((acc, inc) => {
      acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
      return acc;
    }, {});

    return {
      totalIncome,
      totalExpense,
      profit,
      expensesByCategory,
      incomesByCategory,
    };
  }

  async getPersonalReport(userId: number) {
    const budgets = await this.prisma.personalBudget.findMany({
      where: { userId },
    });
    const expenses = await this.prisma.personalExpense.findMany({
      where: { userId },
    });

    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const remaining = totalBudget - totalSpent;

    let tag = 'Appreciative';
    if (remaining < 0) tag = 'Complaining';
    else if (remaining < totalBudget * 0.2) tag = 'Inspiring';

    const expensesByCategory = expenses.reduce((acc, exp) => {
      const cat = exp.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + exp.amount;
      return acc;
    }, {});

    return { totalBudget, totalSpent, remaining, tag, expensesByCategory };
  }
  // Add these methods to the class
  async getMachineryReport(machineryId: number) {
    const expenses = await this.prisma.companyExpense.findMany({
      where: { machineryId },
    });
    const incomes = await this.prisma.companyIncome.findMany({
      where: { machineryId },
    });
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    return {
      totalIncome,
      totalExpense,
      profit: totalIncome - totalExpense,
      incomes,
      expenses,
    };
  }

  async getProjectReport(projectId: number) {
    const expenses = await this.prisma.companyExpense.findMany({
      where: { projectId },
    });
    const incomes = await this.prisma.companyIncome.findMany({
      where: { projectId },
    });
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
    return {
      totalIncome,
      totalExpense,
      profit: totalIncome - totalExpense,
      incomes,
      expenses,
    };
  }

  // Cumulative Report for ALL Projects in a Company
  async getAllProjectsReport(companyId: number) {
    const projects = await this.prisma.project.findMany({
      where: { companyId },
      include: { expenses: true, incomes: true },
    });

    const chartData = projects.map((p) => {
      const totalIncome = p.incomes.reduce((s, i) => s + i.amount, 0);
      const totalExpense = p.expenses.reduce((s, e) => s + e.amount, 0);
      return {
        name: p.name,
        Income: totalIncome,
        Expenses: totalExpense,
        Profit: totalIncome - totalExpense,
      };
    });

    const totalIncomeAll = chartData.reduce((s, p) => s + p.Income, 0);
    const totalExpenseAll = chartData.reduce((s, p) => s + p.Expenses, 0);

    return {
      summary: {
        totalIncome: totalIncomeAll,
        totalExpense: totalExpenseAll,
        totalProfit: totalIncomeAll - totalExpenseAll,
      },
      chartData,
    };
  }

  // Cumulative Report for ALL Machineries in a Company
  async getAllMachineriesReport(companyId: number) {
    const machineries = await this.prisma.machinery.findMany({
      where: { companyId },
      include: { expenses: true, incomes: true },
    });

    const chartData = machineries.map((m) => {
      const totalIncome = m.incomes.reduce((s, i) => s + i.amount, 0);
      const totalExpense = m.expenses.reduce((s, e) => s + e.amount, 0);
      return {
        name: m.name,
        Income: totalIncome,
        Expenses: totalExpense,
        Profit: totalIncome - totalExpense,
        Hours: m.runningHours,
      };
    });

    const totalIncomeAll = chartData.reduce((s, m) => s + m.Income, 0);
    const totalExpenseAll = chartData.reduce((s, m) => s + m.Expenses, 0);

    return {
      summary: {
        totalIncome: totalIncomeAll,
        totalExpense: totalExpenseAll,
        totalProfit: totalIncomeAll - totalExpenseAll,
      },
      chartData,
    };
  }

  // Predict future cash flow based on 3-month average
  async getCompanyForecast(companyId: number) {
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    const incomes = await this.prisma.companyIncome.findMany({
      where: { companyId, date: { gte: threeMonthsAgo } },
    });
    const expenses = await this.prisma.companyExpense.findMany({
      where: { companyId, date: { gte: threeMonthsAgo } },
    });

    const totalIncome = incomes.reduce((sum, inc) => sum + inc.amount, 0);
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.amount, 0);

    // Calculate daily averages over ~90 days
    const dailyIncomeRate = totalIncome / 90;
    const dailyExpenseRate = totalExpense / 90;
    const dailyNetRate = dailyIncomeRate - dailyExpenseRate;

    // Project for next 30 days
    const forecastData: { day: string; projectedBalance: number }[] = [];
    let projectedBalance = 0; // Assuming starting from 0, or you could fetch current balance

    for (let i = 1; i <= 30; i++) {
      projectedBalance += dailyNetRate;
      forecastData.push({
        day: `Day ${i}`,
        projectedBalance: Math.round(projectedBalance * 100) / 100,
      });
    }

    return {
      dailyIncomeRate: Math.round(dailyIncomeRate * 100) / 100,
      dailyExpenseRate: Math.round(dailyExpenseRate * 100) / 100,
      isGrowing: dailyNetRate >= 0,
      forecastData,
    };
  }
}

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
    const now = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const budgets = await this.prisma.personalBudget.findMany({
      where: { userId },
    });
    const expenses = await this.prisma.personalExpense.findMany({
      where: { userId },
    });
    const incomes = await this.prisma.personalIncome.findMany({
      where: { userId },
    });
    const savings = await this.prisma.personalSaving.findMany({
      where: { userId },
    });
    const accounts = await this.prisma.personalAccount.findMany({
      where: { userId },
    });

    const totalBudget = budgets.reduce((s, b) => s + b.amount, 0);
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
    const totalSavingsTarget = savings.reduce(
      (s, sv) => s + sv.targetAmount,
      0,
    );
    const totalSavingsCurrent = savings.reduce(
      (s, sv) => s + sv.currentAmount,
      0,
    );
    const remaining = totalBudget - totalSpent;
    const netWorth = totalIncome - totalSpent + totalSavingsCurrent;

    let tag = 'Appreciative';
    if (remaining < 0) tag = 'Complaining';
    else if (remaining < totalBudget * 0.2) tag = 'Inspiring';

    const expensesByCategory = expenses.reduce((acc, exp) => {
      const cat = exp.category || 'Uncategorized';
      acc[cat] = (acc[cat] || 0) + exp.amount;
      return acc;
    }, {});

    // Budget by category with spent
    const budgetDetails = budgets.map((b) => {
      const spent = expenses
        .filter((e) => e.category === b.category)
        .reduce((s, e) => s + e.amount, 0);
      return {
        category: b.category,
        amount: b.amount,
        frequency: b.frequency,
        spent,
        remaining: b.amount - spent,
        percentage: b.amount > 0 ? Math.min((spent / b.amount) * 100, 100) : 0,
      };
    });

    // Monthly breakdown (last 6 months)
    const monthlyData: Record<string, { income: number; expense: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      });
      monthlyData[key] = { income: 0, expense: 0 };
    }

    expenses.forEach((e) => {
      const d = new Date(e.date);
      const key = d.toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      });
      if (monthlyData[key]) monthlyData[key].expense += e.amount;
    });
    incomes.forEach((inc) => {
      const d = new Date(inc.date);
      const key = d.toLocaleString('default', {
        month: 'short',
        year: '2-digit',
      });
      if (monthlyData[key]) monthlyData[key].income += inc.amount;
    });

    const monthlyChart = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      income: Math.round(data.income * 100) / 100,
      expense: Math.round(data.expense * 100) / 100,
    }));

    // Forecast (30-day projection based on averages)
    const dailyAvgIncome =
      monthlyChart.length > 0
        ? monthlyChart.reduce((s, m) => s + m.income, 0) /
          (monthlyChart.length * 30)
        : 0;
    const dailyAvgExpense =
      monthlyChart.length > 0
        ? monthlyChart.reduce((s, m) => s + m.expense, 0) /
          (monthlyChart.length * 30)
        : 0;
    const dailyNetRate = dailyAvgIncome - dailyAvgExpense;

    const forecastData: {
      day: string;
      projectedBalance: number;
      projectedIncome: number;
      projectedExpense: number;
    }[] = [];
    let projectedBalance = 0;
    for (let i = 1; i <= 30; i++) {
      projectedBalance += dailyNetRate;
      forecastData.push({
        day: `Day ${i}`,
        projectedBalance: Math.round(projectedBalance * 100) / 100,
        projectedIncome: Math.round(dailyAvgIncome * 100) / 100,
        projectedExpense: Math.round(dailyAvgExpense * 100) / 100,
      });
    }

    const forecastFinalBalance =
      forecastData.length > 0
        ? forecastData[forecastData.length - 1].projectedBalance
        : 0;

    const totalAccountBalance = accounts.reduce((s, a) => s + a.balance, 0);

    return {
      totalBudget,
      totalSpent,
      totalIncome,
      totalSavingsTarget,
      totalSavingsCurrent,
      totalAccountBalance,
      remaining,
      netWorth,
      tag,
      expensesByCategory,
      budgetDetails,
      accounts: accounts.map((a) => ({
        id: a.id,
        name: a.name,
        balance: a.balance,
      })),
      monthlyChart,
      forecast: {
        dailyAvgIncome: Math.round(dailyAvgIncome * 100) / 100,
        dailyAvgExpense: Math.round(dailyAvgExpense * 100) / 100,
        isGrowing: dailyNetRate >= 0,
        finalProjectedBalance: forecastFinalBalance,
        forecastData,
      },
    };
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

  async getCompanyExportData(companyId: number) {
    const incomes = await this.prisma.companyIncome.findMany({
      where: { companyId },
      include: { user: { select: { name: true } } },
      orderBy: { date: 'asc' },
    });
    const expenses = await this.prisma.companyExpense.findMany({
      where: { companyId },
      include: { user: { select: { name: true } } },
      orderBy: { date: 'asc' },
    });
    return { incomes, expenses };
  }
}

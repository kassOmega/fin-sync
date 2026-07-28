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
    const sales = await this.prisma.sale.findMany({
      where: { companyId, date: where.date },
      include: {
        items: {
          include: {
            storeItem: { select: { category: { select: { name: true } } } },
          },
        },
      },
    });
    const purchases = await this.prisma.purchase.findMany({
      where: { companyId, date: where.date },
      include: {
        items: {
          include: {
            storeItem: { select: { category: { select: { name: true } } } },
          },
        },
      },
    });

    const totalSalesRevenue = sales.reduce((sum, s) => sum + s.totalAmount, 0);
    const totalPurchasesCost = purchases.reduce(
      (sum, p) => sum + p.totalAmount,
      0,
    );

    // Sales are income, purchases are expenses
    const totalIncome =
      incomes.reduce((sum, inc) => sum + inc.amount, 0) + totalSalesRevenue;
    const totalExpense =
      expenses.reduce((sum, exp) => sum + exp.amount, 0) + totalPurchasesCost;
    const profit = totalIncome - totalExpense;

    // Merge expense categories
    const expensesByCategory = expenses.reduce(
      (acc, exp) => {
        acc[exp.category] = (acc[exp.category] || 0) + exp.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Merge purchase amounts into expenses by category
    purchases.forEach((p) => {
      p.items.forEach((pi) => {
        const cat = pi.storeItem?.category?.name || 'Uncategorized Purchases';
        expensesByCategory[cat] = (expensesByCategory[cat] || 0) + pi.total;
      });
    });

    // Merge income categories
    const incomesByCategory = incomes.reduce(
      (acc, inc) => {
        acc[inc.category] = (acc[inc.category] || 0) + inc.amount;
        return acc;
      },
      {} as Record<string, number>,
    );

    // Merge sale amounts into incomes by category
    sales.forEach((s) => {
      s.items.forEach((si) => {
        const cat = si.storeItem?.category?.name || 'Uncategorized Sales';
        incomesByCategory[cat] = (incomesByCategory[cat] || 0) + si.total;
      });
    });

    return {
      totalIncome,
      totalExpense,
      totalSales: totalSalesRevenue,
      totalPurchases: totalPurchasesCost,
      profit,
      expensesByCategory,
      incomesByCategory,
      salesCount: sales.length,
      purchasesCount: purchases.length,
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

  async getInventoryReport(companyId: number) {
    const items = await this.prisma.storeItem.findMany({
      where: { companyId },
      include: {
        category: { select: { id: true, name: true } },
        saleItems: {
          include: {
            sale: { select: { id: true, date: true, totalAmount: true } },
          },
        },
        purchaseItems: {
          include: {
            purchase: { select: { id: true, date: true, totalAmount: true } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return items.map((item) => {
      const totalSold = item.saleItems.reduce((s, si) => s + si.quantity, 0);
      const totalPurchased = item.purchaseItems.reduce(
        (s, pi) => s + pi.quantity,
        0,
      );
      const saleRevenue = item.saleItems.reduce((s, si) => s + si.total, 0);
      const purchaseCost = item.purchaseItems.reduce(
        (s, pi) => s + pi.total,
        0,
      );

      return {
        id: item.id,
        name: item.name,
        category: item.category?.name || 'Uncategorized',
        quantity: item.quantity,
        sellingPrice: item.sellingPrice,
        costPrice: item.costPrice,
        unit: item.unit,
        totalSold,
        totalPurchased,
        saleRevenue: Math.round(saleRevenue * 100) / 100,
        purchaseCost: Math.round(purchaseCost * 100) / 100,
        profitMargin: saleRevenue - purchaseCost,
      };
    });
  }

  async getSalesReport(
    companyId: number,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {
      companyId,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    const sales = await this.prisma.sale.findMany({
      where,
      include: {
        customer: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        items: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const totalRevenue = sales.reduce((s, sale) => s + sale.totalAmount, 0);
    const totalDiscount = sales.reduce((s, sale) => s + sale.discount, 0);
    const totalItems = sales.reduce((s, sale) => s + sale.items.length, 0);

    // Sales by category
    const salesByCategory: Record<string, number> = {};
    sales.forEach((sale) => {
      sale.items.forEach((si) => {
        const cat = si.storeItem?.category?.name || 'Uncategorized';
        salesByCategory[cat] = (salesByCategory[cat] || 0) + si.total;
      });
    });

    // Sales by customer
    const salesByCustomer: Record<string, { count: number; total: number }> =
      {};
    sales.forEach((sale) => {
      const customerName = sale.customer?.name || 'Walk-in';
      if (!salesByCustomer[customerName]) {
        salesByCustomer[customerName] = { count: 0, total: 0 };
      }
      salesByCustomer[customerName].count += 1;
      salesByCustomer[customerName].total += sale.totalAmount;
    });

    return {
      summary: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalDiscount: Math.round(totalDiscount * 100) / 100,
        totalItemsSold: totalItems,
        saleCount: sales.length,
        averageSaleValue:
          sales.length > 0
            ? Math.round((totalRevenue / sales.length) * 100) / 100
            : 0,
      },
      salesByCategory,
      salesByCustomer,
      sales: sales.map((s) => ({
        id: s.id,
        date: s.date,
        totalAmount: s.totalAmount,
        discount: s.discount,
        note: s.note,
        customer: s.customer?.name || 'Walk-in',
        registeredBy: s.user?.name,
        items: s.items.map((si) => ({
          itemName: si.storeItem?.name || 'Unknown',
          category: si.storeItem?.category?.name || 'Uncategorized',
          quantity: si.quantity,
          unitPrice: si.unitPrice,
          total: si.total,
        })),
      })),
    };
  }

  async getPurchasesReport(
    companyId: number,
    startDate?: string,
    endDate?: string,
  ) {
    const where: any = {
      companyId,
      date: {
        gte: startDate ? new Date(startDate) : undefined,
        lte: endDate ? new Date(endDate) : undefined,
      },
    };

    const purchases = await this.prisma.purchase.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        items: {
          include: {
            storeItem: {
              select: {
                id: true,
                name: true,
                category: { select: { name: true } },
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
    });

    const totalSpent = purchases.reduce((s, p) => s + p.totalAmount, 0);
    const totalItems = purchases.reduce((s, p) => s + p.items.length, 0);

    // Purchases by category
    const purchasesByCategory: Record<string, number> = {};
    purchases.forEach((p) => {
      p.items.forEach((pi) => {
        const cat = pi.storeItem?.category?.name || 'Uncategorized';
        purchasesByCategory[cat] = (purchasesByCategory[cat] || 0) + pi.total;
      });
    });

    // Purchases by supplier
    const purchasesBySupplier: Record<
      string,
      { count: number; total: number }
    > = {};
    purchases.forEach((p) => {
      const supplierName = p.supplier?.name || 'Unknown';
      if (!purchasesBySupplier[supplierName]) {
        purchasesBySupplier[supplierName] = { count: 0, total: 0 };
      }
      purchasesBySupplier[supplierName].count += 1;
      purchasesBySupplier[supplierName].total += p.totalAmount;
    });

    return {
      summary: {
        totalSpent: Math.round(totalSpent * 100) / 100,
        totalItemsPurchased: totalItems,
        purchaseCount: purchases.length,
        averagePurchaseValue:
          purchases.length > 0
            ? Math.round((totalSpent / purchases.length) * 100) / 100
            : 0,
      },
      purchasesByCategory,
      purchasesBySupplier,
      purchases: purchases.map((p) => ({
        id: p.id,
        date: p.date,
        totalAmount: p.totalAmount,
        note: p.note,
        supplier: p.supplier?.name || 'Unknown',
        registeredBy: p.user?.name,
        items: p.items.map((pi) => ({
          itemName: pi.storeItem?.name || 'Unknown',
          category: pi.storeItem?.category?.name || 'Uncategorized',
          quantity: pi.quantity,
          unitCost: pi.unitCost,
          total: pi.total,
        })),
      })),
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

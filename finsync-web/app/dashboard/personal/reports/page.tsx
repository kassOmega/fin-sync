"use client";

import api from "@/lib/api";
import { useLangStore } from "@/store/langStore";
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Frown,
  Smile,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#4F46E5",
  "#10B981",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
  "#EC4899",
  "#06B6D4",
  "#F97316",
];

interface BudgetDetail {
  category: string;
  amount: number;
  frequency: string;
  spent: number;
  remaining: number;
  percentage: number;
}

interface MonthlyEntry {
  month: string;
  income: number;
  expense: number;
}

interface ForecastEntry {
  day: string;
  projectedBalance: number;
  projectedIncome: number;
  projectedExpense: number;
}

interface AccountSummary {
  id: number;
  name: string;
  balance: number;
}

interface PersonalReport {
  totalBudget: number;
  totalSpent: number;
  totalIncome: number;
  totalSavingsTarget: number;
  totalSavingsCurrent: number;
  totalAccountBalance: number;
  remaining: number;
  netWorth: number;
  tag: string;
  expensesByCategory: Record<string, number>;
  budgetDetails: BudgetDetail[];
  accounts: AccountSummary[];
  monthlyChart: MonthlyEntry[];
  forecast: {
    dailyAvgIncome: number;
    dailyAvgExpense: number;
    isGrowing: boolean;
    finalProjectedBalance: number;
    forecastData: ForecastEntry[];
  };
}

export default function PersonalReportsPage() {
  const { t } = useLangStore();
  const [report, setReport] = useState<PersonalReport | null>(null);

  useEffect(() => {
    api.get("/personal/reports").then((res) => setReport(res.data));
  }, []);

  if (!report)
    return (
      <div className="p-8 text-center text-gray-500">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500 mx-auto mb-4"></div>
        {t("reports.generating")}
      </div>
    );

  const pieData = Object.entries(report.expensesByCategory).map(
    ([name, value]) => ({ name, value }),
  );

  const tagConfig: Record<
    string,
    {
      color: string;
      bg: string;
      icon: React.ComponentType<{ className?: string }>;
      message: string;
    }
  > = {
    Appreciative: {
      color: "text-green-700",
      bg: "bg-green-50 border-green-200",
      icon: Smile,
      message: t("reports.appreciative"),
    },
    Inspiring: {
      color: "text-blue-700",
      bg: "bg-blue-50 border-blue-200",
      icon: TrendingUp,
      message: t("reports.inspiring"),
    },
    Complaining: {
      color: "text-red-700",
      bg: "bg-red-50 border-red-200",
      icon: Frown,
      message: t("reports.complaining"),
    },
  };

  const currentTag = tagConfig[report.tag];

  const budgetBarData = report.budgetDetails.map((b) => ({
    name: b.category,
    Budget: b.amount,
    Spent: b.spent,
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/personal"
          className="p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {t("reports.title")}
        </h1>
      </div>

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-1.5 bg-blue-50 rounded-md">
              <ArrowUp className="h-4 w-4 text-blue-600" />
            </div>
            <p className="text-xs font-medium text-gray-500">
              {t("reports.totalIncome")}
            </p>
          </div>
          <p className="text-xl font-bold text-blue-600">
            ${report.totalIncome.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-1.5 bg-red-50 rounded-md">
              <ArrowDown className="h-4 w-4 text-red-600" />
            </div>
            <p className="text-xs font-medium text-gray-500">
              {t("reports.totalSpent")}
            </p>
          </div>
          <p className="text-xl font-bold text-red-600">
            ${report.totalSpent.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-1.5 bg-indigo-50 rounded-md">
              <Wallet className="h-4 w-4 text-indigo-600" />
            </div>
            <p className="text-xs font-medium text-gray-500">
              {t("reports.totalBudget")}
            </p>
          </div>
          <p className="text-xl font-bold text-indigo-600">
            ${report.totalBudget.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-1.5 bg-green-50 rounded-md">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <p className="text-xs font-medium text-gray-500">
              {t("reports.totalSavings")}
            </p>
          </div>
          <p className="text-xl font-bold text-green-600">
            ${report.totalSavingsCurrent.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-2 mb-1">
            <div className="p-1.5 bg-purple-50 rounded-md">
              <Wallet className="h-4 w-4 text-purple-600" />
            </div>
            <p className="text-xs font-medium text-gray-500">
              {t("reports.netWorth")}
            </p>
          </div>
          <p
            className={`text-xl font-bold ${report.netWorth >= 0 ? "text-purple-600" : "text-red-600"}`}
          >
            ${report.netWorth.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Motivational Tag */}
      {currentTag && (
        <div className={`p-4 rounded-lg border ${currentTag.bg}`}>
          <div className="flex items-center space-x-3">
            <currentTag.icon className="h-6 w-6" />
            <div>
              <p className={`font-semibold ${currentTag.color}`}>
                {report.tag}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {currentTag.message}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Monthly Income vs Expense Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t("reports.monthlyBreakdown")}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={report.monthlyChart}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
              }}
            />
            <Legend />
            <Bar
              dataKey="income"
              fill="#10B981"
              name="Income"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expense"
              fill="#EF4444"
              name={t("nav.expenses")}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Budget Category Breakdown */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("reports.budgetBreakdown")}
          </h3>
          {report.budgetDetails.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              {t("reports.noBudgets")}
            </p>
          ) : (
            <div className="space-y-4">
              {report.budgetDetails.map((b) => (
                <div key={b.category}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium text-gray-700">
                      {b.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      ${b.spent.toLocaleString()} / ${b.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${b.percentage > 100 ? "bg-red-500" : b.percentage > 80 ? "bg-yellow-500" : "bg-indigo-500"}`}
                      style={{ width: `${Math.min(b.percentage, 100)}%` }}
                    ></div>
                  </div>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-xs text-gray-400">{b.frequency}</span>
                    <span
                      className={`text-xs font-medium ${b.remaining >= 0 ? "text-green-600" : "text-red-600"}`}
                    >
                      {b.remaining >= 0
                        ? `$${b.remaining.toLocaleString()} ${t("budgets.left")}`
                        : `${t("budgets.over")} $${Math.abs(b.remaining).toLocaleString()}`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Expense Category Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("reports.expensesByCategory")}
          </h3>
          {pieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid #E5E7EB",
                  }}
                  formatter={(value: unknown) => [
                    `$${Number(value).toLocaleString()}`,
                    "",
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-20">
              {t("reports.noExpenses")}
            </p>
          )}
        </div>
      </div>

      {/* Budget vs Spent Bar Chart */}
      {budgetBarData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("reports.budgetVsSpent")}
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={budgetBarData}
              layout="vertical"
              margin={{ left: 20, right: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis type="number" tick={{ fontSize: 12 }} />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fontSize: 12 }}
                width={100}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "8px",
                  border: "1px solid #E5E7EB",
                }}
                formatter={(value, _name, _props) => [
                  `$${Number(value).toLocaleString()}`,
                  "",
                ]}
              />
              <Legend />
              <Bar dataKey="Budget" fill="#6366F1" radius={[0, 4, 4, 0]} />
              <Bar dataKey="Spent" fill="#F43F5E" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Accounts Overview */}
      {report.accounts && report.accounts.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("reports.accountsBreakdown")}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {report.accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 bg-gray-50 rounded-lg border border-gray-100"
              >
                <p className="text-sm font-medium text-gray-700">{acc.name}</p>
                <p
                  className={`text-xl font-bold mt-1 ${acc.balance >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  ${acc.balance.toLocaleString()}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-gray-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-600">
                {t("reports.totalAccountBalance")}
              </span>
              <span className="text-lg font-bold text-indigo-600">
                ${report.totalAccountBalance.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 30-Day Forecast */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">
            {t("reports.forecastTitle")}
          </h3>
          <div className="flex items-center space-x-2">
            <span className="text-xs text-gray-500">
              {t("reports.dailyAvg")}:
            </span>
            <span className="text-xs font-medium text-green-600">
              +${report.forecast.dailyAvgIncome}
            </span>
            <span className="text-xs font-medium text-red-600">
              -${report.forecast.dailyAvgExpense}
            </span>
            <span
              className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                report.forecast.isGrowing
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {report.forecast.isGrowing ? "▲ Growing" : "▼ Shrinking"}
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={report.forecast.forecastData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="day" tick={{ fontSize: 10 }} interval={4} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
              }}
              formatter={(value: unknown) => [
                `$${Number(value).toLocaleString()}`,
                "",
              ]}
            />
            <Line
              type="monotone"
              dataKey="projectedBalance"
              stroke="#8B5CF6"
              strokeWidth={2}
              dot={false}
              name={t("reports.projectedBalance")}
            />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-gray-50 rounded-lg text-center">
          <p className="text-sm text-gray-600">
            {t("reports.projectedAfter30")}:{" "}
            <span
              className={`font-bold ${report.forecast.finalProjectedBalance >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              $
              {Math.abs(report.forecast.finalProjectedBalance).toLocaleString()}
              {report.forecast.finalProjectedBalance >= 0
                ? " surplus"
                : " deficit"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

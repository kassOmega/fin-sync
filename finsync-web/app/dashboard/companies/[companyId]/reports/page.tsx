"use client";

import api from "@/lib/api";
import { useParams } from "next/navigation";
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
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1744",
];

export default function CompanyReportsPage() {
  const { companyId } = useParams();
  const [report, setReport] = useState(null);
  const [forecast, setForecast] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const reportRes = await api.get(`/companies/${companyId}/reports`);
        setReport(reportRes.data);

        const forecastRes = await api.get(`/companies/${companyId}/forecast`);
        setForecast(forecastRes.data);
      } catch (error) {
        console.error("Failed to fetch reports", error);
      }
    };
    fetchData();
  }, [companyId]);

  if (!report || !forecast)
    return (
      <div className="p-8 text-center text-gray-500">Generating reports...</div>
    );

  const expensePieData = Object.entries(report.expensesByCategory).map(
    ([name, value]) => ({ name, value }),
  );
  const incomePieData = Object.entries(report.incomesByCategory).map(
    ([name, value]) => ({ name, value }),
  );

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">
        Financial Reports & Forecasting
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Income</h3>
          <p className="mt-2 text-3xl font-bold text-green-600">
            ${report.totalIncome.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Total Expenses</h3>
          <p className="mt-2 text-3xl font-bold text-red-600">
            ${report.totalExpense.toLocaleString()}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-sm font-medium text-gray-500">Net Profit</h3>
          <p
            className={`mt-2 text-3xl font-bold ${report.profit >= 0 ? "text-indigo-600" : "text-red-600"}`}
          >
            ${report.profit.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Income vs Expense Bar Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Income vs Expenses
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                {
                  name: "Finances",
                  Income: report.totalIncome,
                  Expenses: report.totalExpense,
                },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Income" fill="#10b981" />
              <Bar dataKey="Expenses" fill="#ef4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Expense Breakdown Pie Chart */}
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Expense Breakdown
          </h3>
          {expensePieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={expensePieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {expensePieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-20">
              No expenses recorded
            </p>
          )}
        </div>
      </div>

      {/* AI/Algorithmic Forecasting Graph */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-800">
            30-Day Cash Flow Forecast
          </h3>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${forecast.isGrowing ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {forecast.isGrowing ? "Growing" : "Burning Cash"}
          </span>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          Based on a 3-month average daily income of{" "}
          <span className="font-bold text-green-600">
            ${forecast.dailyIncomeRate}
          </span>{" "}
          and daily expenses of{" "}
          <span className="font-bold text-red-600">
            ${forecast.dailyExpenseRate}
          </span>
          .
        </p>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={forecast.forecastData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="day" />
            <YAxis />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="projectedBalance"
              stroke="#4f46e5"
              strokeWidth={2}
              name="Projected Balance ($)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

"use client";

import api from "@/lib/api";
import { ArrowLeft, Frown, Smile, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1744",
];

export default function PersonalReportsPage() {
  const [report, setReport] = useState(null);
  const [budgets, setBudgets] = useState([]);

  useEffect(() => {
    api.get("/personal/reports").then((res) => setReport(res.data));
    api.get("/budgets").then((res) => setBudgets(res.data));
  }, []);

  if (!report)
    return (
      <div className="p-8 text-center text-gray-500">Generating report...</div>
    );

  const pieData = Object.entries(report.expensesByCategory).map(
    ([name, value]) => ({ name, value }),
  );

  const tagConfig = {
    Appreciative: {
      color: "bg-green-100 text-green-800",
      icon: Smile,
      message: "Excellent job! You are managing your budget perfectly.",
    },
    Inspiring: {
      color: "bg-blue-100 text-blue-800",
      icon: TrendingUp,
      message: "You are getting close to your limit. Keep pushing!",
    },
    Complaining: {
      color: "bg-red-100 text-red-800",
      icon: Frown,
      message: "You have exceeded your budget. Please review your expenses.",
    },
  };

  const currentTag = tagConfig[report.tag];

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/personal"
          className="p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          Personal Finance Report
        </h1>
      </div>

      {/* Budget Performance & Motivational Tag */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 md:mb-0">
            Budget Performance
          </h3>
          <span
            className={`flex items-center px-4 py-2 rounded-full text-sm font-medium ${currentTag.color}`}
          >
            <currentTag.icon className="h-4 w-4 mr-2" /> {report.tag}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="bg-gray-50 p-4 rounded-md">
            <p className="text-sm text-gray-500">Total Budget</p>
            <p className="text-2xl font-bold text-gray-900">
              ${report.totalBudget}
            </p>
          </div>
          <div className="bg-red-50 p-4 rounded-md">
            <p className="text-sm text-red-500">Total Spent</p>
            <p className="text-2xl font-bold text-red-600">
              ${report.totalSpent}
            </p>
          </div>
          <div className="bg-green-50 p-4 rounded-md">
            <p className="text-sm text-green-500">Remaining</p>
            <p className="text-2xl font-bold text-green-600">
              ${report.remaining}
            </p>
          </div>
        </div>

        {/* Budget Frequencies */}
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Active Budget Periods:
          </h4>
          <div className="flex flex-wrap gap-2">
            {budgets.map((b) => (
              <span
                key={b.id}
                className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium"
              >
                {b.type} (${b.amount})
              </span>
            ))}
          </div>
        </div>

        <p className="text-sm text-gray-600 italic mt-4">
          {currentTag.message}
        </p>
      </div>

      {/* Expense Breakdown Chart */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Expenses by Category
        </h3>
        {pieData.length > 0 ? (
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
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
            No expenses recorded yet.
          </p>
        )}
      </div>
    </div>
  );
}

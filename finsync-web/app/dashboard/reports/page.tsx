"use client";

import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Building2, User } from "lucide-react";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export default function ReportsDashboardPage() {
  const { user } = useAuthStore();
  const [tab, setTab] = useState<"personal" | "company">("personal");
  const [personalReport, setPersonalReport] = useState<any>(null);
  const [companyReport, setCompanyReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const [pRes, cRes] = await Promise.all([
          api.get(`/reports/personal`),
          ...(tab === "company" ? [api.get(`/reports/company`)] : []),
        ]);
        if (pRes) setPersonalReport(pRes.data);
        if (cRes) setCompanyReport(cRes.data);
      } catch {
      } finally {
        setLoading(false);
      }
    };
    setLoading(true);
    fetchReports();
  }, [tab]);

  const monthlyChart = personalReport?.monthlyChart || [];
  const companyChart = companyReport
    ? [
        { name: "Income", amount: companyReport.totalIncome, fill: "#10b981" },
        {
          name: "Expenses",
          amount: companyReport.totalExpense,
          fill: "#ef4444",
        },
        { name: "Profit", amount: companyReport.profit, fill: "#4f46e5" },
      ]
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">
          Reports & Analytics
        </h1>
        <div className="flex space-x-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setTab("personal")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "personal" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <User className="h-4 w-4 inline mr-1" />
            Personal
          </button>
          <button
            onClick={() => setTab("company")}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "company" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Building2 className="h-4 w-4 inline mr-1" />
            Company
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-8 w-8 border-t-2 border-b-2 border-indigo-500 rounded-full" />
        </div>
      )}

      {!loading && tab === "personal" && personalReport && (
        <div className="space-y-6">
          {monthlyChart.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">
                Monthly Income vs Expenses
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="income" fill="#10b981" name="Income" />
                  <Bar dataKey="expense" fill="#ef4444" name="Expenses" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {personalReport.budgetDetails?.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">
                Budget vs Actual
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={personalReport.budgetDetails}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="category" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="amount" fill="#4f46e5" name="Budget" />
                  <Bar dataKey="spent" fill="#f59e0b" name="Spent" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {personalReport.forecast?.forecastData?.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">
                30-Day Forecast
              </h3>
              <p
                className={`text-sm mb-3 ${personalReport.forecast.isGrowing ? "text-green-600" : "text-red-600"}`}
              >
                {personalReport.forecast.isGrowing ? "Growing" : "Declining"} ·
                Daily avg: ${personalReport.forecast.dailyAvgIncome.toFixed(2)}{" "}
                income / ${personalReport.forecast.dailyAvgExpense.toFixed(2)}{" "}
                expenses
              </p>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  data={personalReport.forecast.forecastData.filter(
                    (_: any, i: number) => i % 5 === 0,
                  )}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar
                    dataKey="projectedBalance"
                    fill="#8b5cf6"
                    name="Projected Balance"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      )}

      {!loading && tab === "company" && companyReport && (
        <div className="space-y-6">
          {companyChart.length > 0 && (
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h3 className="text-sm font-semibold text-gray-500 mb-4">
                Financial Overview
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={companyChart}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="amount" fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {companyReport.expensesByCategory &&
            Object.keys(companyReport.expensesByCategory).length > 0 && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-sm font-semibold text-gray-500 mb-4">
                    Expenses by Category
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(companyReport.expensesByCategory)
                      .slice(0, 8)
                      .map(([cat, amt]: [string, any]) => (
                        <div key={cat} className="flex justify-between text-sm">
                          <span className="text-gray-600">{cat}</span>
                          <span className="font-medium text-red-600">
                            ${amt}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                  <h3 className="text-sm font-semibold text-gray-500 mb-4">
                    Incomes by Category
                  </h3>
                  <div className="space-y-2">
                    {Object.entries(companyReport.incomesByCategory)
                      .slice(0, 8)
                      .map(([cat, amt]: [string, any]) => (
                        <div key={cat} className="flex justify-between text-sm">
                          <span className="text-gray-600">{cat}</span>
                          <span className="font-medium text-green-600">
                            ${amt}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
        </div>
      )}
    </div>
  );
}

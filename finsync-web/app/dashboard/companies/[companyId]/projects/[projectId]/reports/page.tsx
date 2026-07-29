"use client";

import api from "@/lib/api";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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

interface Report {
  summary: { totalIncome: number; totalExpense: number; totalProfit: number };
  chartData: Array<{
    name: string;
    Income: number;
    Expenses: number;
    Profit: number;
  }>;
}

export default function ProjectReportsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !projectId) {
      router.push("/dashboard/companies");
      return;
    }
    Promise.all([
      api.get(`/companies/${companyId}/reports/projects`),
      api.get(`/projects/${projectId}/reports`),
    ])
      .then(([cumulative, single]) => {
        // Show cumulative data with this project highlighted
        setReport(cumulative.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId, projectId]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  if (!report)
    return (
      <div className="text-center py-20 text-gray-500">
        No report data available.
      </div>
    );

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-800">Project Reports</h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border flex items-center space-x-3">
          <div className="p-2 bg-green-50 rounded-lg">
            <TrendingUp className="h-5 w-5 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Income</p>
            <p className="text-lg font-bold text-gray-900">
              ${report.summary.totalIncome.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border flex items-center space-x-3">
          <div className="p-2 bg-red-50 rounded-lg">
            <TrendingDown className="h-5 w-5 text-red-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Expenses</p>
            <p className="text-lg font-bold text-gray-900">
              ${report.summary.totalExpense.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border flex items-center space-x-3">
          <div
            className={`p-2 ${report.summary.totalProfit >= 0 ? "bg-indigo-50" : "bg-red-50"} rounded-lg`}
          >
            <Wallet
              className={`h-5 w-5 ${report.summary.totalProfit >= 0 ? "text-indigo-600" : "text-red-600"}`}
            />
          </div>
          <div>
            <p className="text-xs text-gray-500">Profit</p>
            <p
              className={`text-lg font-bold ${report.summary.totalProfit >= 0 ? "text-gray-900" : "text-red-600"}`}
            >
              ${report.summary.totalProfit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {report.chartData.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500 mb-4">
            Financial Performance by Project
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={report.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="Income" fill="#10b981" />
              <Bar dataKey="Expenses" fill="#ef4444" />
              <Bar dataKey="Profit" fill="#4f46e5" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

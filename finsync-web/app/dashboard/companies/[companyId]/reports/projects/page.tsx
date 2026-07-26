"use client";

import api from "@/lib/api";
import { ArrowLeft, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
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

interface ProjectReportsData {
  summary: {
    totalIncome: number;
    totalExpense: number;
    totalProfit: number;
  };
  chartData: Array<{
    name: string;
    Income: number;
    Expenses: number;
    Profit: number;
  }>;
}

export default function ProjectsReportPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const [report, setReport] = useState<ProjectReportsData | null>(null);

  useEffect(() => {
    if (companyId) {
      api
        .get(`/companies/${companyId}/reports/projects`)
        .then((res) => setReport(res.data));
    }
  }, [companyId]);

  if (!report)
    return (
      <div className="p-8 text-center text-gray-500">
        Generating cumulative project reports...
      </div>
    );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/dashboard/companies/${companyId}/reports`}
          className="p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          Cumulative Project Reports
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center space-x-4">
          <div className="p-3 bg-green-50 rounded-full">
            <TrendingUp className="h-6 w-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Total Project Income
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              ${report.summary.totalIncome.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center space-x-4">
          <div className="p-3 bg-red-50 rounded-full">
            <TrendingDown className="h-6 w-6 text-red-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Total Project Expenses
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              ${report.summary.totalExpense.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow border border-gray-200 flex items-center space-x-4">
          <div className="p-3 bg-indigo-50 rounded-full">
            <Wallet className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-gray-500">
              Total Project Profit
            </h3>
            <p className="text-2xl font-bold text-gray-900">
              ${report.summary.totalProfit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Projects Comparison Chart */}
      <div className="bg-white p-6 rounded-lg shadow border border-gray-200">
        <h3 className="text-lg font-medium text-gray-800 mb-4">
          Financial Performance by Project
        </h3>
        {report.chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
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
        ) : (
          <p className="text-gray-500 text-center py-20">No projects found.</p>
        )}
      </div>
    </div>
  );
}

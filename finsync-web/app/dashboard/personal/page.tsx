"use client";

import api from "@/lib/api";
import { ArrowRight, BarChart3, Tag, TrendingUp, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function PersonalFinanceHub() {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    api
      .get("/personal-finance/budget-status")
      .then((res) => setStatus(res.data))
      .catch(() => console.log("No budget setup"));
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Personal Finance</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Quick Stats / Links */}
        <Link
          href="/dashboard/personal/budgets"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-all group"
        >
          <div className="flex justify-between items-center mb-4">
            <Wallet className="h-8 w-8 text-indigo-600" />
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900">Budgets</h3>
          <p className="text-sm text-gray-500 mt-1">
            {status ? `Remaining: $${status.remaining}` : "Setup your budget"}
          </p>
        </Link>

        <Link
          href="/dashboard/personal/expenses"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-all group"
        >
          <div className="flex justify-between items-center mb-4">
            <Tag className="h-8 w-8 text-red-600" />
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900">Expenses</h3>
          <p className="text-sm text-gray-500 mt-1">Quick entry & categorize</p>
        </Link>

        <Link
          href="/dashboard/personal/savings"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-all group"
        >
          <div className="flex justify-between items-center mb-4">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900">Savings</h3>
          <p className="text-sm text-gray-500 mt-1">Track your goals</p>
        </Link>

        <Link
          href="/dashboard/personal/reports"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-all group"
        >
          <div className="flex justify-between items-center mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900">Reports</h3>
          <p className="text-sm text-gray-500 mt-1">View financial insights</p>
        </Link>
      </div>
    </div>
  );
}

"use client";

import api from "@/lib/api";
import { TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function ProjectReportsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [incomes, setIncomes] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !projectId) {
      router.push("/dashboard/companies");
      return;
    }
    Promise.all([
      api.get(`/companies/${companyId}/projects/${projectId}/incomes`),
      api.get(`/companies/${companyId}/projects/${projectId}/expenses`),
    ])
      .then(([incRes, expRes]) => {
        setIncomes(Array.isArray(incRes.data) ? incRes.data : []);
        setExpenses(Array.isArray(expRes.data) ? expRes.data : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId, projectId]);

  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const totalExpense = expenses.reduce((s, e) => s + e.amount, 0);
  const profit = totalIncome - totalExpense;

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
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
              ${totalIncome.toLocaleString()}
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
              ${totalExpense.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border flex items-center space-x-3">
          <div
            className={`p-2 ${profit >= 0 ? "bg-indigo-50" : "bg-red-50"} rounded-lg`}
          >
            <Wallet
              className={`h-5 w-5 ${profit >= 0 ? "text-indigo-600" : "text-red-600"}`}
            />
          </div>
          <div>
            <p className="text-xs text-gray-500">Profit</p>
            <p
              className={`text-lg font-bold ${profit >= 0 ? "text-gray-900" : "text-red-600"}`}
            >
              ${profit.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">
            Income Breakdown
          </h3>
          {incomes.length === 0 ? (
            <p className="text-sm text-gray-400">No income data.</p>
          ) : (
            <div className="space-y-2">
              {incomes.slice(0, 10).map((i) => (
                <div
                  key={i.id}
                  className="flex justify-between text-sm border-b pb-1"
                >
                  <span className="text-gray-600">{i.category}</span>
                  <span className="font-medium text-green-600">
                    ${i.amount}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500 mb-3">
            Expense Breakdown
          </h3>
          {expenses.length === 0 ? (
            <p className="text-sm text-gray-400">No expense data.</p>
          ) : (
            <div className="space-y-2">
              {expenses.slice(0, 10).map((e) => (
                <div
                  key={e.id}
                  className="flex justify-between text-sm border-b pb-1"
                >
                  <span className="text-gray-600">{e.category}</span>
                  <span className="font-medium text-red-600">${e.amount}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

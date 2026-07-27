"use client";

import api from "@/lib/api";
import { useLangStore } from "@/store/langStore";
import {
  ArrowDownCircle,
  ArrowRight,
  ArrowUpCircle,
  BarChart3,
  CreditCard,
  Tag,
  TrendingUp,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PersonalFinanceHub() {
  const { t } = useLangStore();
  const [status, setStatus] = useState(null);
  const [accounts, setAccounts] = useState([]);

  const [quickAmount, setQuickAmount] = useState("");
  const [quickCategory, setQuickCategory] = useState("Misc");
  const [quickAccount, setQuickAccount] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api
      .get("/personal-finance/budget-status")
      .then((res) => setStatus(res.data))
      .catch(() => console.log("No budget setup"));

    api
      .get("/personal-accounts")
      .then((res) => setAccounts(res.data))
      .catch(() => console.error("Failed to fetch accounts"));
  }, []);

  const handleQuickAdd = async (type: string) => {
    if (!quickAmount || parseFloat(quickAmount) <= 0) {
      toast.error(t("personal.invalidAmount"));
      return;
    }

    setLoading(true);
    const payload = {
      amount: parseFloat(quickAmount),
      category: quickCategory,
      note: quickNote,
      accountId: quickAccount ? parseInt(quickAccount) : null,
    };

    try {
      if (type === "expense") {
        await api.post("/personal-expenses", payload);
        toast.success(t("personal.expenseAdded"));
      } else {
        await api.post("/personal-incomes", payload);
        toast.success(t("personal.incomeAdded"));
      }

      setQuickAmount("");
      setQuickNote("");
      setQuickCategory("Misc");
      setQuickAccount("");
    } catch {
      toast.error(t("personal.logFailed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">
        {t("personal.title")}
      </h1>

      {/* Quick Add Widget */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          {t("personal.quickAdd")}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700">
              {t("personal.amount")}
            </label>
            <input
              type="number"
              step="0.01"
              value={quickAmount}
              onChange={(e) => setQuickAmount(e.target.value)}
              placeholder="0.00"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700">
              {t("personal.category")}
            </label>
            <select
              value={quickCategory}
              onChange={(e) => setQuickCategory(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
            >
              <option>Misc</option>
              <option>Food</option>
              <option>Transport</option>
              <option>Salary</option>
              <option>Family</option>
              <option>Clothing</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700">
              {t("personal.account")}
            </label>
            <select
              value={quickAccount}
              onChange={(e) => setQuickAccount(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
            >
              <option value="">{t("personal.noneUntracked")}</option>
              {accounts.map(
                (acc: { id: number; name: string; balance: number }) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.balance})
                  </option>
                ),
              )}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs font-medium text-gray-700">
              {t("personal.note")}
            </label>
            <input
              type="text"
              value={quickNote}
              onChange={(e) => setQuickNote(e.target.value)}
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => handleQuickAdd("expense")}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            <ArrowDownCircle className="h-5 w-5 mr-2" />{" "}
            {t("personal.addExpense")}
          </button>
          <button
            onClick={() => handleQuickAdd("income")}
            disabled={loading}
            className="flex items-center justify-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
          >
            <ArrowUpCircle className="h-5 w-5 mr-2" /> {t("personal.addIncome")}
          </button>
        </div>
      </div>

      {/* Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Link
          href="/dashboard/personal/budgets"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-all group"
        >
          <div className="flex justify-between items-center mb-4">
            <Wallet className="h-8 w-8 text-indigo-600" />
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900">
            {t("personal.budgets")}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {status
              ? `${t("personal.remaining")}: $${(status as { remaining: number }).remaining}`
              : t("personal.setupBudget")}
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
          <h3 className="font-semibold text-gray-900">{t("nav.expenses")}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t("personal.quickEntry")}
          </p>
        </Link>

        <Link
          href="/dashboard/personal/savings"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-all group"
        >
          <div className="flex justify-between items-center mb-4">
            <TrendingUp className="h-8 w-8 text-green-600" />
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900">
            {t("personal.savings")}
          </h3>
          <p className="text-sm text-gray-500 mt-1">
            {t("personal.trackGoals")}
          </p>
        </Link>

        <Link
          href="/dashboard/personal/accounts"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-all group"
        >
          <div className="flex justify-between items-center mb-4">
            <CreditCard className="h-8 w-8 text-purple-600" />
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900">{t("accounts.title")}</h3>
          <p className="text-sm text-gray-500 mt-1">{t("accounts.manage")}</p>
        </Link>

        <Link
          href="/dashboard/personal/reports"
          className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-all group"
        >
          <div className="flex justify-between items-center mb-4">
            <BarChart3 className="h-8 w-8 text-blue-600" />
            <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
          </div>
          <h3 className="font-semibold text-gray-900">{t("nav.reports")}</h3>
          <p className="text-sm text-gray-500 mt-1">
            {t("personal.financialInsights")}
          </p>
        </Link>
      </div>
    </div>
  );
}

"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { useLangStore } from "@/store/langStore";
import { ArrowLeft, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PersonalBudgetsPage() {
  const { t } = useLangStore();
  const [budgets, setBudgets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const today = new Date().toISOString().split("T")[0];
  const [budgetData, setBudgetData] = useState({
    category: "",
    amount: 0,
    frequency: "MONTHLY",
    startDate: today,
  });

  const fetchBudgets = async () => {
    try {
      const res = await api.get("/budgets");
      setBudgets(res.data);
    } catch {
      console.error("Failed to fetch budgets");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSetupBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/budgets", {
        category: budgetData.category,
        amount: parseFloat(String(budgetData.amount)),
        frequency: budgetData.frequency,
        startDate: budgetData.startDate,
      });
      toast.success(t("budgets.added"));
      setIsModalOpen(false);
      setBudgetData({
        category: "",
        amount: 0,
        frequency: "MONTHLY",
        startDate: today,
      });
      fetchBudgets();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || t("budgets.failed"));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/personal"
            className="p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("budgets.title")}
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> {t("budgets.addCategory")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length === 0 ? (
          <div className="col-span-full bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
            {t("budgets.noCategories")}
          </div>
        ) : (
          budgets.map(
            (b: {
              id: number;
              category: string;
              frequency: string;
              amount: number;
              spent: number;
              startDate: string;
            }) => {
              const remaining = b.amount - b.spent;
              const percentage =
                b.amount > 0 ? Math.min((b.spent / b.amount) * 100, 100) : 0;
              const isOverBudget = remaining < 0;

              return (
                <div
                  key={b.id}
                  className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {b.category}
                    </h3>
                    <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium uppercase">
                      {b.frequency}
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-500">
                        {t("budgets.allocated")}:{" "}
                        <span className="font-bold text-gray-900">
                          ${b.amount}
                        </span>
                      </span>
                      <span
                        className={`font-bold ${isOverBudget ? "text-red-600" : "text-green-600"}`}
                      >
                        {isOverBudget
                          ? `${t("budgets.over")} $${Math.abs(remaining)}`
                          : `$${remaining} ${t("budgets.left")}`}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className={`h-2.5 rounded-full ${isOverBudget ? "bg-red-500" : "bg-indigo-500"}`}
                        style={{ width: `${percentage}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {t("budgets.spent")}: ${b.spent} / ${b.amount} <br />
                      {t("budgets.trackingSince")}:{" "}
                      {new Date(b.startDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              );
            },
          )
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">
              {t("budgets.modalTitle")}
            </h2>
            <form onSubmit={handleSetupBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("budgets.categoryName")}
                </label>
                <input
                  type="text"
                  required
                  value={budgetData.category}
                  onChange={(e) =>
                    setBudgetData({ ...budgetData, category: e.target.value })
                  }
                  placeholder={t("budgets.categoryPlaceholder")}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("budgets.amount")}
                  </label>
                  <input
                    type="number"
                    required
                    value={budgetData.amount ?? ""}
                    onChange={(e) =>
                      setBudgetData({
                        ...budgetData,
                        amount: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t("budgets.frequency")}
                  </label>
                  <select
                    value={budgetData.frequency}
                    onChange={(e) =>
                      setBudgetData({
                        ...budgetData,
                        frequency: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                  >
                    <option value="DAILY">{t("budgets.daily")}</option>
                    <option value="WEEKLY">{t("budgets.weekly")}</option>
                    <option value="MONTHLY">{t("budgets.monthly")}</option>
                    <option value="YEARLY">{t("budgets.yearly")}</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("budgets.startDate")}
                </label>
                <input
                  type="date"
                  required
                  value={budgetData.startDate}
                  onChange={(e) =>
                    setBudgetData({ ...budgetData, startDate: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? t("common.saving") : t("common.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

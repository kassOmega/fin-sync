"use client";

import api from "@/lib/api";
import { useLangStore } from "@/store/langStore";
import { ArrowLeft, Plus, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface SavingsGoal {
  id: number | string;
  targetAmount: number;
  thresholdAmount: number;
  currentAmount: number;
  frequency: string;
}

export default function PersonalSavingsPage() {
  const { t } = useLangStore();
  const [savings, setSavings] = useState<SavingsGoal[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [savingData, setSavingData] = useState({
    targetAmount: "",
    thresholdAmount: "",
    frequency: "MONTHLY",
  });

  const fetchSavings = async () => {
    try {
      const res = await api.get("/savings");
      setSavings(res.data);
    } catch {
      console.error("Failed to fetch savings");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/savings", {
        targetAmount: parseFloat(savingData.targetAmount),
        thresholdAmount: parseFloat(savingData.thresholdAmount),
        frequency: savingData.frequency,
        startDate: new Date(),
      });
      toast.success(t("savings.created"));
      setIsModalOpen(false);
      fetchSavings();
    } catch {
      toast.error(t("savings.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleAddFunds = async (id: number | string, currentAmount: number) => {
    const amount = prompt(t("savings.enterAmount"));
    if (amount) {
      try {
        await api.patch(`/savings/${id}`, {
          currentAmount: currentAmount + parseFloat(amount),
        });
        toast.success(t("savings.added"));
        fetchSavings();
      } catch {
        toast.error(t("savings.failed"));
      }
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
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
            {t("savings.title")}
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> {t("savings.newGoal")}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savings.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500 col-span-full">
            {t("savings.noGoals")}
          </div>
        ) : (
          savings.map((goal) => {
            const progress = Math.min(
              (goal.currentAmount / goal.targetAmount) * 100,
              100,
            );
            return (
              <div
                key={goal.id}
                className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <Target className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {t("savings.goal")}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {t("savings.schedule")} ${goal.thresholdAmount}{" "}
                        {goal.frequency.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {t("savings.progress")}
                    </span>
                    <span className="font-medium text-gray-900">
                      ${goal.currentAmount} / ${goal.targetAmount}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div
                      className="bg-green-600 h-2.5 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>
                <button
                  onClick={() => handleAddFunds(goal.id, goal.currentAmount)}
                  className="w-full px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm font-medium"
                >
                  {t("savings.addFunds")}
                </button>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {t("savings.modalTitle")}
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("savings.targetAmount")}
                </label>
                <input
                  type="number"
                  required
                  value={savingData.targetAmount}
                  onChange={(e) =>
                    setSavingData({
                      ...savingData,
                      targetAmount: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("savings.thresholdAmount")}
                </label>
                <input
                  type="number"
                  required
                  value={savingData.thresholdAmount}
                  onChange={(e) =>
                    setSavingData({
                      ...savingData,
                      thresholdAmount: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("savings.frequency")}
                </label>
                <select
                  value={savingData.frequency}
                  onChange={(e) =>
                    setSavingData({ ...savingData, frequency: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option value="DAILY">{t("savings.daily")}</option>
                  <option value="WEEKLY">{t("savings.weekly")}</option>
                  <option value="MONTHLY">{t("savings.monthly")}</option>
                </select>
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
                  {loading ? t("common.saving") : t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

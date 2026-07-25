"use client";

import api from "@/lib/api";
import { ArrowLeft, Plus, Target, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PersonalSavingsPage() {
  const [savings, setSavings] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [savingData, setSavingData] = useState({
    targetAmount: 0,
    thresholdAmount: 0,
    frequency: "MONTHLY",
  });

  const fetchSavings = async () => {
    try {
      const res = await api.get("/savings");
      setSavings(res.data);
    } catch (error) {
      console.error("Failed to fetch savings");
    }
  };

  useEffect(() => {
    fetchSavings();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post("/savings", { ...savingData, startDate: new Date() });
      toast.success("Goal created!");
      setIsModalOpen(false);
      fetchSavings();
    } catch (error) {
      toast.error("Failed");
    }
  };

  const handleAddFunds = async (id, currentAmount) => {
    const amount = prompt("Enter amount to add:");
    if (amount) {
      try {
        await api.patch(`/savings/${id}`, {
          currentAmount: currentAmount + parseFloat(amount),
        });
        toast.success("Funds added!");
        fetchSavings();
      } catch (error) {
        toast.error("Failed to add funds");
      }
    }
  };

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
          <h1 className="text-2xl font-bold text-gray-800">Savings Goals</h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> New Goal
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {savings.length === 0 ? (
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500 col-span-full">
            No savings goals yet.
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
                        Savings Goal
                      </h3>
                      <p className="text-xs text-gray-500">
                        Save ${goal.thresholdAmount}{" "}
                        {goal.frequency.toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <TrendingUp className="h-5 w-5 text-gray-400" />
                </div>
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Progress</span>
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
                  Add Funds to Savings
                </button>
              </div>
            );
          })
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create Savings Goal</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Total Target Amount ($)
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
                  Threshold to save per period ($)
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
                  Frequency
                </label>
                <select
                  value={savingData.frequency}
                  onChange={(e) =>
                    setSavingData({ ...savingData, frequency: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Create
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import api from "@/lib/api";
import { ArrowLeft, Plus, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PersonalBudgetsPage() {
  const [budgets, setBudgets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetData, setBudgetData] = useState({ type: "DAILY", amount: 0 });

  const fetchBudgets = async () => {
    try {
      const res = await api.get("/budgets");
      setBudgets(res.data);
    } catch (error) {
      console.error("Failed to fetch budgets");
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSetupBudget = async (e) => {
    e.preventDefault();
    try {
      await api.post("/budgets", {
        type: budgetData.type,
        amount: parseFloat(budgetData.amount),
        startDate: new Date(),
      });
      toast.success("Budget added!");
      setIsModalOpen(false);
      fetchBudgets();
    } catch (error) {
      toast.error("Failed to setup budget");
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
          <h1 className="text-2xl font-bold text-gray-800">
            Budget Management
          </h1>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> Add Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.length === 0 ? (
          <div className="col-span-full bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
            No budgets setup yet.
          </div>
        ) : (
          budgets.map((b) => (
            <div
              key={b.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {b.type} Budget
                </h3>
                <Wallet className="h-6 w-6 text-indigo-600" />
              </div>
              <p className="text-3xl font-bold text-gray-900">${b.amount}</p>
              <p className="text-sm text-gray-500 mt-2">
                Started on: {new Date(b.startDate).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add Budget</h2>
            <form onSubmit={handleSetupBudget} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Budget Frequency
                </label>
                <select
                  value={budgetData.type}
                  onChange={(e) =>
                    setBudgetData({ ...budgetData, type: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Budget Amount ($)
                </label>
                <input
                  type="number"
                  required
                  value={budgetData.amount}
                  onChange={(e) =>
                    setBudgetData({ ...budgetData, amount: e.target.value })
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
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

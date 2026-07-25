"use client";

import api from "@/lib/api";
import { AlertTriangle, CheckCircle, Plus, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PersonalBudgetsPage() {
  const [status, setStatus] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [budgetData, setBudgetData] = useState({ type: "DAILY", amount: 0 });

  const fetchStatus = async () => {
    try {
      const res = await api.get("/personal-finance/budget-status");
      setStatus(res.data);
    } catch (error) {
      console.log("No budget status found");
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleBudgetAction = async (action) => {
    try {
      const endpoint = action === "BORROW" ? "borrow" : "rollover";
      const payload =
        action === "BORROW"
          ? { amount: status.prompt.amount }
          : { action: "ROLLOVER", amount: status.prompt.amount };

      await api.post(`/personal-finance/${endpoint}`, payload);
      toast.success("Budget updated successfully!");
      fetchStatus();
    } catch (error) {
      toast.error("Failed to update budget");
    }
  };

  const handleSetupBudget = async (e) => {
    e.preventDefault();
    try {
      await api.post("/budgets", {
        type: budgetData.type,
        amount: parseFloat(budgetData.amount),
        startDate: new Date(),
      });
      toast.success("Budget setup complete!");
      setIsModalOpen(false);
      fetchStatus();
    } catch (error) {
      toast.error("Failed to setup budget");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Budget Management</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> {status ? "Update" : "Setup"} Budget
        </button>
      </div>

      {status ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-800">
              Today&rsquo;s Budget
            </h3>
            <Wallet className="h-6 w-6 text-indigo-600" />
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Budget</p>
              <p className="text-xl font-bold text-gray-900">
                ${status.budget}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Spent</p>
              <p className="text-xl font-bold text-red-600">${status.spent}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Remaining</p>
              <p
                className={`text-xl font-bold ${status.remaining < 0 ? "text-red-600" : "text-green-600"}`}
              >
                ${status.remaining}
              </p>
            </div>
          </div>

          {status.prompt && (
            <div
              className={`p-4 rounded-md border-2 ${status.prompt.action === "BORROW" ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}
            >
              <div className="flex items-start space-x-3">
                {status.prompt.action === "BORROW" ? (
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                ) : (
                  <CheckCircle className="h-6 w-6 text-blue-600" />
                )}
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {status.prompt.message}
                  </p>
                  <div className="mt-3 flex space-x-2">
                    {status.prompt.action === "BORROW" ? (
                      <button
                        onClick={() => handleBudgetAction("BORROW")}
                        className="px-4 py-2 bg-red-600 text-white rounded-md text-sm hover:bg-red-700"
                      >
                        Borrow from Tomorrow
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleBudgetAction("ROLLOVER")}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm hover:bg-blue-700"
                        >
                          Roll to Tomorrow
                        </button>
                        <button
                          onClick={() => handleBudgetAction("SAVINGS")}
                          className="px-4 py-2 bg-green-600 text-white rounded-md text-sm hover:bg-green-700"
                        >
                          Add to Savings
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
          No budget setup yet. Click "Setup Budget" to get started.
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Setup Budget</h2>
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                  Save Setup
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import api from "@/lib/api";
import { Plus, Tag } from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function PersonalExpensesPage() {
  const [uncategorized, setUncategorized] = useState([]);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickNote, setQuickNote] = useState("");

  const fetchUncategorized = async () => {
    try {
      const res = await api.get("/personal-expenses", {
        params: { isCategorized: "false" },
      });
      setUncategorized(res.data);
    } catch (error) {
      console.error("Failed to fetch expenses");
    }
  };

  useEffect(() => {
    fetchUncategorized();
  }, []);

  const handleQuickExpense = async (e) => {
    e.preventDefault();
    try {
      await api.post("/personal-expenses", {
        amount: parseFloat(quickAmount),
        note: quickNote,
        isCategorized: false,
      });
      toast.success("Expense recorded! Categorize it later.");
      setQuickAmount("");
      setQuickNote("");
      fetchUncategorized();
    } catch (error) {
      toast.error("Failed to save expense");
    }
  };

  const handleCategorize = async (id, category) => {
    try {
      await api.patch(`/personal-expenses/${id}`, {
        category,
        isCategorized: true,
      });
      toast.success("Expense categorized!");
      fetchUncategorized();
    } catch (error) {
      toast.error("Failed to categorize");
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Personal Expenses</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Expense Entry */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Quick Expense Entry
          </h3>
          <form onSubmit={handleQuickExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Amount ($)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={quickAmount}
                onChange={(e) => setQuickAmount(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Quick Note
              </label>
              <input
                type="text"
                value={quickNote}
                onChange={(e) => setQuickNote(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-1" /> Save Now (Categorize Later)
            </button>
          </form>
        </div>

        {/* Uncategorized Expenses List */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Categorize Pending Expenses
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {uncategorized.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                All expenses are categorized!
              </p>
            ) : (
              uncategorized.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="font-medium text-gray-900">${exp.amount}</p>
                    <p className="text-xs text-gray-500">
                      {exp.note || "No note"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Tag className="h-4 w-4 text-gray-400" />
                    <select
                      onChange={(e) => handleCategorize(exp.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-md p-1 bg-white"
                    >
                      <option value="">Select...</option>
                      <option value="family">Family</option>
                      <option value="clothing">Clothing</option>
                      <option value="food">Food</option>
                      <option value="transport">Transport</option>
                      <option value="misc">Miscellaneous</option>
                    </select>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

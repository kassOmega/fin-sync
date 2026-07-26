"use client";

import api from "@/lib/api";
import { ArrowLeft, Plus, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface PersonalExpense {
  id: number | string;
  amount: number;
  note?: string;
  date: string;
  category?: string;
  isCategorized: boolean;
}

export default function PersonalExpensesPage() {
  const [expenses, setExpenses] = useState<PersonalExpense[]>([]);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickNote, setQuickNote] = useState("");

  const fetchExpenses = async () => {
    try {
      const res = await api.get("/personal-expenses");
      setExpenses(res.data);
    } catch (error) {
      console.error("Failed to fetch expenses");
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, []);

  const handleQuickExpense = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      await api.post("/personal-expenses", {
        amount: parseFloat(quickAmount),
        note: quickNote,
        isCategorized: false,
      });
      toast.success("Expense recorded!");
      setQuickAmount("");
      setQuickNote("");
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to save expense");
    }
  };

  const handleCategorize = async (id: number | string, category: string) => {
    try {
      await api.patch(`/personal-expenses/${id}`, {
        category,
        isCategorized: true,
      });
      toast.success("Categorized!");
      fetchExpenses();
    } catch (error) {
      toast.error("Failed to categorize");
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/personal"
          className="p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Personal Expenses</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
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
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
              />
            </div>
            <button
              type="submit"
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Plus className="h-5 w-5 mr-1" /> Save Now
            </button>
          </form>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            All Expenses
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                No expenses yet.
              </p>
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      ${exp.amount}{" "}
                      <span className="text-xs text-gray-500">
                        ({new Date(exp.date).toLocaleDateString()})
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {exp.note || "No note"}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    {exp.isCategorized ? (
                      <span className="text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded-full">
                        {exp.category}
                      </span>
                    ) : (
                      <>
                        <Tag className="h-4 w-4 text-gray-400" />
                        <select
                          onChange={(e) =>
                            handleCategorize(exp.id, e.target.value)
                          }
                          defaultValue=""
                          className="text-sm border border-gray-300 rounded-md p-1 bg-white text-gray-900"
                        >
                          <option value="" disabled>
                            Select...
                          </option>
                          <option value="family">Family</option>
                          <option value="clothing">Clothing</option>
                          <option value="food">Food</option>
                          <option value="transport">Transport</option>
                          <option value="misc">Misc</option>
                        </select>
                      </>
                    )}
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

"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { useLangStore } from "@/store/langStore";
import { ArrowLeft, Edit3, Plus, Tag } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Account {
  id: number;
  name: string;
  balance: number;
}

interface Expense {
  id: number;
  amount: number;
  date: string;
  note: string | null;
  isCategorized: boolean;
  category: string | null;
  accountId: number | null;
  account: { name: string } | null;
}

export default function PersonalExpensesPage() {
  const { t } = useLangStore();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [budgetCats, setBudgetCats] = useState<string[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [quickAmount, setQuickAmount] = useState("");
  const [quickAccount, setQuickAccount] = useState("");
  const [quickNote, setQuickNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  // Categorize modal state
  const [categorizeExpense, setCategorizeExpense] = useState<Expense | null>(
    null,
  );
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAccount, setSelectedAccount] = useState("");

  // New budget modal state
  const [showNewBudgetModal, setShowNewBudgetModal] = useState(false);
  const [newBudgetData, setNewBudgetData] = useState({
    category: "",
    amount: 0,
    frequency: "MONTHLY",
    startDate: new Date().toISOString().split("T")[0],
  });

  const fetchExpenses = async () => {
    try {
      const res = await api.get("/personal-expenses");
      setExpenses(res.data);
    } catch {
      console.error("Failed to fetch expenses");
    }
  };

  const fetchBudgets = async () => {
    try {
      const res = await api.get("/budgets");
      setBudgetCats(res.data.map((b: { category: string }) => b.category));
    } catch {
      console.error("Failed to fetch budgets");
    }
  };

  useEffect(() => {
    Promise.all([
      fetchExpenses(),
      fetchBudgets(),
      api
        .get("/personal-accounts")
        .then((res) => setAccounts(res.data))
        .catch(() => {}),
    ]).finally(() => setPageLoading(false));
  }, []);

  const insufficientBalance =
    quickAccount && quickAmount
      ? (() => {
          const selected = accounts.find(
            (a) => a.id === parseInt(quickAccount),
          );
          return selected ? selected.balance < parseFloat(quickAmount) : false;
        })()
      : false;

  const handleQuickExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (insufficientBalance) return;
    setLoading(true);
    try {
      await api.post("/personal-expenses", {
        amount: parseFloat(quickAmount),
        note: quickNote,
        isCategorized: false,
        accountId: quickAccount ? parseInt(quickAccount) : null,
      });
      toast.success(t("expenses.recorded"));
      setQuickAmount("");
      setQuickNote("");
      setQuickAccount("");
      fetchExpenses();
    } catch {
      toast.error(t("expenses.saveFailed"));
    } finally {
      setLoading(false);
    }
  };

  // Open the categorize/edit modal for an expense
  const openCategorizeModal = (exp: Expense) => {
    setCategorizeExpense(exp);
    setSelectedCategory(exp.category || "");
    setSelectedAccount(exp.accountId ? String(exp.accountId) : "");
  };

  // Save the categorization from the modal
  const handleSaveCategorize = async () => {
    if (!categorizeExpense) return;
    try {
      const updates: Record<string, unknown> = {};

      if (selectedCategory === "ADD_NEW") {
        setShowNewBudgetModal(true);
        setNewBudgetData((prev) => ({
          ...prev,
          category: prev.category || "New Category",
        }));
        return;
      }

      if (selectedCategory && selectedCategory !== categorizeExpense.category) {
        updates.category = selectedCategory;
        updates.isCategorized = true;
      }

      if (selectedAccount !== String(categorizeExpense.accountId || "")) {
        updates.accountId = selectedAccount ? parseInt(selectedAccount) : null;
      }

      if (Object.keys(updates).length > 0) {
        await api.patch(`/personal-expenses/${categorizeExpense.id}`, updates);
        toast.success(t("expenses.updated"));
      }

      setCategorizeExpense(null);
      fetchExpenses();
    } catch {
      toast.error(t("expenses.categorizeFailed"));
    }
  };

  const handleCreateBudgetAndCategorize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post("/budgets", {
        category: newBudgetData.category,
        amount: newBudgetData.amount,
        frequency: newBudgetData.frequency,
        startDate: newBudgetData.startDate,
      });
      toast.success(t("budgets.added"));

      if (categorizeExpense) {
        await api.patch(`/personal-expenses/${categorizeExpense.id}`, {
          category: newBudgetData.category,
          isCategorized: true,
        });
      }

      setShowNewBudgetModal(false);
      setNewBudgetData({
        category: "",
        amount: 0,
        frequency: "MONTHLY",
        startDate: new Date().toISOString().split("T")[0],
      });
      setCategorizeExpense(null);
      fetchBudgets();
      fetchExpenses();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || t("budgets.failed"));
    }
  };

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-4">
        <Link
          href="/dashboard/personal"
          className="p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">
          {t("expenses.title")}
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Quick Entry Form */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("expenses.quickEntry")}
          </h3>
          <form onSubmit={handleQuickExpense} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("expenses.amount")}
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
                {t("expenses.account")}
              </label>
              <select
                value={quickAccount}
                onChange={(e) => setQuickAccount(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
              >
                <option value="">{t("personal.noneUntracked")}</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name} (${acc.balance})
                  </option>
                ))}
              </select>
              {insufficientBalance && (
                <p className="text-xs text-red-500 mt-1">
                  ⚠️ {t("expenses.insufficientBalance")}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                {t("expenses.quickNote")}
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
              disabled={loading || insufficientBalance}
              className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              <Plus className="h-5 w-5 mr-1" />{" "}
              {loading ? t("common.saving") : t("expenses.saveNow")}
            </button>
          </form>
        </div>

        {/* All Expenses List */}
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("expenses.allExpenses")}
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {expenses.length === 0 ? (
              <p className="text-gray-500 text-sm text-center py-4">
                {t("expenses.noExpenses")}
              </p>
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <p className="font-medium text-gray-900">
                      ${exp.amount.toLocaleString()}{" "}
                      <span className="text-xs text-gray-500">
                        ({new Date(exp.date).toLocaleDateString()})
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      {exp.note || t("expenses.noNote")}
                    </p>
                    {exp.account && (
                      <p className="text-xs text-purple-600 mt-0.5">
                        {exp.account.name}
                      </p>
                    )}
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
                          onChange={(e) => {
                            if (e.target.value) {
                              const category = e.target.value;
                              api
                                .patch(`/personal-expenses/${exp.id}`, {
                                  category,
                                  isCategorized: true,
                                })
                                .then(() => {
                                  toast.success("Expense categorized!");
                                  fetchExpenses();
                                })
                                .catch(() =>
                                  toast.error(t("expenses.categorizeFailed")),
                                );
                            }
                          }}
                          defaultValue=""
                          className="text-sm border border-gray-300 rounded-md p-1 bg-white text-gray-900"
                        >
                          <option value="" disabled>
                            {t("expenses.selectCategory")}
                          </option>
                          {budgetCats.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                          <option value="Misc">
                            {t("expenses.miscNotBudgeted")}
                          </option>
                        </select>
                      </>
                    )}
                    <button
                      onClick={() => openCategorizeModal(exp)}
                      className="p-1 text-gray-400 hover:text-indigo-600 transition-colors"
                      title={t("expenses.editExpense")}
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Categorize/Edit Modal */}
      {categorizeExpense && !showNewBudgetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {t("expenses.editExpense")}
            </h2>

            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  ${categorizeExpense.amount.toLocaleString()}
                </span>{" "}
                — {new Date(categorizeExpense.date).toLocaleDateString()}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {categorizeExpense.note || t("expenses.noNote")}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("expenses.category")}
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option value="">{t("expenses.selectCategory")}</option>
                  {budgetCats.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="Misc">{t("expenses.miscNotBudgeted")}</option>
                  <option value="ADD_NEW">
                    {t("expenses.addNewCategory")}
                  </option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("expenses.account")}
                </label>
                <select
                  value={selectedAccount}
                  onChange={(e) => setSelectedAccount(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option value="">{t("personal.noneUntracked")}</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (${acc.balance})
                    </option>
                  ))}
                </select>
                {selectedAccount &&
                  categorizeExpense &&
                  (() => {
                    const selected = accounts.find(
                      (a) => a.id === parseInt(selectedAccount),
                    );
                    if (
                      selected &&
                      selected.balance < categorizeExpense.amount
                    ) {
                      return (
                        <p className="text-xs text-red-500 mt-1">
                          ⚠️ {t("expenses.insufficientBalance")}
                        </p>
                      );
                    }
                    return null;
                  })()}
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-6">
              <button
                onClick={() => setCategorizeExpense(null)}
                className="px-4 py-2 text-gray-600"
              >
                {t("common.cancel")}
              </button>
              <button
                onClick={handleSaveCategorize}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                {t("common.save")}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* New Budget Modal */}
      {showNewBudgetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">
              {t("budgets.modalTitle")}
            </h2>
            <form
              onSubmit={handleCreateBudgetAndCategorize}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("budgets.categoryName")}
                </label>
                <input
                  type="text"
                  required
                  value={newBudgetData.category}
                  onChange={(e) =>
                    setNewBudgetData({
                      ...newBudgetData,
                      category: e.target.value,
                    })
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
                    value={newBudgetData.amount || ""}
                    onChange={(e) =>
                      setNewBudgetData({
                        ...newBudgetData,
                        amount: parseFloat(e.target.value) || 0,
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
                    value={newBudgetData.frequency}
                    onChange={(e) =>
                      setNewBudgetData({
                        ...newBudgetData,
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
                  value={newBudgetData.startDate}
                  onChange={(e) =>
                    setNewBudgetData({
                      ...newBudgetData,
                      startDate: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewBudgetModal(false);
                    setNewBudgetData({
                      category: "",
                      amount: 0,
                      frequency: "MONTHLY",
                      startDate: new Date().toISOString().split("T")[0],
                    });
                  }}
                  className="px-4 py-2 text-gray-600"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  {t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

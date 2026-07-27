"use client";

import api from "@/lib/api";
import { useLangStore } from "@/store/langStore";
import { ArrowLeft, ArrowLeftRight, Plus, Trash2, Wallet } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Account {
  id: number;
  name: string;
  balance: number;
  createdAt: string;
}

interface TransferHistory {
  id: number;
  fromAccountId: number;
  toAccountId: number;
  amount: number;
  date: string;
  note: string | null;
  fromAccount: Account;
  toAccount: Account;
}

export default function PersonalAccountsPage() {
  const { t } = useLangStore();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transfers, setTransfers] = useState<TransferHistory[]>([]);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newBalance, setNewBalance] = useState("0");
  const [fromAccountId, setFromAccountId] = useState("");
  const [toAccountId, setToAccountId] = useState("");
  const [transferAmount, setTransferAmount] = useState("");
  const [transferNote, setTransferNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [accRes, trfRes] = await Promise.all([
        api.get("/personal-accounts"),
        api.get("/personal-accounts/transfers").catch(() => ({ data: [] })),
      ]);
      setAccounts(accRes.data);
      setTransfers(trfRes.data);
    } catch {
      console.error("Failed to fetch accounts");
    } finally {
      setPageLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/personal-accounts", {
        name: newName,
        balance: parseFloat(newBalance) || 0,
      });
      toast.success(t("accounts.created"));
      setIsCreateOpen(false);
      setNewName("");
      setNewBalance("0");
      fetchData();
    } catch {
      toast.error(t("accounts.createFailed"));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm(t("accounts.confirmDelete"))) return;
    try {
      await api.delete(`/personal-accounts/${id}`);
      toast.success(t("accounts.deleted"));
      fetchData();
    } catch {
      toast.error(t("accounts.deleteFailed"));
    }
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccountId || !toAccountId || !transferAmount) {
      toast.error(t("accounts.fillAllFields"));
      return;
    }
    if (fromAccountId === toAccountId) {
      toast.error(t("accounts.sameAccount"));
      return;
    }
    setLoading(true);
    try {
      await api.post("/personal-accounts/transfer", {
        fromAccountId: parseInt(fromAccountId),
        toAccountId: parseInt(toAccountId),
        amount: parseFloat(transferAmount),
        note: transferNote,
      });
      toast.success(t("accounts.transferSuccess"));
      setIsTransferOpen(false);
      setFromAccountId("");
      setToAccountId("");
      setTransferAmount("");
      setTransferNote("");
      fetchData();
    } catch {
      toast.error(t("accounts.transferFailed"));
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const totalBalance = accounts.reduce((s, a) => s + a.balance, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/dashboard/personal"
            className="p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {t("accounts.title")}
          </h1>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsTransferOpen(true)}
            className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            <ArrowLeftRight className="h-5 w-5 mr-1" /> {t("accounts.transfer")}
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-1" /> {t("accounts.newAccount")}
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-6 rounded-lg shadow-sm text-white">
        <p className="text-sm opacity-80">{t("accounts.totalBalance")}</p>
        <p className="text-3xl font-bold mt-1">
          ${totalBalance.toLocaleString()}
        </p>
        <p className="text-sm opacity-80 mt-1">
          {accounts.length} {t("accounts.count")}
        </p>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.length === 0 ? (
          <div className="col-span-full bg-white p-6 rounded-lg shadow-sm border border-gray-200 text-center text-gray-500">
            {t("accounts.noAccounts")}
          </div>
        ) : (
          accounts.map((acc) => (
            <div
              key={acc.id}
              className="bg-white p-5 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-300 transition-all"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Wallet className="h-5 w-5 text-indigo-600" />
                  </div>
                  <h3 className="font-semibold text-gray-900">{acc.name}</h3>
                </div>
                <button
                  onClick={() => handleDelete(acc.id)}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title={t("common.delete")}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <p
                className={`text-2xl font-bold ${acc.balance >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                ${acc.balance.toLocaleString()}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {t("accounts.createdAt")}:{" "}
                {new Date(acc.createdAt).toLocaleDateString()}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Transfer History */}
      {transfers.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {t("accounts.transferHistory")}
          </h3>
          <div className="space-y-2">
            {transfers.map((tr) => (
              <div
                key={tr.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
              >
                <div className="flex items-center space-x-3">
                  <ArrowLeftRight className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {tr.fromAccount?.name || `#${tr.fromAccountId}`} →{" "}
                      {tr.toAccount?.name || `#${tr.toAccountId}`}
                    </p>
                    {tr.note && (
                      <p className="text-xs text-gray-400">{tr.note}</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-indigo-600">
                    ${tr.amount.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-400">
                    {new Date(tr.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {t("accounts.createTitle")}
            </h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("accounts.accountName")}
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={t("accounts.namePlaceholder")}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("accounts.initialBalance")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={newBalance}
                  onChange={(e) => setNewBalance(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? t("common.creating") : t("common.create")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Modal */}
      {isTransferOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">
              {t("accounts.transferTitle")}
            </h2>
            <form onSubmit={handleTransfer} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("accounts.fromAccount")}
                </label>
                <select
                  required
                  value={fromAccountId}
                  onChange={(e) => setFromAccountId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option value="">{t("accounts.selectAccount")}</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (${acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("accounts.toAccount")}
                </label>
                <select
                  required
                  value={toAccountId}
                  onChange={(e) => setToAccountId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option value="">{t("accounts.selectAccount")}</option>
                  {accounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name} (${acc.balance.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("accounts.transferAmount")}
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  {t("accounts.transferNote")}
                </label>
                <input
                  type="text"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsTransferOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  {t("common.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {loading
                    ? t("accounts.transferring")
                    : t("accounts.transfer")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

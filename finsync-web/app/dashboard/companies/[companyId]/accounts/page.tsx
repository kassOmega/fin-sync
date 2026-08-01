"use client";

import { accountsService } from "@/lib/services/accounts";
import type { Account } from "@/lib/services/types";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const TYPE_COLORS: Record<string, string> = {
  ASSET: "text-green-600 bg-green-50",
  LIABILITY: "text-red-600 bg-red-50",
  EQUITY: "text-purple-600 bg-purple-50",
  INCOME: "text-blue-600 bg-blue-50",
  EXPENSE: "text-orange-600 bg-orange-50",
};

const ACCOUNT_TYPES = ["ASSET", "LIABILITY", "EQUITY", "INCOME", "EXPENSE"];

export default function AccountsPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = Number(params.companyId);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const fetchAccounts = async () => {
    const data = await accountsService.list(companyId, {
      ...(typeFilter && { type: typeFilter }),
      ...(search && { search }),
      ...(statusFilter !== "" && { isActive: statusFilter }),
    });
    setAccounts(data);
  };

  useEffect(() => {
    if (companyId) {
      setLoading(true);
      accountsService
        .list(companyId, {
          ...(typeFilter && { type: typeFilter }),
          ...(search && { search }),
          ...(statusFilter !== "" && { isActive: statusFilter }),
        })
        .then(setAccounts)
        .finally(() => setLoading(false));
    }
  }, [companyId, typeFilter, search, statusFilter]);

  const handleSave = async (payload: any) => {
    if (editing) {
      await accountsService.update(companyId, editing.id, payload);
      toast.success("Account updated");
    } else {
      await accountsService.create(companyId, payload);
      toast.success("Account created");
    }
    setModalOpen(false);
    setEditing(null);
    await fetchAccounts();
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Delete this account? This may affect journal entries."))
      return;
    try {
      await accountsService.remove(companyId, id);
      toast.success("Account deleted");
      await fetchAccounts();
    } catch {
      toast.error("Failed to delete — account may be in use");
    }
  };

  if (loading)
    return <div className="p-8 text-gray-500">Loading accounts...</div>;

  const renderAccount = (account: Account, depth = 0) => (
    <div key={account.id}>
      <div
        className={`flex items-center py-2 px-4 hover:bg-gray-50 border-b border-gray-100 ${depth > 0 ? "ml-6" : ""}`}
      >
        <span className="w-24 font-mono text-sm text-gray-600">
          {account.code}
        </span>
        <span className="flex-1 text-sm font-medium text-gray-800">
          {account.name}
        </span>
        <span className="mr-4">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${TYPE_COLORS[account.type] || "bg-gray-100 text-gray-600"}`}
          >
            {account.type}
          </span>
        </span>
        <span className="w-20 text-sm text-gray-500 text-right">
          {account.normalSide === "DEBIT" ? "Dr" : "Cr"}
        </span>
        <span className="w-20 text-sm text-gray-500 text-right">
          <span
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              account.isActive
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            {account.isActive ? "Active" : "Inactive"}
          </span>
        </span>
        <span className="w-24 flex justify-end gap-2">
          <button
            onClick={() => {
              setEditing(account);
              setModalOpen(true);
            }}
            className="text-gray-400 hover:text-indigo-600"
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </button>
          <button
            onClick={() => handleDelete(account.id)}
            className="text-gray-400 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </span>
      </div>
      {account.children?.map((child) => renderAccount(child, depth + 1))}
    </div>
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Chart of Accounts</h1>
        <div className="flex items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search code or name..."
            className="px-3 py-2 text-sm border border-gray-300 rounded-md w-52"
          />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          >
            <option value="">All Types</option>
            {ACCOUNT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          >
            <option value="">All Status</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>
          <button
            onClick={() => {
              setEditing(null);
              setModalOpen(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-1" /> New Account
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center py-3 px-4 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span className="w-24">Code</span>
          <span className="flex-1">Account Name</span>
          <span className="w-24 mr-4">Type</span>
          <span className="w-20 text-right">Side</span>
          <span className="w-20 text-right">Status</span>
          <span className="w-24 text-right">Actions</span>
        </div>
        <div className="divide-y divide-gray-100">
          {accounts.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No accounts found. Click "+ New Account" to get started.
            </div>
          ) : (
            accounts.map((account) => renderAccount(account))
          )}
        </div>
      </div>

      {modalOpen && (
        <AccountFormModal
          companyId={companyId}
          accounts={accounts}
          editing={editing}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          onSave={handleSave}
        />
      )}
    </div>
  );
}

function AccountFormModal({
  companyId,
  accounts,
  editing,
  onClose,
  onSave,
}: {
  companyId: number;
  accounts: Account[];
  editing: Account | null;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    code: editing?.code || "",
    name: editing?.name || "",
    type: editing?.type || "ASSET",
    category: editing?.category || "",
    normalSide: editing?.normalSide || "DEBIT",
    parentId: editing?.parentId ? String(editing.parentId) : "",
    isActive: editing?.isActive ?? true,
    description: editing?.description || "",
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim() || !form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        code: form.code.trim(),
        name: form.name.trim(),
        type: form.type,
        category: form.category || undefined,
        normalSide: form.normalSide,
        parentId: form.parentId ? Number(form.parentId) : undefined,
        isActive: form.isActive,
        description: form.description || undefined,
      });
    } catch {
      toast.error("Failed to save account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editing ? "Edit Account" : "New Account"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Code *</label>
              <input
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value })}
                placeholder="e.g. 1001"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Type *</label>
              <select
                value={form.type}
                onChange={(e) =>
                  setForm({ ...form, type: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              >
                {ACCOUNT_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Cash in Bank"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Category
              </label>
              <input
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                placeholder="e.g. Current Assets"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Normal Side
              </label>
              <select
                value={form.normalSide}
                onChange={(e) =>
                  setForm({ ...form, normalSide: e.target.value as any })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              >
                <option value="DEBIT">Debit (Dr)</option>
                <option value="CREDIT">Credit (Cr)</option>
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Parent Account
              </label>
              <select
                value={form.parentId}
                onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              >
                <option value="">None (top-level)</option>
                {accounts
                  .filter((a) => a.id !== editing?.id)
                  .map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-end pb-1">
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) =>
                    setForm({ ...form, isActive: e.target.checked })
                  }
                  className="h-4 w-4"
                />{" "}
                Active
              </label>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Description
            </label>
            <textarea
              value={form.description}
              onChange={(e) =>
                setForm({ ...form, description: e.target.value })
              }
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              placeholder="Optional description"
            />
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md disabled:opacity-50"
            >
              {saving
                ? "Saving..."
                : editing
                  ? "Update Account"
                  : "Create Account"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

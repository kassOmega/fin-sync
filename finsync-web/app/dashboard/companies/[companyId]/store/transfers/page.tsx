"use client";

import { storeService } from "@/lib/services/store";
import type { Store, StoreCategory, StoreItem, StoreTransfer } from "@/lib/services/types";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import {
  ArrowRightLeft,
  CheckCircle,
  Plus,
  XCircle,
} from "lucide-react";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default function StoreTransfersPage() {
  const params = useParams();
  const companyId = Number(params.companyId);
  const { hasRole } = useAuthStore();
  const [stores, setStores] = useState<Store[]>([]);
  const [transfers, setTransfers] = useState<StoreTransfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [form, setForm] = useState({
    fromStoreId: "",
    toStoreId: "",
    itemId: "",
    quantity: "",
    note: "",
  });
  const [items, setItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [itemsLoading, setItemsLoading] = useState(false);

  const fetchStores = useCallback(async () => {
    try {
      return await storeService.listStores(companyId);
    } catch {
      toast.error("Failed to load stores");
      return [];
    }
  }, [companyId]);

  const fetchTransfers = useCallback(async () => {
    return storeService.listTransfers({
      status: statusFilter || undefined,
    });
  }, [statusFilter]);

  const loadAll = useCallback(async () => {
    try {
      const [s, t] = await Promise.all([fetchStores(), fetchTransfers()]);
      setStores(s);
      setTransfers(t);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchStores, fetchTransfers]);

  useEffect(() => {
    if (companyId) loadAll();
  }, [companyId, loadAll]);

  // When source store changes, fetch its items + categories using the store's real company
  const handleFromStoreChange = async (storeId: string) => {
    setForm((prev) => ({ ...prev, fromStoreId: storeId, itemId: "", toStoreId: "" }));
    setCategoryFilter("");
    if (!storeId) {
      setItems([]);
      setCategories([]);
      return;
    }
    setItemsLoading(true);
    try {
      const store = stores.find((s) => s.id === Number(storeId));
      if (!store) { setItems([]); return; }
      const [it, cats] = await Promise.all([
        storeService.listItems(store.companyId, undefined, Number(storeId)),
        storeService.listCategories(store.companyId),
      ]);
      setItems(it);
      setCategories(cats);
    } catch {
      setItems([]);
      setCategories([]);
      toast.error("Failed to load items");
    } finally {
      setItemsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromStoreId || !form.toStoreId || !form.itemId || !form.quantity) return;
    try {
      await storeService.requestTransfer({
        fromStoreId: Number(form.fromStoreId),
        toStoreId: Number(form.toStoreId),
        itemId: Number(form.itemId),
        quantity: Number(form.quantity),
        note: form.note || undefined,
      });
      toast.success("Transfer requested");
      setShowModal(false);
      setForm({ fromStoreId: "", toStoreId: "", itemId: "", quantity: "", note: "" });
      setItems([]);
      loadAll();
    } catch {
      toast.error("Failed to request transfer");
    }
  };

  const handleApprove = async (id: number) => {
    try { await storeService.approveTransfer(id); toast.success("Approved"); loadAll(); }
    catch { toast.error("Failed"); }
  };
  const handleReject = async (id: number) => {
    try { await storeService.rejectTransfer(id); toast.success("Rejected"); loadAll(); }
    catch { toast.error("Failed"); }
  };
  const handleComplete = async (id: number) => {
    try { await storeService.completeTransfer(id); toast.success("Completed"); loadAll(); }
    catch { toast.error("Failed"); }
  };

  const storeLabel = (s: Store) =>
    `${s.name}${s.projectId ? " (Project)" : ""}`;

  const filteredItems = categoryFilter
    ? items.filter((it) => it.categoryId === Number(categoryFilter))
    : items;

  const availableStores = stores.filter((s) => s.isActive !== false);
  const toStoreOptions = availableStores.filter(
    (s) => s.id !== Number(form.fromStoreId),
  );

  if (loading) return <div className="p-8 text-gray-500">Loading transfers...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Store Transfers</h1>
        <button onClick={() => setShowModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-1.5 hover:bg-indigo-700">
          <Plus className="h-4 w-4" /> New Transfer
        </button>
      </div>

      <div className="flex gap-4 items-center">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm">
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="COMPLETED">Completed</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transfers.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-8 text-center text-gray-500">No transfers yet.</td></tr>
            ) : (
              transfers.map((t) => (
                <tr key={t.id} className="hover:bg-gray-50 text-gray-900">
                  <td className="px-4 py-3 text-sm">{t.fromStore.name}</td>
                  <td className="px-4 py-3 text-sm">{t.toStore.name}</td>
                  <td className="px-4 py-3 text-sm">{t.item.name} ({t.item.unit})</td>
                  <td className="px-4 py-3 text-sm text-right">{t.quantity}</td>
                  <td className="px-4 py-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[t.status] || "bg-gray-100 text-gray-600"}`}>{t.status}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {t.status === "PENDING" && hasRole([SystemRole.Owner]) && (
                      <>
                        <button onClick={() => handleApprove(t.id)} className="px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs mr-1"><CheckCircle className="h-3 w-3 inline mr-0.5" />Approve</button>
                        <button onClick={() => handleReject(t.id)} className="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 text-xs"><XCircle className="h-3 w-3 inline mr-0.5" />Reject</button>
                      </>
                    )}
                    {t.status === "APPROVED" && hasRole([SystemRole.Owner, SystemRole.Storekeeper]) && (
                      <button onClick={() => handleComplete(t.id)} className="px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 text-xs"><ArrowRightLeft className="h-3 w-3 inline mr-0.5" />Complete</button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>


      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold mb-4">Request Transfer</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">From Store</label>
                <select
                  required
                  value={form.fromStoreId}
                  onChange={(e) => handleFromStoreChange(e.target.value)}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                >
                  <option value="">Select source store...</option>
                  {availableStores.map((s) => (
                    <option key={s.id} value={s.id}>
                      {storeLabel(s)}
                    </option>
                  ))}
                </select>
                {form.fromStoreId && (
                  <p className="text-xs text-gray-500 mt-1">
                    {items.length} items in {categories.length} categories
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Store</label>
                <select
                  required
                  value={form.toStoreId}
                  onChange={(e) => setForm({ ...form, toStoreId: e.target.value })}
                  className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                >
                  <option value="">Select destination store...</option>
                  {toStoreOptions.map((s) => (
                    <option key={s.id} value={s.id}>
                      {storeLabel(s)}
                    </option>
                  ))}
                </select>
              </div>
              {form.fromStoreId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Category</label>
                    <select
                      value={categoryFilter}
                      onChange={(e) => { setCategoryFilter(e.target.value); setForm({ ...form, itemId: "" }); }}
                      className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm"
                    >
                      <option value="">All ({items.length})</option>
                      {categories.map((c) => {
                        const count = items.filter((it) => it.categoryId === c.id).length;
                        return (
                          <option key={c.id} value={c.id}>
                            {c.name} ({count})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Item</label>
                    <select
                      required
                      value={form.itemId}
                      onChange={(e) => setForm({ ...form, itemId: e.target.value })}
                      className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm"
                      disabled={itemsLoading}
                    >
                      <option value="">
                        {itemsLoading ? "Loading..." : filteredItems.length === 0 ? "No items match" : "Select item..."}
                      </option>
                      {filteredItems.map((it) => (
                        <option key={it.id} value={it.id}>
                          {it.name} — {it.quantity - it.reservedQuantity} {it.unit}
                        </option>
                      ))}
                    </select>
                    {form.itemId && (() => {
                      const sel = filteredItems.find((it) => it.id === Number(form.itemId));
                      if (!sel) return null;
                      const avail = sel.quantity - sel.reservedQuantity;
                      return (
                        <p className={`text-xs mt-1 ${avail <= 0 ? "text-red-500 font-medium" : "text-gray-500"}`}>
                          Available: {avail} {sel.unit}{avail <= 0 ? " (out of stock)" : ""}
                        </p>
                      );
                    })()}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input required type="number" min="0.5" step="0.5" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note (optional)</label>
                <input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900" />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-gray-600">Cancel</button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700">Request Transfer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { storeService } from "@/lib/services/store";
import type { Store, StoreItem, StoreCategory, StoreTransfer } from "@/lib/services/types";
import { Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  COMPLETED: "bg-green-100 text-green-800",
};

export default function ProjectTransfersPage() {
  const { companyId, projectId } = useParams() as { companyId: string; projectId: string };
  const cid = Number(companyId);
  const pid = Number(projectId);
  const [transfers, setTransfers] = useState<StoreTransfer[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [itemsLoading, setItemsLoading] = useState(false);
  const [form, setForm] = useState({ fromStoreId: "", toStoreId: "", itemId: "", quantity: "", note: "" });

  const fetchTransfers = async () => {
    try {
      setTransfers(await storeService.listProjectTransfers(cid, pid, statusFilter || undefined));
    } catch { toast.error("Failed"); }
  };

  const fetchStores = async () => {
    try {
      const [projectStores, companyStores] = await Promise.all([
        storeService.listProjectStores(cid, pid),
        storeService.listStores(cid),
      ]);
      // Merge: project stores + company stores (deduplicated by id)
      const all = [...projectStores];
      for (const cs of companyStores) {
        if (!cs.projectId && !all.find((s) => s.id === cs.id)) all.push(cs);
      }
      setStores(all);
    } catch { }
  };

  const loadData = async () => {
    setLoading(true);
    await Promise.all([fetchTransfers(), fetchStores()]);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, [cid, pid, statusFilter]);

  const handleFromStoreChange = async (storeId: string) => {
    setForm((prev) => ({ ...prev, fromStoreId: storeId, itemId: "", toStoreId: "" }));
    setCategoryFilter("");
    if (!storeId) { setItems([]); setCategories([]); return; }
    setItemsLoading(true);
    try {
      const store = stores.find((s) => s.id === Number(storeId));
      if (!store) return;
      const [it, cats] = await Promise.all([
        storeService.listItems(store.companyId, undefined, Number(storeId)),
        storeService.listCategories(store.companyId),
      ]);
      setItems(it);
      setCategories(cats);
    } catch { setItems([]); } finally { setItemsLoading(false); }
  };

  const filteredItems = categoryFilter ? items.filter((it) => it.categoryId === Number(categoryFilter)) : items;
  const toStoreOptions = stores.filter((s) => s.id !== Number(form.fromStoreId) && s.isActive !== false);
  const storeLabel = (s: Store) => `${s.name}${s.projectId ? " (Project)" : ""}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      loadData();
    } catch { toast.error("Failed"); }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Project Transfers</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md flex items-center gap-1.5 hover:bg-indigo-700 text-sm"
        >
          <Plus className="h-4 w-4" /> New Transfer
        </button>
      </div>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        className="border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm"
      >
        <option value="">All Statuses</option>
        <option value="PENDING">Pending</option>
        <option value="APPROVED">Approved</option>
        <option value="COMPLETED">Completed</option>
        <option value="REJECTED">Rejected</option>
      </select>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">From</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {transfers.length === 0 ? (
              <tr><td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transfers for this project.</td></tr>
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
                <select required value={form.fromStoreId} onChange={(e) => handleFromStoreChange(e.target.value)} className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900">
                  <option value="">Select source store...</option>
                  {stores.filter(s => s.isActive !== false).map((s) => <option key={s.id} value={s.id}>{storeLabel(s)}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">To Store</label>
                <select required value={form.toStoreId} onChange={(e) => setForm({ ...form, toStoreId: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900">
                  <option value="">Select destination...</option>
                  {toStoreOptions.map((s) => <option key={s.id} value={s.id}>{storeLabel(s)}</option>)}
                </select>
              </div>
              {form.fromStoreId && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Category</label>
                    <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setForm({...form, itemId: ""}); }} className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm">
                      <option value="">All ({items.length})</option>
                      {categories.map((c) => { const n = items.filter(it => it.categoryId === c.id).length; return <option key={c.id} value={c.id}>{c.name} ({n})</option>; })}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">Item</label>
                    <select required value={form.itemId} onChange={(e) => setForm({ ...form, itemId: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900 text-sm" disabled={itemsLoading}>
                      <option value="">{itemsLoading ? "Loading..." : filteredItems.length === 0 ? "No items" : "Select..."}</option>
                      {filteredItems.map((it) => <option key={it.id} value={it.id}>{it.name} — {it.quantity - it.reservedQuantity} {it.unit}</option>)}
                    </select>
                    {form.itemId && (() => { const sel = filteredItems.find(it => it.id === Number(form.itemId)); if (!sel) return null; const a = sel.quantity - sel.reservedQuantity; return <p className={`text-xs mt-1 ${a <= 0 ? "text-red-500" : "text-gray-500"}`}>Available: {a} {sel.unit}</p>; })()}
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                <input required type="number" min="0.5" step="0.5" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
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

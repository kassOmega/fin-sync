"use client";

import Loading from "@/components/Loading";

import api from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Purchase {
  id: number;
  totalAmount: number;
  note: string | null;
  date: string;
  supplier: { name: string } | null;
  user: { name: string };
  items: any[];
}

export default function ProjectPurchasesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    note: "",
    suppliers: [] as any[],
    selectedSupplier: "",
  });
  const [categories, setCategories] = useState<any[]>([]);
  const [storeItems, setStoreItems] = useState<any[]>([]);
  const [purchaseItems, setPurchaseItems] = useState<any[]>([]);

  const fetchAll = async () => {
    try {
      const [pRes, cRes, iRes] = await Promise.all([
        api.get(`/companies/${companyId}/projects/${projectId}/purchases`),
        api.get(`/companies/${companyId}/store-items/categories`),
        api.get(`/companies/${companyId}/store-items`),
      ]);
      setPurchases(Array.isArray(pRes.data) ? pRes.data : []);
      setCategories(Array.isArray(cRes.data) ? cRes.data : []);
      setStoreItems(Array.isArray(iRes.data) ? iRes.data : []);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyId || !projectId) {
      router.push("/dashboard/companies");
      return;
    }
    fetchAll();
  }, []);

  const addItemLine = () =>
    setPurchaseItems([
      ...purchaseItems,
      { itemId: "", quantity: 1, unitCost: 0 },
    ]);
  const updateItemLine = (i: number, f: string, v: any) => {
    const u = [...purchaseItems];
    u[i][f] = v;
    setPurchaseItems(u);
  };
  const removeItemLine = (i: number) =>
    setPurchaseItems(purchaseItems.filter((_, idx) => idx !== i));

  const totalAmount = purchaseItems.reduce(
    (s, pi) => s + (pi.quantity || 0) * (pi.unitCost || 0),
    0,
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    try {
      await api.post(
        `/companies/${companyId}/projects/${projectId}/purchases`,
        {
          supplierId: form.selectedSupplier
            ? parseInt(form.selectedSupplier)
            : null,
          amount: totalAmount,
          note: form.note,
          items: purchaseItems.map((pi) => ({
            itemId: pi.itemId ? parseInt(pi.itemId) : undefined,
            quantity: pi.quantity,
            unitCost: pi.unitCost,
          })),
        },
      );
      toast.success("Purchase recorded");
      setModalOpen(false);
      setPurchaseItems([]);
      setForm({ ...form, amount: "", note: "", selectedSupplier: "" });
      fetchAll();
    } catch {
      toast.error("Failed");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Project Purchases</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm"
        >
          <Plus className="h-4 w-4 mr-1" /> Record Purchase
        </button>
      </div>
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Supplier</th>
                  <th className="text-left px-4 py-3 font-medium">Items</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-xs sm:text-sm">
                      No purchases recorded.
                    </td>
                  </tr>
                ) : (
                  purchases.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50 text-gray-900">
                      <td className="px-4 py-3 text-xs sm:text-sm">
                        {new Date(p.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        {p.supplier?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-500">
                        {p.items?.length || 0} item(s)
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm font-medium text-red-600">
                        ${p.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={async () => {
                            if (!confirm("Delete?")) return;
                            try {
                              await api.delete(
                                `/companies/${companyId}/projects/${projectId}/purchases/${p.id}`,
                              );
                              toast.success("Deleted");
                              fetchAll();
                            } catch {
                              toast.error("Failed");
                            }
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              New Purchase
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note
                </label>
                <input
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Items
                  </label>
                  <button
                    type="button"
                    onClick={addItemLine}
                    className="text-sm text-indigo-600"
                  >
                    + Add Item
                  </button>
                </div>
                {purchaseItems.map((pi, idx) => (
                  <div
                    key={idx}
                    className="border border-gray-200 rounded p-3 mb-2 space-y-2"
                  >
                    <div className="flex space-x-2">
                      <select
                        value={pi.itemId}
                        onChange={(e) =>
                          updateItemLine(idx, "itemId", e.target.value)
                        }
                        className="flex-1 border border-gray-300 rounded p-1.5 text-sm bg-white text-gray-900"
                      >
                        <option value="">Select item</option>
                        {storeItems.map((si) => (
                          <option key={si.id} value={si.id}>
                            {si.name} (${si.costPrice})
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="1"
                        value={pi.quantity}
                        onChange={(e) =>
                          updateItemLine(
                            idx,
                            "quantity",
                            parseInt(e.target.value) || 1,
                          )
                        }
                        className="w-20 border border-gray-300 rounded p-1.5 text-sm bg-white text-gray-900"
                        placeholder="Qty"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={pi.unitCost}
                        onChange={(e) =>
                          updateItemLine(
                            idx,
                            "unitCost",
                            parseFloat(e.target.value) || 0,
                          )
                        }
                        className="w-24 border border-gray-300 rounded p-1.5 text-sm bg-white text-gray-900"
                        placeholder="Cost"
                      />
                      <button
                        type="button"
                        onClick={() => removeItemLine(idx)}
                        className="text-red-500 text-sm px-2"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="bg-gray-50 p-3 rounded text-right">
                <p className="text-lg font-bold text-gray-900">
                  Total: ${totalAmount.toFixed(2)}
                </p>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Record Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Loader2, Pencil, Trash2, Truck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface StoreCategory {
  id: number;
  name: string;
  _count: { items: number };
}

interface StoreItem {
  id: number;
  name: string;
  costPrice: number;
  sellingPrice: number;
  quantity: number;
  categoryId: number;
  category?: StoreCategory;
}

interface Supplier {
  id: number;
  name: string;
  phone?: string;
}

interface PurchaseItem {
  id: number;
  quantity: number;
  unitCost: number;
  total: number;
  storeItem: StoreItem;
}

interface Purchase {
  id: number;
  totalAmount: number;
  note: string | null;
  date: string;
  supplier: Supplier | null;
  user: { id: number; name: string };
  items: PurchaseItem[];
}

export default function PurchasesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isPurchaseOpen, setIsPurchaseOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editNote, setEditNote] = useState("");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isCategoryOpen, setIsCategoryOpen] = useState(false);
  const [isSupplierOpen, setIsSupplierOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [accounts, setAccounts] = useState<
    { id: number; code: string; name: string; type: string }[]
  >([]);
  const [selectedSupplier, setSelectedSupplier] = useState("");
  const [purchaseNote, setPurchaseNote] = useState("");
  const [purchaseAccountId, setPurchaseAccountId] = useState("");

  const fetchAccounts = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/accounts`);
      setAccounts(res.data || []);
    } catch {
      /* fallback */
    }
  };
  const [purchaseItems, setPurchaseItems] = useState<
    {
      itemId?: number;
      name?: string;
      categoryId?: number;
      sellingPrice?: number;
      quantity: number;
      unitCost: number;
      isNew?: boolean;
      categoryFilter?: number;
    }[]
  >([]);

  const [supName, setSupName] = useState("");
  const [supPhone, setSupPhone] = useState("");
  const [supEmail, setSupEmail] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");

  const fetchData = async () => {
    try {
      const [purRes, supRes, catRes] = await Promise.all([
        api.get(`/companies/${companyId}/purchases`),
        api.get(`/companies/${companyId}/purchases/suppliers/list`),
        api.get(`/companies/${companyId}/store-items/categories`),
      ]);
      setPurchases(purRes.data);
      setSuppliers(supRes.data);
      setCategories(catRes.data);
    } catch {
      toast.error("Failed to load data");
    }
  };

  const fetchStoreItems = async (categoryId?: number) => {
    try {
      const urlParams = new URLSearchParams();
      if (categoryId) urlParams.append("categoryId", String(categoryId));
      const qs = urlParams.toString();
      const res = await api.get(
        `/companies/${companyId}/store-items${qs ? `?${qs}` : ""}`,
      );
      setStoreItems(res.data);
    } catch {
      // silent
    }
  };

  useEffect(() => {
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    const load = async () => {
      setPageLoading(true);
      await Promise.all([fetchData(), fetchStoreItems(), fetchAccounts()]);
      setPageLoading(false);
    };
    load();
  }, [companyId, router]);

  if (!companyId) {
    return null;
  }

  const addLine = () => {
    setPurchaseItems([
      ...purchaseItems,
      { itemId: undefined, quantity: 1, unitCost: 0, isNew: false },
    ]);
  };

  const updateLine = (index: number, field: string, value: number | string) => {
    const updated = [...purchaseItems];
    (updated[index] as Record<string, unknown>)[field] = value;
    if (field === "categoryFilter" && typeof value === "number") {
      fetchStoreItems(value || undefined);
    }
    if (field === "itemId" && typeof value === "number" && value > 0) {
      const item = storeItems.find((i) => i.id === value);
      if (item) updated[index].unitCost = item.costPrice;
      updated[index].isNew = false;
    }
    setPurchaseItems(updated);
  };

  const removeLine = (index: number) => {
    setPurchaseItems(purchaseItems.filter((_, i) => i !== index));
  };

  const toggleNewItem = (index: number) => {
    const updated = [...purchaseItems];
    updated[index].isNew = !updated[index].isNew;
    if (updated[index].isNew) {
      updated[index].itemId = undefined;
      updated[index].name = "";
      updated[index].categoryId = undefined;
    }
    setPurchaseItems(updated);
  };

  const totalAmount = purchaseItems.reduce(
    (sum, pi) => sum + pi.quantity * pi.unitCost,
    0,
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (purchaseItems.length === 0) {
      toast.error("Add at least one item");
      return;
    }
    for (const item of purchaseItems) {
      if (item.isNew && (!item.name || !item.categoryId)) {
        toast.error("New items need a name and category");
        return;
      }
    }
    setLoading(true);
    try {
      await api.post(`/companies/${companyId}/purchases`, {
        supplierId: selectedSupplier ? parseInt(selectedSupplier) : null,
        amount: totalAmount,
        note: purchaseNote,
        accountId: purchaseAccountId ? parseInt(purchaseAccountId) : undefined,
        items: purchaseItems.map((pi) =>
          pi.isNew
            ? {
                name: pi.name,
                categoryId: pi.categoryId,
                sellingPrice: pi.sellingPrice || pi.unitCost * 1.2,
                quantity: pi.quantity,
                unitCost: pi.unitCost,
              }
            : {
                itemId: pi.itemId,
                quantity: pi.quantity,
                unitCost: pi.unitCost,
              },
        ),
      });
      toast.success("Purchase recorded!");
      setIsPurchaseOpen(false);
      setPurchaseItems([]);
      setSelectedSupplier("");
      setPurchaseNote("");
      setPurchaseAccountId("");
      fetchData();
      fetchStoreItems();
    } catch {
      toast.error("Failed to record purchase");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePurchase = async (id: number) => {
    if (
      !confirm("Delete this purchase? The linked journal entry will be voided.")
    )
      return;
    setLoading(true);
    try {
      await api.delete(`/companies/${companyId}/purchases/${id}`);
      toast.success("Purchase deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete purchase");
    } finally {
      setLoading(false);
    }
  };

  const openEdit = (p: Purchase) => {
    setEditingPurchase(p);
    setEditAmount(String(p.totalAmount));
    setEditNote(p.note || "");
    setIsEditOpen(true);
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPurchase) return;
    setLoading(true);
    try {
      await api.patch(
        `/companies/${companyId}/purchases/${editingPurchase.id}`,
        {
          amount: parseFloat(editAmount),
          note: editNote,
        },
      );
      toast.success("Purchase updated");
      setIsEditOpen(false);
      setEditingPurchase(null);
      fetchData();
    } catch {
      toast.error("Failed to update purchase");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post(
        `/companies/${companyId}/purchases/suppliers`,
        { name: supName, phone: supPhone, email: supEmail },
      );
      setSuppliers([...suppliers, res.data]);
      setSelectedSupplier(String(res.data.id));
      toast.success("Supplier added");
      setIsSupplierOpen(false);
      setSupName("");
      setSupPhone("");
      setSupEmail("");
    } catch {
      toast.error("Failed to add supplier");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    setLoading(true);
    try {
      const res = await api.post(
        `/companies/${companyId}/store-items/categories`,
        { name: newCategoryName.trim() },
      );
      setCategories([...categories, res.data]);
      toast.success("Category added");
      setIsCategoryOpen(false);
      setNewCategoryName("");
    } catch {
      toast.error("Failed to add category");
    } finally {
      setLoading(false);
    }
  };

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Purchases</h1>
        <div className="flex items-center space-x-3">
          {hasRole([SystemRole.Owner, SystemRole.Storekeeper]) && (
            <>
              <button
                onClick={() => setIsCategoryOpen(true)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                + Category
              </button>
              <button
                onClick={() => setIsSupplierOpen(true)}
                className="flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
              >
                + Supplier
              </button>
              <button
                onClick={() => setIsPurchaseOpen(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                <Truck className="h-5 w-5 mr-1" /> New Purchase
              </button>
            </>
          )}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Supplier
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Items
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                By
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {purchases.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No purchases recorded yet.
                </td>
              </tr>
            ) : (
              purchases.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {new Date(p.date).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {p.supplier?.name || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {p.items?.length || 0} item(s)
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                    ${p.totalAmount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {p.user?.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => openEdit(p)}
                      className="text-indigo-600 hover:text-indigo-900 mx-1"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDeletePurchase(p.id)}
                      className="text-red-500 hover:text-red-700 mx-1"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <Truck className="h-5 w-5 mr-2" /> Suppliers ({suppliers.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {suppliers.map((s) => (
            <div key={s.id} className="p-3 bg-gray-50 rounded-lg">
              <p className="font-medium text-gray-900">{s.name}</p>
              {s.phone && <p className="text-xs text-gray-500">{s.phone}</p>}
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">
          Categories ({categories.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <span
              key={cat.id}
              className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded-full text-sm"
            >
              {cat.name} ({cat._count.items})
            </span>
          ))}
        </div>
      </div>

      {isEditOpen && editingPurchase && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">
              Edit Purchase #{editingPurchase.id}
            </h2>
            <form onSubmit={handleEdit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Note
                </label>
                <input
                  type="text"
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                />
              </div>
              <div className="text-xs text-gray-500">
                Editing this purchase will void the old journal entry and
                re-post a new one with the updated amount.
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setEditingPurchase(null);
                  }}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPurchaseOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">New Purchase</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Supplier
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                >
                  <option value="">No supplier</option>
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Account (COA) Selector
                </label>
                <select
                  value={purchaseAccountId}
                  onChange={(e) => setPurchaseAccountId(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                >
                  <option value="">Default (Inventory)</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.code} — {a.name} ({a.type})
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-400 mt-1">
                  Maps this purchase to the selected Chart of Accounts account
                  for the journal entry.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Items
                  </label>
                  <button
                    type="button"
                    onClick={addLine}
                    className="text-sm text-indigo-600"
                  >
                    + Add Item
                  </button>
                </div>
                {purchaseItems.map((pi, index) => (
                  <div
                    key={index}
                    className="border border-gray-200 rounded-md p-3 mb-2"
                  >
                    <div className="flex items-center mb-2">
                      <label className="flex items-center text-sm">
                        <input
                          type="checkbox"
                          checked={pi.isNew || false}
                          onChange={() => toggleNewItem(index)}
                          className="mr-2"
                        />
                        Create new item
                      </label>
                      <button
                        type="button"
                        onClick={() => removeLine(index)}
                        className="ml-auto text-red-500 hover:text-red-700 text-sm"
                      >
                        Remove
                      </button>
                    </div>

                    {pi.isNew ? (
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">
                            Item Name
                          </label>
                          <input
                            type="text"
                            placeholder="Item name"
                            value={pi.name || ""}
                            onChange={(e) =>
                              updateLine(index, "name", e.target.value)
                            }
                            className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">
                            Category
                          </label>
                          <select
                            value={pi.categoryId || ""}
                            onChange={(e) =>
                              updateLine(
                                index,
                                "categoryId",
                                parseInt(e.target.value),
                              )
                            }
                            className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                          >
                            <option value="">Item Category</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">
                            Selling Price
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Selling price (default markup: 20%)"
                            value={pi.sellingPrice || ""}
                            onChange={(e) =>
                              updateLine(
                                index,
                                "sellingPrice",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 block mb-0.5">
                            Unit Cost
                          </label>
                          <input
                            type="number"
                            step="0.01"
                            placeholder="Unit cost"
                            value={pi.unitCost}
                            onChange={(e) =>
                              updateLine(
                                index,
                                "unitCost",
                                parseFloat(e.target.value) || 0,
                              )
                            }
                            className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                          />
                        </div>
                      </div>
                    ) : (
                      <div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                          <div>
                            <label className="text-xs text-gray-500 block mb-0.5">
                              Filter by Category
                            </label>
                            <select
                              value={pi.categoryFilter || ""}
                              onChange={(e) =>
                                updateLine(
                                  index,
                                  "categoryFilter",
                                  e.target.value
                                    ? parseInt(e.target.value)
                                    : "",
                                )
                              }
                              className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                            >
                              <option value="">All Categories</option>
                              {categories.map((cat) => (
                                <option key={cat.id} value={cat.id}>
                                  {cat.name}
                                </option>
                              ))}
                            </select>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-0.5">
                              Select Item
                            </label>
                            <select
                              value={pi.itemId || 0}
                              onChange={(e) =>
                                updateLine(
                                  index,
                                  "itemId",
                                  parseInt(e.target.value),
                                )
                              }
                              className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                            >
                              <option value={0}>Select item</option>
                              {storeItems.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name} (${item.costPrice}) — Stock:{" "}
                                  {item.quantity}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          <div>
                            <label className="text-xs text-gray-500 block mb-0.5">
                              Quantity
                            </label>
                            <input
                              type="number"
                              min="1"
                              value={pi.quantity}
                              onChange={(e) =>
                                updateLine(
                                  index,
                                  "quantity",
                                  parseInt(e.target.value) || 1,
                                )
                              }
                              className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                              placeholder="Qty"
                            />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 block mb-0.5">
                              Unit Cost
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={pi.unitCost}
                              onChange={(e) =>
                                updateLine(
                                  index,
                                  "unitCost",
                                  parseFloat(e.target.value) || 0,
                                )
                              }
                              className="border border-gray-300 rounded-md p-1.5 text-sm w-full"
                              placeholder="Cost"
                            />
                          </div>
                          <span className="text-sm text-gray-500 self-end pb-1">
                            = ${(pi.quantity * pi.unitCost).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Note
                </label>
                <input
                  type="text"
                  value={purchaseNote}
                  onChange={(e) => setPurchaseNote(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                />
              </div>

              <div className="bg-gray-50 p-4 rounded-lg text-right">
                <p className="text-lg font-bold text-gray-900">
                  Total: ${totalAmount.toFixed(2)}
                </p>
              </div>

              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPurchaseOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {loading ? "Saving..." : "Record Purchase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isSupplierOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">Add Supplier</h2>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={supName}
                  onChange={(e) => setSupName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Phone
                </label>
                <input
                  type="text"
                  value={supPhone}
                  onChange={(e) => setSupPhone(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  value={supEmail}
                  onChange={(e) => setSupEmail(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}
                  {loading ? "Adding..." : "Add Supplier"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isCategoryOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">Add Item Category</h2>
            <form onSubmit={handleCreateCategory} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category Name
                </label>
                <input
                  type="text"
                  required
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white"
                  placeholder="e.g., Electronics, Food..."
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCategoryOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
                >
                  {loading && <Loader2 className="h-4 w-4 mr-1 animate-spin" />}{" "}
                  Add
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

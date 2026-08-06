"use client";

import Loading from "@/components/Loading";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import {
  ArrowUpCircle,
  ClipboardList,
  Package,
  Plus,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface StoreItem {
  id: number | string;
  name: string;
  category: { id: number; name: string } | string;
  quantity: number;
  lowStockThreshold?: number;
  unit: string;
  isTool?: boolean;
}

interface Unit {
  id: number;
  name: string;
}

export default function StorePage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { hasRole } = useAuthStore();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [units, setUnits] = useState<Unit[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [restockItem, setRestockItem] = useState<StoreItem | null>(null);
  const [restockQty, setRestockQty] = useState<number>(0);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [itemData, setItemData] = useState({
    name: "",
    type: "CONSUMABLE",
    categoryId: null as number | null,
    quantity: 0,
    lowStockThreshold: 5,
    unit: "pcs",
  });

  const fetchCategories = async () => {
    try {
      const res = await api.get(
        `/companies/${companyId}/store-items/categories`,
      );
      setCategories(res.data);
    } catch {
      /* silent */
    }
  };

  const fetchItems = async () => {
    try {
      const p = new URLSearchParams();
      if (categoryFilter) p.append("categoryId", categoryFilter);
      const qs = p.toString();
      const res = await api.get(
        `/companies/${companyId}/store-items${qs ? `?${qs}` : ""}`,
      );
      setItems(res.data);
    } catch {
      toast.error("Failed to load store data");
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await api.get("/measuring-units");
      setUnits(res.data);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    const load = async () => {
      setPageLoading(true);
      await Promise.all([fetchCategories(), fetchItems(), fetchUnits()]);
      setPageLoading(false);
    };
    load();
  }, [companyId, router]);

  useEffect(() => {
    if (companyId) {
      fetchItems();
    }
  }, [categoryFilter]);

  if (!companyId) {
    return null;
  }

  const handleCreateItem = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!itemData.categoryId) {
      toast.error("Please select a category");
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        name: itemData.name,
        categoryId: itemData.categoryId,
        quantity: itemData.quantity,
        unit: itemData.unit,
      };
      if (itemData.type !== "TOOL") {
        payload.lowStockThreshold = itemData.lowStockThreshold;
      }
      await api.post(`/companies/${companyId}/store-items`, payload);
      toast.success("Item added");
      setIsModalOpen(false);
      setItemData({
        name: "",
        type: "CONSUMABLE",
        categoryId: null,
        quantity: 0,
        lowStockThreshold: 5,
        unit: "pcs",
      });
      fetchItems();
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockItem || restockQty <= 0) {
      toast.error("Enter a valid quantity");
      return;
    }
    try {
      await api.post(
        `/companies/${companyId}/store-items/${restockItem.id}/transaction`,
        { type: "RESTOCK", quantity: restockQty },
      );
      toast.success("Restocked successfully");
      setRestockItem(null);
      setRestockQty(0);
      fetchItems();
    } catch {
      toast.error("Failed to restock");
    }
  };

  const handleAddNewUnit = async () => {
    const newUnit = prompt(
      "Enter new measuring unit name (e.g., boxes, liters):",
    );
    if (newUnit) {
      try {
        const res = await api.post("/measuring-units", { name: newUnit });
        setUnits([...units, res.data]);
        setItemData({ ...itemData, unit: res.data.name });
        toast.success("Unit added!");
      } catch {
        toast.error("Failed to add unit");
      }
    }
  };

  if (pageLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">Store Inventory</h1>

        <div className="flex items-center justify-end space-x-2 sm:space-x-3">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-gray-300 rounded-md py-2 px-2 sm:px-3 bg-white text-sm whitespace-nowrap"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>

          <Link
            href={`/dashboard/companies/${companyId}/store/requests`}
            className="flex items-center px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 whitespace-nowrap"
          >
            <ClipboardList className="h-4 w-4 mr-1 shrink-0" /> Requests
          </Link>

          {hasRole([SystemRole.Owner, SystemRole.Storekeeper]) && (
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center px-3 sm:px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 whitespace-nowrap"
            >
              <Plus className="h-4 w-4 mr-1 shrink-0" /> Add Item
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="w-full text-xs sm:text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Unit
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                {hasRole([SystemRole.Owner, SystemRole.Storekeeper]) && (
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={
                      hasRole([SystemRole.Owner, SystemRole.Storekeeper])
                        ? 7
                        : 6
                    }
                    className="px-6 py-8 text-center text-gray-500 text-xs sm:text-sm"
                  >
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    No items in inventory yet.
                  </td>
                </tr>
              ) : (
                items.map((item) => {
                  const isLow =
                    !item.isTool &&
                    item.quantity <= (item.lowStockThreshold || 0);
                  return (
                    <tr
                      key={item.id}
                      className="hover:bg-gray-50 text-gray-900"
                    >
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {typeof item.category === "object"
                          ? (item.category as { name: string }).name
                          : item.category}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {item.isTool ? (
                          <span className="inline-flex items-center text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                            <Wrench className="h-3 w-3 mr-1" /> Tool
                          </span>
                        ) : (
                          <span className="inline-flex items-center text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                            📦 Consumable
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-mono text-gray-900">
                        {item.quantity}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLow ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                            Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                            OK
                          </span>
                        )}
                      </td>
                      {hasRole([SystemRole.Owner, SystemRole.Storekeeper]) && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => {
                              setRestockItem(item);
                              setRestockQty(0);
                            }}
                            className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm"
                          >
                            <ArrowUpCircle className="h-4 w-4 mr-1" /> Restock
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockItem && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">Restock Item</h2>
            <form onSubmit={handleRestock} className="space-y-4">
              <div className="bg-gray-50 p-3 rounded-md space-y-2 text-sm">
                <p>
                  <span className="text-gray-500">Item:</span>{" "}
                  <span className="font-medium">{restockItem.name}</span>
                </p>
                <p>
                  <span className="text-gray-500">Category:</span>{" "}
                  <span className="font-medium">
                    {typeof restockItem.category === "object"
                      ? (restockItem.category as { name: string }).name
                      : restockItem.category}
                  </span>
                </p>
                <p>
                  <span className="text-gray-500">Unit:</span>{" "}
                  <span className="font-medium">{restockItem.unit}</span>
                </p>
                <p>
                  <span className="text-gray-500">Current Stock:</span>{" "}
                  <span className="font-medium">
                    {restockItem.quantity} {restockItem.unit}
                  </span>
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Quantity to Add
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={restockQty}
                  onChange={(e) =>
                    setRestockQty(parseFloat(e.target.value) || 0)
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockItem(null)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Restock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">Add Store Item</h2>
            <form onSubmit={handleCreateItem} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={itemData.name}
                  onChange={(e) =>
                    setItemData({ ...itemData, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Item Type
                  </label>
                  <select
                    value={itemData.type}
                    onChange={(e) =>
                      setItemData({ ...itemData, type: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                  >
                    <option value="CONSUMABLE">Consumable</option>
                    <option value="TOOL">Tool</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Measuring Unit
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={itemData.unit}
                      onChange={(e) =>
                        setItemData({ ...itemData, unit: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                    >
                      <option value="pcs">pcs (Default)</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddNewUnit}
                      className="mt-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm whitespace-nowrap"
                    >
                      + Add
                    </button>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Store Category
                </label>
                <select
                  value={itemData.categoryId || ""}
                  onChange={(e) =>
                    setItemData({
                      ...itemData,
                      categoryId: parseInt(e.target.value) || null,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option value="">Select Category</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Initial Quantity
                  </label>
                  <input
                    type="number"
                    required
                    value={itemData.quantity}
                    onChange={(e) =>
                      setItemData({
                        ...itemData,
                        quantity: parseFloat(e.target.value),
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                  />
                </div>
                {itemData.type !== "TOOL" && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Low Stock Alert
                    </label>
                    <input
                      type="number"
                      required
                      value={itemData.lowStockThreshold}
                      onChange={(e) =>
                        setItemData({
                          ...itemData,
                          lowStockThreshold: parseFloat(e.target.value),
                        })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                    />
                  </div>
                )}
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
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

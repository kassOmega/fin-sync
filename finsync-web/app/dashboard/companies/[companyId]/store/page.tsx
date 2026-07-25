"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { ArrowUpCircle, Package, Plus } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function StorePage() {
  const { companyId } = useParams();
  const { hasRole } = useAuthStore();
  const [items, setItems] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [itemData, setItemData] = useState({
    name: "",
    category: "CONSUMABLE",
    quantity: 0,
    lowStockThreshold: 5,
    unit: "pcs",
  });

  const fetchItems = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/store-items`);
      setItems(res.data);
    } catch {
      toast.error("Failed to load store data");
    }
  };

  useEffect(() => {
    fetchItems();
  }, [companyId]);

  const handleCreateItem = async (e) => {
    e.preventDefault();
    try {
      // Only send lowStockThreshold if it's a consumable
      const payload = { ...itemData };
      if (payload.category === "TOOL") delete payload.lowStockThreshold;

      await api.post(`/companies/${companyId}/store-items`, payload);
      toast.success("Item added");
      setIsModalOpen(false);
      setItemData({
        name: "",
        category: "CONSUMABLE",
        quantity: 0,
        lowStockThreshold: 5,
        unit: "pcs",
      });
      fetchItems();
    } catch {
      toast.error("Failed to add item");
    }
  };

  const handleRestock = async (id) => {
    const amount = prompt("Enter quantity to restock:");
    if (amount) {
      try {
        await api.post(
          `/companies/${companyId}/store-items/${id}/transaction`,
          { type: "RESTOCK", quantity: parseFloat(amount) },
        );
        toast.success("Restocked successfully");
        fetchItems();
      } catch {
        toast.error("Failed to restock");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Store Inventory</h1>
        {hasRole([SystemRole.Owner, SystemRole.Storekeeper]) && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-1" /> Add Item
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-gray-100 rounded-lg">
                  <Package className="h-6 w-6 text-gray-700" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  <p className="text-xs text-gray-500">{item.category}</p>
                </div>
              </div>
              {item.quantity <= (item.lowStockThreshold || 0) && (
                <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                  Low Stock
                </span>
              )}
            </div>
            <div className="flex justify-between items-center border-t pt-4">
              <div>
                <p className="text-sm text-gray-500">In Stock</p>
                <p className="text-xl font-bold text-gray-900">
                  {item.quantity}{" "}
                  <span className="text-sm font-normal">{item.unit}</span>
                </p>
              </div>
              {hasRole([SystemRole.Owner, SystemRole.Storekeeper]) && (
                <button
                  onClick={() => handleRestock(item.id)}
                  className="flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm"
                >
                  <ArrowUpCircle className="h-4 w-4 mr-1" /> Restock
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
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
                    Category
                  </label>
                  <select
                    value={itemData.category}
                    onChange={(e) =>
                      setItemData({ ...itemData, category: e.target.value })
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
                  <input
                    type="text"
                    required
                    value={itemData.unit}
                    onChange={(e) =>
                      setItemData({ ...itemData, unit: e.target.value })
                    }
                    placeholder="e.g. pcs, liters, boxes"
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                  />
                </div>
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
                {itemData.category === "CONSUMABLE" && (
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

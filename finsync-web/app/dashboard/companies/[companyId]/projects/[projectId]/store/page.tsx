"use client";

import api from "@/lib/api";
import { Package, Plus, Wrench } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface StoreItem {
  id: number;
  name: string;
  quantity: number;
  lowStockThreshold?: number;
  unit: string;
  category: { name: string } | string;
  isTool?: boolean;
}
interface Category {
  id: number;
  name: string;
}

export default function ProjectStorePage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [items, setItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [reqModal, setReqModal] = useState(false);
  const [reqItem, setReqItem] = useState<StoreItem | null>(null);
  const [reqQty, setReqQty] = useState(0);
  const [filter, setFilter] = useState("");
  const [tab, setTab] = useState<"inventory" | "requests">("inventory");

  const fetchAll = async () => {
    try {
      const [iRes, cRes, rRes] = await Promise.all([
        api.get(`/companies/${companyId}/projects/${projectId}/store`),
        api.get(
          `/companies/${companyId}/projects/${projectId}/store/categories`,
        ),
        api.get(`/companies/${companyId}/store-items/requests`),
      ]);
      setItems(iRes.data);
      setCategories(cRes.data);
      setRequests(rRes.data || []);
    } catch {
      toast.error("Failed to load");
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
  }, [companyId, projectId]);

  const handleRequest = async () => {
    if (!reqItem || reqQty <= 0) return;
    try {
      await api.post(
        `/companies/${companyId}/projects/${projectId}/store/requests`,
        { itemId: reqItem.id, quantity: reqQty },
      );
      toast.success("Request submitted");
      setReqModal(false);
      setReqQty(0);
      fetchAll();
    } catch {
      toast.error("Failed");
    }
  };

  const filtered = filter
    ? items.filter((i) =>
        typeof i.category === "object"
          ? (i.category as Category).name === filter
          : i.category === filter,
      )
    : items;

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Project Store</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setTab("inventory")}
            className={`px-3 py-1.5 text-sm rounded-md ${tab === "inventory" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}
          >
            Inventory
          </button>
          <button
            onClick={() => setTab("requests")}
            className={`px-3 py-1.5 text-sm rounded-md ${tab === "requests" ? "bg-indigo-100 text-indigo-700" : "bg-gray-100 text-gray-600"}`}
          >
            Requests ({requests.length})
          </button>
        </div>
      </div>

      {tab === "inventory" && (
        <>
          <div className="flex justify-end">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
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
                    Stock
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Unit
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      No items.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item) => {
                    const isLow =
                      !item.isTool &&
                      item.quantity <= (item.lowStockThreshold || 0);
                    return (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {item.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {typeof item.category === "object"
                            ? (item.category as Category).name
                            : item.category}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {item.isTool ? (
                            <span className="inline-flex items-center text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                              <Wrench className="h-3 w-3 mr-1" /> Tool
                            </span>
                          ) : (
                            <span className="inline-flex items-center text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                              📦 Material
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
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => {
                              setReqItem(item);
                              setReqQty(1);
                              setReqModal(true);
                            }}
                            className="inline-flex items-center px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-sm"
                          >
                            <Plus className="h-4 w-4 mr-1" /> Request
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "requests" && (
        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  By
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Qty
                </th>
                <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No requests.
                  </td>
                </tr>
              ) : (
                requests.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm">{r.item?.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {r.user?.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-right">
                      {r.quantity}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="px-2 py-0.5 bg-yellow-100 text-yellow-800 rounded-full text-xs">
                        {r.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {reqModal && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setReqModal(false)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-2">Request Item</h3>
            <p className="text-sm text-gray-600 mb-3">
              {reqItem?.name} · Available: {reqItem?.quantity} {reqItem?.unit}
            </p>
            <input
              type="number"
              min="1"
              max={reqItem?.quantity}
              value={reqQty}
              onChange={(e) => setReqQty(parseInt(e.target.value) || 0)}
              className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900 mb-3"
              placeholder="Quantity"
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setReqModal(false)}
                className="px-4 py-2 text-gray-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleRequest}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm"
              >
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import api from "@/lib/api";
import { ClipboardList, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface StoreItem {
  id: number;
  name: string;
  quantity: number;
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
  const [loading, setLoading] = useState(true);
  const [reqModal, setReqModal] = useState(false);
  const [reqItem, setReqItem] = useState<StoreItem | null>(null);
  const [reqQty, setReqQty] = useState(0);
  const [filter, setFilter] = useState("");

  const fetchAll = async () => {
    try {
      const [iRes, cRes] = await Promise.all([
        api.get(`/companies/${companyId}/projects/${projectId}/store`),
        api.get(
          `/companies/${companyId}/projects/${projectId}/store/categories`,
        ),
      ]);
      setItems(iRes.data);
      setCategories(cRes.data);
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
  }, []);

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
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="border rounded p-2 text-sm bg-white"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-3 text-center py-10 text-gray-500">
            No items available.
          </div>
        ) : (
          filtered.map((item) => (
            <div
              key={item.id}
              className="bg-white p-4 rounded-lg shadow-sm border flex justify-between items-center"
            >
              <div>
                <h3 className="font-medium text-sm">{item.name}</h3>
                <p className="text-xs text-gray-500">
                  {typeof item.category === "object"
                    ? (item.category as Category).name
                    : item.category}{" "}
                  · {item.quantity} {item.unit}
                </p>
              </div>
              <button
                onClick={() => {
                  setReqItem(item);
                  setReqQty(1);
                  setReqModal(true);
                }}
                className="px-3 py-1 bg-indigo-50 text-indigo-700 rounded text-xs hover:bg-indigo-100"
              >
                <Plus className="h-3 w-3 inline mr-1" />
                Request
              </button>
            </div>
          ))
        )}
      </div>
      <div className="flex justify-center">
        <a
          href={`/dashboard/companies/${companyId}/store/requests`}
          className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm hover:bg-gray-200"
        >
          <ClipboardList className="h-4 w-4 mr-1" /> View All Requests
        </a>
      </div>
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
            <p className="text-sm mb-3">{reqItem?.name}</p>
            <input
              type="number"
              min="1"
              max={reqItem?.quantity}
              value={reqQty}
              onChange={(e) => setReqQty(parseInt(e.target.value) || 0)}
              className="w-full border rounded p-2 text-sm mb-3"
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
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { storeService } from "@/lib/services/store";
import type {
  StoreCategory,
  StoreItem,
  StoreRequest,
} from "@/lib/services/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800",
  APPROVED: "bg-blue-100 text-blue-800",
  REJECTED: "bg-red-100 text-red-800",
  ISSUED: "bg-green-100 text-green-800",
  RETURNED: "bg-gray-100 text-gray-600",
};

export default function StoreRequestsPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = Number(params.companyId);
  const [items, setItems] = useState<StoreItem[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [issuingRequest, setIssuingRequest] = useState<StoreRequest | null>(
    null,
  );
  const [issueQty, setIssueQty] = useState<number>(0);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    Promise.all([
      storeService.listItems(companyId),
      storeService.listCategories(companyId),
      storeService.getCompanyRequests(companyId),
    ])
      .then(([itemsData, catsData, reqsData]) => {
        setItems(itemsData);
        setCategories(catsData);
        setRequests(reqsData);
      })
      .finally(() => setLoading(false));
  }, [companyId]);

  const refreshRequests = async () => {
    setRequests(await storeService.getCompanyRequests(companyId));
  };

  const handleCreate = async (data: {
    itemId: number;
    quantity: number;
    projectId?: number;
  }) => {
    await storeService.createRequest({ companyId, ...data });
    setShowRequestModal(false);
    await refreshRequests();
    const updated = await storeService.listItems(companyId);
    setItems(updated);
  };

  const handleApprove = async (id: number) => {
    await storeService.approveRequest(id);
    await refreshRequests();
  };

  const handleReject = async (id: number) => {
    await storeService.rejectRequest(id);
    await refreshRequests();
    setItems(await storeService.listItems(companyId));
  };

  const handleIssue = async (id: number, quantity?: number) => {
    await storeService.issueRequest(id, quantity);
    setIssuingRequest(null);
    await refreshRequests();
    setItems(await storeService.listItems(companyId));
  };

  const handleReturn = async (requestId: number) => {
    await storeService.returnItem(companyId, requestId);
    await refreshRequests();
  };

  const filteredRequests = requests.filter(
    (r) => !statusFilter || r.status === statusFilter,
  );

  const availableQty = (item: StoreItem) =>
    item.quantity - item.reservedQuantity;

  if (loading)
    return <div className="p-8 text-gray-500">Loading requests...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Store Requisitions</h1>
        <button
          onClick={() => setShowRequestModal(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
        >
          + New Request
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md"
        >
          <option value="">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
          <option value="ISSUED">Issued</option>
          <option value="RETURNED">Returned</option>
        </select>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b">
              <th className="text-left px-4 py-2">Item</th>
              <th className="text-left px-4 py-2">Requested By</th>
              <th className="text-right px-4 py-2">Qty</th>
              <th className="text-right px-4 py-2">Issued</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-left px-4 py-2">Notes</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRequests.length === 0 && (
              <tr>
                <td colSpan={7} className="py-12 text-center text-gray-500">
                  No requisitions found.
                </td>
              </tr>
            )}
            {filteredRequests.map((req) => {
              const isTool = req.item?.isTool;
              const remaining = req.quantity - req.issuedQuantity;
              return (
                <tr key={req.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {req.item?.name}
                    {isTool && (
                      <span className="ml-2 text-xs bg-orange-100 text-orange-700 px-1 rounded-full">
                        Tool
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-gray-600">{req.user?.name}</td>
                  <td className="px-4 py-2 text-right font-medium">
                    {req.quantity} {req.item?.unit}
                  </td>
                  <td className="px-4 py-2 text-right text-gray-600">
                    {req.issuedQuantity}/{req.quantity}
                    {remaining > 0 && req.status === "APPROVED" && (
                      <span className="ml-1 text-xs text-indigo-600">
                        ({remaining} left)
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[req.status] || "bg-gray-100"}`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-500 text-xs">
                    {req.note}
                    {req.projectId && (
                      <span className="block text-gray-400">
                        Project #{req.projectId}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex justify-end gap-2">
                      {req.status === "PENDING" && (
                        <>
                          <button
                            onClick={() => handleApprove(req.id)}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(req.id)}
                            className="text-xs text-red-600 hover:text-red-800"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {req.status === "APPROVED" && remaining > 0 && (
                        <button
                          onClick={() => {
                            setIssuingRequest(req);
                            setIssueQty(remaining);
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          Issue
                        </button>
                      )}
                      {req.status === "ISSUED" && isTool && (
                        <button
                          onClick={() => handleReturn(req.id)}
                          className="text-xs text-gray-600 hover:text-gray-800"
                        >
                          Return
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showRequestModal && (
        <RequestModal
          items={items}
          categories={categories}
          categoryFilter={categoryFilter}
          setCategoryFilter={setCategoryFilter}
          onClose={() => setShowRequestModal(false)}
          onSubmit={handleCreate}
        />
      )}

      {issuingRequest && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Issue Item
            </h2>
            <p className="text-sm text-gray-600 mb-3">
              <strong>{issuingRequest.item?.name}</strong> — Requested:{" "}
              {issuingRequest.quantity} {issuingRequest.item?.unit}, Already
              issued: {issuingRequest.issuedQuantity}
            </p>
            <div className="mb-4">
              <label className="block text-sm text-gray-600 mb-1">
                Quantity to issue
              </label>
              <input
                type="number"
                min="0.5"
                max={issuingRequest.quantity - issuingRequest.issuedQuantity}
                step="0.5"
                value={issueQty}
                onChange={(e) => setIssueQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
              <p className="text-xs text-gray-500 mt-1">
                Max: {issuingRequest.quantity - issuingRequest.issuedQuantity}{" "}
                {issuingRequest.item?.unit} (partial issue supported)
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setIssuingRequest(null)}
                className="px-4 py-2 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleIssue(issuingRequest.id, issueQty)}
                disabled={issueQty <= 0}
                className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50"
              >
                Issue
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function RequestModal({
  items,
  categories,
  categoryFilter,
  setCategoryFilter,
  onClose,
  onSubmit,
}: {
  items: StoreItem[];
  categories: StoreCategory[];
  categoryFilter: string;
  setCategoryFilter: (v: string) => void;
  onClose: () => void;
  onSubmit: (data: {
    itemId: number;
    quantity: number;
    projectId?: number;
  }) => Promise<void>;
}) {
  const [itemId, setItemId] = useState<number | 0>(0);
  const [quantity, setQuantity] = useState(1);
  const [projectId, setProjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const filteredItems = categoryFilter
    ? items.filter((i) => i.categoryId === Number(categoryFilter))
    : items;

  const selectedItem = items.find((i) => i.id === itemId);
  const available = selectedItem
    ? selectedItem.quantity - selectedItem.reservedQuantity
    : 0;
  const isOverAvailable = selectedItem ? quantity > available : false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!itemId || quantity <= 0) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        itemId,
        quantity,
        projectId: projectId ? Number(projectId) : undefined,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to create request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">New Request</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Item</label>
            <select
              value={itemId}
              onChange={(e) => {
                setItemId(Number(e.target.value));
                setQuantity(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            >
              <option value={0}>Select item...</option>
              {filteredItems.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name} — {item.quantity - item.reservedQuantity}{" "}
                  {item.unit} available
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Quantity</label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min="0.5"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="w-32 px-3 py-2 border border-gray-300 rounded-md"
              />
              {selectedItem && (
                <span
                  className={`text-sm ${isOverAvailable ? "text-red-600 font-medium" : "text-gray-500"}`}
                >
                  {isOverAvailable
                    ? `⚠ Only ${available} ${selectedItem.unit} available`
                    : `${available} ${selectedItem.unit} available`}
                </span>
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Project (optional)
            </label>
            <input
              type="number"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="Project ID if chargeable to a project"
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
              disabled={saving || !itemId || quantity <= 0 || isOverAvailable}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md disabled:opacity-50"
            >
              {saving ? "Submitting..." : "Submit Request"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

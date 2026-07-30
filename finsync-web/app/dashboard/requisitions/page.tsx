"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import {
  CheckCircle,
  Clock,
  Package,
  Plus,
  RotateCcw,
  Send,
  Truck,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface StoreItem {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  isTool: boolean;
  companyId: number;
  category: { id: number; name: string };
}

interface StoreRequest {
  id: number;
  itemId: number;
  companyId: number;
  userId: number;
  quantity: number;
  status: string;
  note: string | null;
  createdAt: string;
  item: {
    id: number;
    name: string;
    quantity: number;
    unit: string;
    isTool: boolean;
  };
  user?: { id: number; name: string };
  company?: { id: number; name: string };
}

interface MyCompany {
  company: { id: number; name: string };
  role: string;
  companyId: number;
}

export default function RequisitionsPage() {
  const { user, hasRole } = useAuthStore();

  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [storeItems, setStoreItems] = useState<StoreItem[]>([]);
  const [myCompany, setMyCompany] = useState<MyCompany | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [requestQty, setRequestQty] = useState(1);
  const [requestNote, setRequestNote] = useState("");

  const fetchData = async () => {
    try {
      if (hasRole([SystemRole.Owner])) {
        // Owner sees ALL requests across all companies
        const res = await api.get("/store-requests/all");
        setRequests(res.data);
      } else if (
        hasRole([
          SystemRole.Storekeeper,
          SystemRole.Cashier,
          SystemRole.Sales,
          SystemRole.OperatorDriver,
          SystemRole.ProjectManager,
          SystemRole.Foreman,
        ])
      ) {
        // Staff sees their own requests
        const res = await api.get("/store-requests/my");
        setRequests(res.data);
      } else {
        setRequests([]);
      }

      // Fetch user's company for form context
      try {
        const companyRes = await api.get("/users/me/company");
        setMyCompany(companyRes.data);

        // Fetch store items for the user's company
        if (companyRes.data?.companyId) {
          const itemsRes = await api.get(
            `/companies/${companyRes.data.companyId}/store-items`,
          );
          setStoreItems(itemsRes.data);
        }
      } catch {
        // Company fetch may fail for owners — that's OK
      }
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateRequest = async () => {
    if (!selectedItemId || !myCompany?.companyId) {
      toast.error("Please select an item");
      return;
    }
    try {
      await api.post("/store-requests", {
        companyId: myCompany.companyId,
        itemId: selectedItemId,
        quantity: requestQty,
      });
      toast.success("Request submitted");
      setShowCreateForm(false);
      setSelectedItemId(null);
      setRequestQty(1);
      setRequestNote("");
      fetchData();
    } catch {
      toast.error("Failed to submit request");
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/store-requests/${id}/approve`);
      toast.success("Request approved");
      fetchData();
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.patch(`/store-requests/${id}/reject`);
      toast.success("Request rejected");
      fetchData();
    } catch {
      toast.error("Failed to reject");
    }
  };

  const handleIssue = async (id: number) => {
    try {
      await api.patch(`/store-requests/${id}/issue`);
      toast.success("Item issued");
      fetchData();
    } catch {
      toast.error("Failed to issue item");
    }
  };

  const handleReturn = async (requestId: number, companyId: number) => {
    try {
      await api.patch(
        `/companies/${companyId}/store-items/requests/${requestId}/return`,
      );
      toast.success("Item returned to stock");
      fetchData();
    } catch {
      toast.error("Failed to return item");
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium inline-flex items-center">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium inline-flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" /> Approved
          </span>
        );
      case "ISSUED":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium inline-flex items-center">
            <Truck className="h-3 w-3 mr-1" /> Issued
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium inline-flex items-center">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </span>
        );
      case "RETURNED":
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium inline-flex items-center">
            <RotateCcw className="h-3 w-3 mr-1" /> Returned
          </span>
        );
      default:
        return (
          <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Store Requisitions
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            {hasRole([SystemRole.Owner]) &&
              "Review and manage all staff store item requests"}
            {hasRole([SystemRole.Storekeeper]) &&
              "Issue approved requests and manage tool returns"}
            {hasRole([
              SystemRole.Cashier,
              SystemRole.Sales,
              SystemRole.OperatorDriver,
              SystemRole.ProjectManager,
              SystemRole.Foreman,
            ]) && "Request items from the company store"}
          </p>
        </div>

        {/* Create Request button for staff */}
        {!hasRole([SystemRole.Owner]) && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Request
          </button>
        )}
      </div>

      {/* Create request form */}
      {showCreateForm && myCompany && (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            New Store Request — {myCompany.company.name}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Item
              </label>
              <select
                value={selectedItemId ?? ""}
                onChange={(e) => setSelectedItemId(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select an item...</option>
                {storeItems.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.quantity} {item.unit} available)
                    {item.isTool ? " 🔧" : " 📦"}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Quantity
              </label>
              <input
                type="number"
                min={1}
                value={requestQty}
                onChange={(e) => setRequestQty(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleCreateRequest}
                disabled={!selectedItemId}
                className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
              >
                <Send className="h-4 w-4 mr-2" />
                Submit Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Requests table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Item
                </th>
                {(hasRole([SystemRole.Owner]) ||
                  hasRole([SystemRole.Storekeeper])) && (
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Requested By
                  </th>
                )}
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Company
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Qty
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {requests.length === 0 ? (
                <tr>
                  <td
                    colSpan={hasRole([SystemRole.Owner]) ? 8 : 7}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    No requests yet.
                    {!hasRole([SystemRole.Owner]) &&
                      ' Click "New Request" to get started.'}
                  </td>
                </tr>
              ) : (
                requests.map((req) => (
                  <tr key={req.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      <div className="flex items-center space-x-2">
                        <Package className="h-4 w-4 text-gray-400" />
                        <span>{req.item?.name || "Unknown"}</span>
                      </div>
                    </td>
                    {(hasRole([SystemRole.Owner]) ||
                      hasRole([SystemRole.Storekeeper])) && (
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {req.user?.name || "Unknown"}
                      </td>
                    )}
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {req.company?.name || "—"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {req.quantity} {req.item?.unit || "pcs"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {req.item?.isTool ? (
                        <span className="text-xs bg-orange-50 text-orange-700 px-2 py-0.5 rounded-full">
                          🔧 Tool
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-50 text-gray-600 px-2 py-0.5 rounded-full">
                          📦 Consumable
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {statusBadge(req.status)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-1">
                        {/* Owner: approve/reject pending */}
                        {req.status === "PENDING" &&
                          hasRole([SystemRole.Owner]) && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="px-2 py-1 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-xs font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                className="px-2 py-1 bg-red-50 text-red-700 rounded hover:bg-red-100 text-xs font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}

                        {/* Storekeeper/Owner: issue approved */}
                        {req.status === "APPROVED" &&
                          hasRole([
                            SystemRole.Owner,
                            SystemRole.Storekeeper,
                          ]) && (
                            <button
                              onClick={() => handleIssue(req.id)}
                              className="px-2 py-1 bg-green-50 text-green-700 rounded hover:bg-green-100 text-xs font-medium"
                            >
                              Issue
                            </button>
                          )}

                        {/* Storekeeper/Owner: return issued tools */}
                        {req.status === "ISSUED" &&
                          req.item?.isTool &&
                          hasRole([
                            SystemRole.Owner,
                            SystemRole.Storekeeper,
                          ]) && (
                            <button
                              onClick={() =>
                                handleReturn(req.id, req.companyId)
                              }
                              className="px-2 py-1 bg-purple-50 text-purple-700 rounded hover:bg-purple-100 text-xs font-medium"
                            >
                              Return
                            </button>
                          )}

                        {/* No actions available */}
                        {req.status !== "PENDING" &&
                          req.status !== "APPROVED" &&
                          !(
                            req.status === "ISSUED" &&
                            req.item?.isTool &&
                            hasRole([SystemRole.Owner, SystemRole.Storekeeper])
                          ) &&
                          !hasRole([SystemRole.Owner]) && (
                            <span className="text-xs text-gray-400">—</span>
                          )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

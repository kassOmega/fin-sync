"use client";

import Loading from "@/components/Loading";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Package,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface StoreRequest {
  id: number;
  itemId: number;
  companyId: number;
  userId: number;
  quantity: number;
  status: string;
  createdAt: string;
  item: { id: number; name: string; quantity: number; unit: string };
  user: { id: number; name: string };
}

export default function StoreRequestsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user, hasRole } = useAuthStore();
  const [requests, setRequests] = useState<StoreRequest[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/store-items/requests`);
      setRequests(res.data);
    } catch {
      toast.error("Failed to load requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    fetchRequests();
  }, [companyId, router]);

  if (!companyId) {
    return null;
  }

  const handleApprove = async (requestId: number) => {
    try {
      await api.patch(
        `/companies/${companyId}/store-items/requests/${requestId}/approve`,
      );
      toast.success("Request approved");
      fetchRequests();
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleReject = async (requestId: number) => {
    try {
      await api.patch(
        `/companies/${companyId}/store-items/requests/${requestId}/reject`,
      );
      toast.success("Request rejected");
      fetchRequests();
    } catch {
      toast.error("Failed to reject");
    }
  };

  const handleIssue = async (requestId: number) => {
    try {
      await api.patch(
        `/companies/${companyId}/store-items/requests/${requestId}/issue`,
      );
      toast.success("Item issued");
      fetchRequests();
    } catch {
      toast.error("Failed to issue item");
    }
  };

  const handleReturn = async (requestId: number) => {
    try {
      await api.patch(
        `/companies/${companyId}/store-items/requests/${requestId}/return`,
      );
      toast.success("Item returned to stock");
      fetchRequests();
    } catch {
      toast.error("Failed to return item");
    }
  };

  const statusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium flex items-center">
            <Clock className="h-3 w-3 mr-1" /> Pending
          </span>
        );
      case "APPROVED":
        return (
          <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium flex items-center">
            <CheckCircle className="h-3 w-3 mr-1" /> Approved
          </span>
        );
      case "ISSUED":
        return (
          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium flex items-center">
            <Truck className="h-3 w-3 mr-1" /> Issued
          </span>
        );
      case "REJECTED":
        return (
          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium flex items-center">
            <XCircle className="h-3 w-3 mr-1" /> Rejected
          </span>
        );
      case "RETURNED":
        return (
          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium flex items-center">
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

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/dashboard/companies/${companyId}/store`}
          className="p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Store Requests</h1>
      </div>

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
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Requested By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Quantity
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
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No requests yet.
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
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {req.user?.name || "Unknown"}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900">
                      {req.quantity} {req.item?.unit || "pcs"}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {statusBadge(req.status)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center space-x-2">
                        {req.status === "PENDING" &&
                          hasRole([SystemRole.Owner]) && (
                            <>
                              <button
                                onClick={() => handleApprove(req.id)}
                                className="px-3 py-1 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 text-xs font-medium"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleReject(req.id)}
                                className="px-3 py-1 bg-red-50 text-red-700 rounded-md hover:bg-red-100 text-xs font-medium"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        {req.status === "APPROVED" &&
                          hasRole([
                            SystemRole.Owner,
                            SystemRole.Storekeeper,
                          ]) && (
                            <button
                              onClick={() => handleIssue(req.id)}
                              className="px-3 py-1 bg-green-50 text-green-700 rounded-md hover:bg-green-100 text-xs font-medium"
                            >
                              Issue
                            </button>
                          )}
                        {req.status === "ISSUED" &&
                          hasRole([
                            SystemRole.Owner,
                            SystemRole.Storekeeper,
                          ]) && (
                            <button
                              onClick={() => handleReturn(req.id)}
                              className="px-3 py-1 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 text-xs font-medium"
                            >
                              Return
                            </button>
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

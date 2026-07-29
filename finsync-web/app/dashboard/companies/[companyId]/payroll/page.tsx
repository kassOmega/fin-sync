"use client";

import api from "@/lib/api";
import { CheckCircle, FileText, Plus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface PayrollItem {
  id: number;
  employeeId: number;
  basePay: number;
  overtimePay: number;
  deductions: number;
  netPay: number;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
  };
}

interface Payroll {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

export default function PayrollPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItems, setViewItems] = useState<PayrollItem[]>([]);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "Payroll Batch",
    startDate: "",
    endDate: "",
  });

  const fetchAll = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/payroll`);
      setPayrolls(res.data);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    fetchAll();
  }, [companyId]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/companies/${companyId}/payroll/generate`, form);
      toast.success("Payroll batch generated");
      setModalOpen(false);
      fetchAll();
    } catch {
      toast.error("Failed to generate");
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const res = await api.patch(
        `/companies/${companyId}/payroll/${id}/approve`,
      );
      toast.success(
        res.data.expenseCreated ? "Approved & expense created" : "Approved",
      );
      fetchAll();
    } catch {
      toast.error("Failed to approve");
    }
  };

  const handleViewItems = async (id: number) => {
    try {
      const res = await api.get(`/companies/${companyId}/payroll/${id}/items`);
      setViewItems(res.data);
      setViewingId(id);
    } catch {
      toast.error("Failed to load items");
    }
  };

  const statusBadge = (s: string) => {
    const c: Record<string, string> = {
      DRAFT: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      PAID: "bg-blue-100 text-blue-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${c[s] || ""}`}>
        {s}
      </span>
    );
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  if (!companyId) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Payroll</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> Generate Batch
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Period
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {payrolls.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No payroll batches yet.
                </td>
              </tr>
            ) : (
              payrolls.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">{p.title}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {p.startDate} → {p.endDate}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold">
                    ${Number(p.totalAmount || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-sm">{statusBadge(p.status)}</td>
                  <td className="px-4 py-3 text-right text-sm space-x-1">
                    <button
                      onClick={() => handleViewItems(p.id)}
                      className="inline-flex items-center px-2 py-1 bg-gray-50 text-gray-700 rounded text-xs"
                    >
                      <FileText className="h-3 w-3 mr-1" /> Items
                    </button>
                    {p.status === "DRAFT" && (
                      <button
                        onClick={() => handleApprove(p.id)}
                        className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded text-xs"
                      >
                        <CheckCircle className="h-3 w-3 mr-1" /> Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {viewingId && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingId(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl text-gray-900 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Payroll Items</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Employee</th>
                  <th className="text-right py-2">Base</th>
                  <th className="text-right py-2">OT</th>
                  <th className="text-right py-2">Net</th>
                </tr>
              </thead>
              <tbody>
                {viewItems.map((item: PayrollItem) => (
                  <tr key={item.id} className="border-b">
                    <td className="py-2">
                      {item.employee?.firstName} {item.employee?.lastName}
                    </td>
                    <td className="text-right py-2">
                      ${Number(item.basePay).toFixed(2)}
                    </td>
                    <td className="text-right py-2">
                      ${Number(item.overtimePay).toFixed(2)}
                    </td>
                    <td className="text-right py-2 font-bold">
                      ${Number(item.netPay).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button
              onClick={() => setViewingId(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 text-sm"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">Generate Payroll</h2>
            <form onSubmit={handleGenerate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium">Title</label>
                <input
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full border rounded p-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium">
                    Start Date
                  </label>
                  <input
                    required
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="mt-1 w-full border rounded p-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">End Date</label>
                  <input
                    required
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="mt-1 w-full border rounded p-2 text-sm"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Approved timesheets in this range will be auto-calculated.
              </p>
              <div className="flex justify-end space-x-2 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-gray-600 text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
                >
                  Generate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

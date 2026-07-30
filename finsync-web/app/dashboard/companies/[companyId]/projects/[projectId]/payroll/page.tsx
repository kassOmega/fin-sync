"use client";

import Loading from "@/components/Loading";

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
  netPay: number;
  employee: { id: number; firstName: string; lastName: string };
}
interface Payroll {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  totalAmount: number;
  status: string;
}

export default function ProjectPayrollPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [viewItems, setViewItems] = useState<PayrollItem[]>([]);
  const [viewingId, setViewingId] = useState<number | null>(null);
  const [form, setForm] = useState({
    title: "Project Payroll",
    startDate: "",
    endDate: "",
  });

  const fetchAll = async () => {
    try {
      const res = await api.get(
        `/companies/${companyId}/projects/${projectId}/payroll`,
      );
      setPayrolls(res.data);
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

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(
        `/companies/${companyId}/projects/${projectId}/payroll/generate`,
        form,
      );
      toast.success("Generated");
      setModalOpen(false);
      fetchAll();
    } catch {
      toast.error("Failed");
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/companies/${companyId}/payroll/${id}/approve`);
      toast.success("Approved");
      fetchAll();
    } catch {
      toast.error("Failed");
    }
  };

  const handleViewItems = async (id: number) => {
    try {
      const res = await api.get(`/companies/${companyId}/payroll/${id}/items`);
      setViewItems(Array.isArray(res.data) ? res.data : []);
      setViewingId(id);
    } catch {
      toast.error("Failed");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Project Payroll</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> Generate
        </button>
      </div>
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
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
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {payrolls.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No payroll batches.
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
            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto"
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
                {viewItems.map((item) => (
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
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Generate Payroll</h2>
            <form onSubmit={handleGenerate} className="space-y-3">
              <input
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                placeholder="Title"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  required
                  type="date"
                  value={form.startDate}
                  onChange={(e) =>
                    setForm({ ...form, startDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                />
                <input
                  required
                  type="date"
                  value={form.endDate}
                  onChange={(e) =>
                    setForm({ ...form, endDate: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                />
              </div>
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

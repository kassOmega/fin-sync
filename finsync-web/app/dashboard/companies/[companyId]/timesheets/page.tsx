"use client";

import Loading from "@/components/Loading";

import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { CheckCircle, Plus, Send } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface TimesheetEntry {
  id: number;
  employeeId: number;
  date: string;
  regularHours: number;
  overtimeHours: number;
  status: string;
  description: string | null;
  machineryId: number | null;
  projectId: number | null;
  employee: { id: number; firstName: string; lastName: string };
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
}

export default function TimesheetsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const [entries, setEntries] = useState<TimesheetEntry[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    date: "",
    regularHours: "8",
    overtimeHours: "0",
    description: "",
    machineryId: "",
  });

  const fetchData = async () => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const [tsRes, empRes] = await Promise.all([
        api.get(`/companies/${companyId}/timesheets?date=${today}`),
        api.get(`/companies/${companyId}/employees`),
      ]);
      setEntries(tsRes.data);
      setEmployees(empRes.data);
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
    fetchData();
  }, [companyId]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/companies/${companyId}/timesheets`, {
        employeeId: parseInt(form.employeeId),
        date: form.date,
        regularHours: parseFloat(form.regularHours),
        overtimeHours: parseFloat(form.overtimeHours),
        description: form.description,
        machineryId: form.machineryId ? parseInt(form.machineryId) : undefined,
      });
      toast.success("Timesheet created");
      setModalOpen(false);
      setForm({
        employeeId: "",
        date: "",
        regularHours: "8",
        overtimeHours: "0",
        description: "",
        machineryId: "",
      });
      fetchData();
    } catch {
      toast.error("Failed");
    }
  };

  const handleSubmit = async (id: number) => {
    try {
      await api.patch(`/companies/${companyId}/timesheets/${id}/submit`);
      toast.success("Submitted");
      fetchData();
    } catch {
      toast.error("Failed");
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.patch(`/companies/${companyId}/timesheets/${id}/approve`);
      toast.success("Approved");
      fetchData();
    } catch {
      toast.error("Failed");
    }
  };

  const statusBadge = (s: string) => {
    const c: Record<string, string> = {
      DRAFT: "bg-gray-100 text-gray-700",
      SUBMITTED: "bg-blue-100 text-blue-700",
      APPROVED: "bg-green-100 text-green-700",
      REJECTED: "bg-red-100 text-red-700",
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${c[s] || ""}`}>
        {s}
      </span>
    );
  };

  if (loading) return <Loading />;
  if (!companyId) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Timesheets</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> Log Hours
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Employee
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Hours
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
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No timesheets yet.
                </td>
              </tr>
            ) : (
              entries.map((t) => (
                <tr key={t.id}>
                  <td className="px-4 py-3 text-sm font-medium">
                    {t.employee?.firstName} {t.employee?.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{t.date}</td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {Number(t.regularHours) + Number(t.overtimeHours)}h
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">{statusBadge(t.status)}</td>
                  <td className="px-4 py-3 text-right text-sm space-x-1">
                    {t.status === "DRAFT" && (
                      <button
                        onClick={() => handleSubmit(t.id)}
                        className="inline-flex items-center px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                      >
                        <Send className="h-3 w-3 mr-1" /> Submit
                      </button>
                    )}
                    {t.status === "SUBMITTED" && (
                      <button
                        onClick={() => handleApprove(t.id)}
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

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">Log Hours</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-medium">Employee</label>
                <select
                  required
                  value={form.employeeId}
                  onChange={(e) =>
                    setForm({ ...form, employeeId: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                >
                  <option value="">Select</option>
                  {employees.map((e) => (
                    <option key={e.id} value={e.id}>
                      {e.firstName} {e.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Date
                </label>
                <input
                  required
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium">
                    Regular Hours
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.regularHours}
                    onChange={(e) =>
                      setForm({ ...form, regularHours: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Overtime</label>
                  <input
                    type="number"
                    step="0.5"
                    value={form.overtimeHours}
                    onChange={(e) =>
                      setForm({ ...form, overtimeHours: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium">Note</label>
                <input
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
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
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Loading from "@/components/Loading";

import api from "@/lib/api";
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
  employee: { id: number; firstName: string; lastName: string };
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
}

export default function ProjectTimesheetsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
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
  });

  const fetchData = async () => {
    const today = new Date().toISOString().split("T")[0];
    try {
      const [tsRes, empRes] = await Promise.all([
        api.get(
          `/companies/${companyId}/projects/${projectId}/timesheets?date=${today}`,
        ),
        api.get(`/companies/${companyId}/employees`),
      ]);
      setEntries(Array.isArray(tsRes.data) ? tsRes.data : []);
      setEmployees(empRes.data);
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
    fetchData();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(
        `/companies/${companyId}/projects/${projectId}/timesheets`,
        {
          employeeId: parseInt(form.employeeId),
          date: form.date,
          regularHours: parseFloat(form.regularHours),
          overtimeHours: parseFloat(form.overtimeHours),
          projectId: parseInt(projectId),
        },
      );
      toast.success("Timesheet created");
      setModalOpen(false);
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
    };
    return (
      <span className={`px-2 py-0.5 text-xs rounded-full ${c[s] || ""}`}>
        {s}
      </span>
    );
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Project Timesheets</h1>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> Log Hours
        </button>
      </div>
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
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
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-xs sm:text-sm">
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
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Log Hours</h2>
            <form onSubmit={handleCreate} className="space-y-3">
              <select
                required
                value={form.employeeId}
                onChange={(e) =>
                  setForm({ ...form, employeeId: e.target.value })
                }
                className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
              >
                <option value="">Select</option>
                {employees.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName}
                  </option>
                ))}
              </select>
              <input
                required
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.5"
                  placeholder="Regular Hours"
                  value={form.regularHours}
                  onChange={(e) =>
                    setForm({ ...form, regularHours: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                />
                <input
                  type="number"
                  step="0.5"
                  placeholder="Overtime"
                  value={form.overtimeHours}
                  onChange={(e) =>
                    setForm({ ...form, overtimeHours: e.target.value })
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

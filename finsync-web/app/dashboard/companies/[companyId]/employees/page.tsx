"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Pencil, Trash2, UserPlus } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Employee {
  id: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  designation: string;
  employmentType: string;
  baseSalary?: number;
  hourlyRate?: number;
  dailyRate?: number;
  isActive: boolean;
  joinedDate: string;
  user?: { id: number; name: string };
}

export default function EmployeesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [form, setForm] = useState({
    employeeCode: "",
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    designation: "",
    employmentType: "FULL_TIME",
    hourlyRate: "",
    dailyRate: "",
    baseSalary: "",
    userId: "",
  });

  const fetchAll = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/employees`);
      setEmployees(res.data);
    } catch {
      toast.error("Failed to load employees");
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      employeeCode: form.employeeCode,
      firstName: form.firstName,
      lastName: form.lastName,
      email: form.email || undefined,
      phone: form.phone || undefined,
      designation: form.designation,
      employmentType: form.employmentType,
      hourlyRate: form.hourlyRate ? parseFloat(form.hourlyRate) : undefined,
      dailyRate: form.dailyRate ? parseFloat(form.dailyRate) : undefined,
      baseSalary: form.baseSalary ? parseFloat(form.baseSalary) : undefined,
      userId: form.userId ? parseInt(form.userId) : undefined,
    };
    try {
      if (editing) {
        await api.patch(
          `/companies/${companyId}/employees/${editing.id}`,
          payload,
        );
        toast.success("Employee updated");
      } else {
        await api.post(`/companies/${companyId}/employees`, payload);
        toast.success("Employee added");
      }
      setModalOpen(false);
      setEditing(null);
      setForm({
        employeeCode: "",
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        designation: "",
        employmentType: "FULL_TIME",
        hourlyRate: "",
        dailyRate: "",
        baseSalary: "",
        userId: "",
      });
      fetchAll();
    } catch {
      toast.error("Failed to save employee");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Remove this employee?")) return;
    try {
      await api.delete(`/companies/${companyId}/employees/${id}`);
      toast.success("Deleted");
      fetchAll();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const typeLabel = (t: string) =>
    ({
      FULL_TIME: "Full-Time",
      PART_TIME: "Part-Time",
      CONTRACT: "Contract",
      DAILY_LABORER: "Daily",
    })[t] || t;

  if (loading) return <Loading />;
  if (!companyId) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
        <button
          onClick={() => {
            setEditing(null);
            setModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <UserPlus className="h-5 w-5 mr-1" /> Add Employee
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Code
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Designation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Rate
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No employees yet.
                </td>
              </tr>
            ) : (
              employees.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {e.employeeCode}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {e.firstName} {e.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {e.designation}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {typeLabel(e.employmentType)}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    ${e.hourlyRate || e.dailyRate || e.baseSalary || "—"}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    <button
                      onClick={() => {
                        setEditing(e);
                        setForm({
                          employeeCode: e.employeeCode,
                          firstName: e.firstName,
                          lastName: e.lastName,
                          email: e.email || "",
                          phone: e.phone || "",
                          designation: e.designation,
                          employmentType: e.employmentType,
                          hourlyRate: e.hourlyRate ? String(e.hourlyRate) : "",
                          dailyRate: e.dailyRate ? String(e.dailyRate) : "",
                          baseSalary: e.baseSalary ? String(e.baseSalary) : "",
                          userId: "",
                        });
                        setModalOpen(true);
                      }}
                      className="text-indigo-600 hover:text-indigo-900 mx-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(e.id)}
                      className="text-red-500 hover:text-red-700 mx-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl text-gray-900 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editing ? "Edit Employee" : "Add Employee"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium">Code</label>
                  <input
                    required
                    value={form.employeeCode}
                    onChange={(e) =>
                      setForm({ ...form, employeeCode: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">
                    Employment Type
                  </label>
                  <select
                    value={form.employmentType}
                    onChange={(e) =>
                      setForm({ ...form, employmentType: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  >
                    <option value="FULL_TIME">Full-Time</option>
                    <option value="PART_TIME">Part-Time</option>
                    <option value="CONTRACT">Contract</option>
                    <option value="DAILY_LABORER">Daily Laborer</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium">
                    First Name
                  </label>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Last Name</label>
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) =>
                      setForm({ ...form, email: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">Phone</label>
                  <input
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium">Designation</label>
                <input
                  required
                  value={form.designation}
                  onChange={(e) =>
                    setForm({ ...form, designation: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium">
                    Hourly Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.hourlyRate}
                    onChange={(e) =>
                      setForm({ ...form, hourlyRate: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">
                    Daily Rate
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.dailyRate}
                    onChange={(e) =>
                      setForm({ ...form, dailyRate: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">
                    Base Salary
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.baseSalary}
                    onChange={(e) =>
                      setForm({ ...form, baseSalary: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
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

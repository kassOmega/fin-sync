"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { STAFF_ROLES, getRoleLabel } from "@/lib/roles";
import { useAuthStore } from "@/store/authStore";
import { Briefcase, Pencil, Trash2, UserPlus, X } from "lucide-react";
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
  role?: string;
  user?: { id: number; name: string };
  projectMemberships?: Array<{
    projectId: number;
    project: { id: number; name: string };
  }>;
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

  // Project assignment modal
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null,
  );
  const [availableProjects, setAvailableProjects] = useState<
    { id: number; name: string }[]
  >([]);
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>([]);

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
    role: "" as string,
  });

  const fetchAll = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/projects`);
      const projects: { id: number; name: string }[] = res.data || [];
      setAvailableProjects(projects);

      const empRes = await api.get(`/companies/${companyId}/employees`);
      // Merge with project assignments for each employee
      const emps: Employee[] = empRes.data || [];
      // Fetch project memberships per employee (batch would be better but fine for now)
      const enriched = await Promise.all(
        emps.map(async (emp: Employee) => {
          try {
            const projRes = await api.get(
              `/companies/${companyId}/projects/my?employeeId=${emp.id}`,
            );
            return {
              ...emp,
              projectMemberships: projRes.data || [],
            };
          } catch {
            return emp;
          }
        }),
      );
      setEmployees(enriched);
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
      role: form.role || undefined,
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
        role: "",
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

  const handleProjectAssign = async () => {
    if (!selectedEmployee || selectedProjectIds.length === 0) return;
    try {
      await Promise.all(
        selectedProjectIds.map((projectId) =>
          api.post(`/companies/${companyId}/projects/${projectId}/assign`, {
            employeeId: selectedEmployee.id,
          }),
        ),
      );
      toast.success("Assigned to projects");
      setProjectModalOpen(false);
      setSelectedEmployee(null);
      setSelectedProjectIds([]);
      fetchAll();
    } catch {
      toast.error("Failed to assign");
    }
  };

  const handleProjectUnassign = async (
    employeeId: number,
    projectId: number,
  ) => {
    if (!confirm("Remove from project?")) return;
    try {
      await api.delete(
        `/companies/${companyId}/projects/${projectId}/assign/${employeeId}`,
      );
      toast.success("Unassigned");
      fetchAll();
    } catch {
      toast.error("Failed to unassign");
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
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Code
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Role
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Designation
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Contact
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Status
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Projects
                </th>
                <th className="px-3 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No employees yet.
                  </td>
                </tr>
              ) : (
                employees.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-3 py-3 text-sm font-mono text-gray-900 whitespace-nowrap">
                      {e.employeeCode}
                    </td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                      {e.firstName} {e.lastName}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      {e.role ? (
                        <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                          {getRoleLabel(e.role)}
                        </span>
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500 whitespace-nowrap">
                      {e.designation}
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      {typeLabel(e.employmentType)}
                    </td>
                    <td className="px-3 py-3 text-sm text-gray-500">
                      <div>{e.email || "—"}</div>
                      <div className="text-xs text-gray-400">
                        {e.phone || ""}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-sm whitespace-nowrap">
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full ${
                          e.isActive
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {e.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-sm">
                      <div className="flex flex-wrap gap-1">
                        {e.projectMemberships?.length ? (
                          e.projectMemberships.map((pm: any) => (
                            <span
                              key={pm.projectId || pm.id}
                              className="inline-flex items-center px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                            >
                              {pm.project?.name || `Project #${pm.projectId}`}
                              <button
                                onClick={() =>
                                  handleProjectUnassign(
                                    e.id,
                                    pm.projectId || pm.id,
                                  )
                                }
                                className="ml-1 hover:text-red-500"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </span>
                          ))
                        ) : (
                          <span className="text-gray-400 text-xs">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-sm whitespace-nowrap">
                      <div className="flex items-center justify-end space-x-1">
                        <button
                          onClick={() => {
                            setSelectedEmployee(e);
                            setSelectedProjectIds([]);
                            setProjectModalOpen(true);
                          }}
                          className="text-blue-500 hover:text-blue-700"
                          title="Assign to Project"
                        >
                          <Briefcase className="h-4 w-4" />
                        </button>
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
                              hourlyRate: e.hourlyRate
                                ? String(e.hourlyRate)
                                : "",
                              dailyRate: e.dailyRate ? String(e.dailyRate) : "",
                              baseSalary: e.baseSalary
                                ? String(e.baseSalary)
                                : "",
                              userId: "",
                              role: e.role || "",
                            });
                            setModalOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900 mx-1"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(e.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add/Edit Employee Modal */}
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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium">
                    Designation
                  </label>
                  <input
                    required
                    value={form.designation}
                    onChange={(e) =>
                      setForm({ ...form, designation: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium">
                    System Role
                  </label>
                  <select
                    value={form.role}
                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                    className="mt-1 w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  >
                    <option value="">No role</option>
                    {STAFF_ROLES.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
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

      {/* Assign to Project Modal */}
      {projectModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Assign to Projects — {selectedEmployee.firstName}{" "}
                {selectedEmployee.lastName}
              </h2>
              <button
                onClick={() => setProjectModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {availableProjects.length === 0 ? (
                <p className="text-sm text-gray-500">No projects available</p>
              ) : (
                availableProjects.map((proj) => {
                  const isSelected = selectedProjectIds.includes(proj.id);
                  return (
                    <label
                      key={proj.id}
                      className={`flex items-center px-3 py-2 rounded cursor-pointer hover:bg-gray-50 ${
                        isSelected ? "bg-indigo-50" : ""
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() =>
                          setSelectedProjectIds(
                            isSelected
                              ? selectedProjectIds.filter(
                                  (id) => id !== proj.id,
                                )
                              : [...selectedProjectIds, proj.id],
                          )
                        }
                        className="mr-2 accent-indigo-600"
                      />
                      <span className="text-sm">{proj.name}</span>
                    </label>
                  );
                })
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                onClick={() => setProjectModalOpen(false)}
                className="px-4 py-2 text-gray-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleProjectAssign}
                disabled={selectedProjectIds.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import {
  CheckCircle,
  Clock,
  Eye,
  Pencil,
  Plus,
  Search,
  Trash2,
  UserCog,
  X,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

interface Machine {
  id: number | string;
  name: string;
  category: string;
  ownershipType: string;
  projectId?: number | null;
  project?: { id: number; name: string };
  runningHours: number;
  lastMaintenanceHours: number;
  operator?: { id: number; firstName: string; lastName: string };
}

interface Project {
  id: number;
  name: string;
}

interface MachineReport {
  totalIncome: number;
  totalExpense: number;
  profit: number;
}

export default function MachineriesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();

  const { hasRole, user } = useAuthStore();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState<Machine | null>(null);
  const [viewingMachine, setViewingMachine] = useState<Machine | null>(null);
  const [machineReport, setMachineReport] = useState<MachineReport | null>(
    null,
  );
  const [formData, setFormData] = useState({
    name: "",
    category: "Heavy Machinery",
    projectId: "",
    ownershipType: "OWNED",
  });

  // Operator assignment modal — native dropdown of driver/operator employees
  const [operatorModalOpen, setOperatorModalOpen] = useState(false);
  const [operatorMachine, setOperatorMachine] = useState<Machine | null>(null);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [operatorEmployees, setOperatorEmployees] = useState<
    {
      id: number;
      firstName: string;
      lastName: string;
      designation: string;
      user?: { id: number; name: string; role: string };
    }[]
  >([]);
  const [operatorsLoading, setOperatorsLoading] = useState(false);

  // Table filters
  const [searchFilter, setSearchFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [ownershipFilter, setOwnershipFilter] = useState("");

  const fetchMachines = async () => {
    if (!companyId) return;
    try {
      const endpoint =
        user?.role === SystemRole.OperatorDriver
          ? `/companies/${companyId}/machineries/my`
          : `/companies/${companyId}/machineries`;
      const res = await api.get(endpoint);
      setMachines(res.data || []);
    } catch {
      toast.error("Failed to load machineries");
    }
  };

  const fetchProjects = async () => {
    if (!companyId) return;
    try {
      const res = await api.get(`/companies/${companyId}/projects`);
      setProjects(res.data || []);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  };

  useEffect(() => {
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    const load = async () => {
      setPageLoading(true);
      await Promise.all([fetchMachines(), fetchProjects()]);
      setPageLoading(false);
    };
    load();
  }, [companyId, router]);

  if (!companyId) return null;

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        ...formData,
        projectId: formData.projectId ? parseInt(formData.projectId) : null,
      };
      if (editingMachine) {
        await api.patch(
          `/companies/${companyId}/machineries/${editingMachine.id}`,
          payload,
        );
        toast.success("Machinery updated");
      } else {
        await api.post(`/companies/${companyId}/machineries`, payload);
        toast.success("Machinery registered");
      }
      setIsModalOpen(false);
      setEditingMachine(null);
      setFormData({
        name: "",
        category: "Heavy Machinery",
        projectId: "",
        ownershipType: "OWNED",
      });
      fetchMachines();
    } catch {
      toast.error("Failed to save machinery");
    }
  };

  const handleDelete = async (id: number | string) => {
    if (confirm("Delete this machinery?")) {
      try {
        await api.delete(`/companies/${companyId}/machineries/${id}`);
        toast.success("Deleted");
        fetchMachines();
      } catch {
        toast.error("Failed to delete");
      }
    }
  };

  const handleLogHours = async (id: number | string, hours: string) => {
    try {
      const res = await api.post(
        `/companies/${companyId}/machineries/${id}/log-hours`,
        {
          hours: parseFloat(hours),
        },
      );
      if (res.data.maintenanceDue)
        toast(`Maintenance Due! ${res.data.machine.name} needs servicing.`, {
          icon: "⚠️",
        });
      else toast.success("Hours logged");
      fetchMachines();
    } catch {
      toast.error("Failed to log hours");
    }
  };

  const handleCompleteMaintenance = async (id: number | string) => {
    try {
      await api.post(
        `/companies/${companyId}/machineries/${id}/complete-maintenance`,
      );
      toast.success("Maintenance completed");
      fetchMachines();
    } catch {
      toast.error("Failed");
    }
  };

  const handleViewDetails = async (machine: Machine) => {
    setViewingMachine(machine);
    try {
      const res = await api.get(`/machineries/${machine.id}/reports`);
      setMachineReport(res.data);
    } catch {
      setMachineReport(null);
    }
  };

  const openOperatorModal = async (machine: Machine) => {
    setOperatorMachine(machine);
    setSelectedUserId("");
    setOperatorModalOpen(true);
    setOperatorsLoading(true);
    try {
      const res = await api.get(
        `/companies/${companyId}/employees?role=${SystemRole.OperatorDriver}`,
      );
      setOperatorEmployees(res.data || []);
    } catch {
      setOperatorEmployees([]);
    } finally {
      setOperatorsLoading(false);
    }
  };

  const handleAssignOperator = async () => {
    if (!operatorMachine || !selectedUserId) return;
    try {
      // Backend assignOperator expects a linked User id, not an employee id
      const emp = operatorEmployees.find(
        (e) => e.user?.id === Number(selectedUserId),
      );
      await api.post(
        `/companies/${companyId}/machineries/${operatorMachine.id}/operators`,
        {
          userId: Number(selectedUserId),
        },
      );
      toast.success(
        `Operator assigned: ${emp ? `${emp.firstName} ${emp.lastName}` : ""}`,
      );
      setOperatorModalOpen(false);
      setOperatorMachine(null);
      setSelectedUserId("");
      fetchMachines();
    } catch {
      toast.error("Failed to assign");
    }
  };

  const handleUnassignOperator = async (machineId: number | string) => {
    try {
      await api.delete(
        `/companies/${companyId}/machineries/${machineId}/operators`,
      );
      toast.success("Operator unassigned");
      fetchMachines();
    } catch {
      toast.error("Failed to unassign");
    }
  };

  if (pageLoading) return <Loading />;

  const categories = Array.from(
    new Set(machines.map((m) => m.category).filter(Boolean)),
  ).sort();

  const filteredMachines = machines.filter((machine) => {
    const q = searchFilter.toLowerCase();
    const matchesSearch =
      !q ||
      machine.name.toLowerCase().includes(q) ||
      (machine.category || "").toLowerCase().includes(q) ||
      (machine.project?.name || "").toLowerCase().includes(q);
    const matchesCategory =
      !categoryFilter || machine.category === categoryFilter;
    const matchesOwnership =
      !ownershipFilter || machine.ownershipType === ownershipFilter;
    return matchesSearch && matchesCategory && matchesOwnership;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Machineries & Vehicles
        </h1>
        {hasRole([SystemRole.Owner]) && (
          <button
            onClick={() => {
              setEditingMachine(null);
              setFormData({
                name: "",
                category: "Heavy Machinery",
                projectId: "",
                ownershipType: "OWNED",
              });
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-1" /> Register Machinery
          </button>
        )}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search name/category/project..."
            className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md w-64"
          />
        </div>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={ownershipFilter}
          onChange={(e) => setOwnershipFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-md"
        >
          <option value="">All Ownership</option>
          <option value="OWNED">OWNED</option>
          <option value="RENTED">RENTED</option>
        </select>
        <span className="ml-auto text-sm text-gray-500">
          {filteredMachines.length} of {machines.length} machines
        </span>
      </div>

      {/* Table view */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Category
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Project
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Operator
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Hours
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Maintenance
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredMachines.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No machinery found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredMachines.map((machine) => {
                  const hoursSinceMaintenance =
                    machine.runningHours - machine.lastMaintenanceHours;
                  const maintenanceDue = hoursSinceMaintenance >= 250;
                  return (
                    <tr key={machine.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {machine.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {machine.category}
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                            machine.ownershipType === "OWNED"
                              ? "bg-green-100 text-green-800"
                              : "bg-yellow-100 text-yellow-800"
                          }`}
                        >
                          {machine.ownershipType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {machine.project?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {machine.operator ? (
                          <span className="inline-flex items-center gap-1">
                            {machine.operator.firstName}{" "}
                            {machine.operator.lastName}
                            <button
                              onClick={() => handleUnassignOperator(machine.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Unassign"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 whitespace-nowrap">
                        {machine.runningHours} hrs
                      </td>
                      <td className="px-4 py-3 text-sm whitespace-nowrap">
                        {maintenanceDue ? (
                          <button
                            onClick={() =>
                              handleCompleteMaintenance(machine.id)
                            }
                            className="text-xs flex items-center text-white bg-red-600 px-2 py-1 rounded-md hover:bg-red-700"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" /> Service Now
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full">
                            OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                        <div className="flex items-center justify-end gap-3 md:gap-2">
                          <button
                            onClick={() => handleViewDetails(machine)}
                            className="text-gray-400 hover:text-gray-600"
                            title="View"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openOperatorModal(machine)}
                            className="text-blue-500 hover:text-blue-700"
                            title="Assign Operator"
                          >
                            <UserCog className="h-4 w-4" />
                          </button>
                          {!maintenanceDue && (
                            <button
                              onClick={() => {
                                const h = prompt("Enter hours worked:");
                                if (h) handleLogHours(machine.id, h);
                              }}
                              className="text-gray-500 hover:text-indigo-600"
                              title="Log Hours"
                            >
                              <Clock className="h-4 w-4" />
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setEditingMachine(machine);
                              setFormData({
                                name: machine.name,
                                category: machine.category,
                                projectId: machine.projectId
                                  ? String(machine.projectId)
                                  : "",
                                ownershipType: machine.ownershipType,
                              });
                              setIsModalOpen(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(machine.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operator Assignment Modal */}
      {operatorModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Assign Operator — {operatorMachine?.name}
              </h2>
              <button
                onClick={() => setOperatorModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Operator / Driver
              </label>
              <select
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                disabled={operatorsLoading}
              >
                <option value="">
                  {operatorsLoading
                    ? "Loading operators..."
                    : "Select an operator or driver..."}
                </option>
                {operatorEmployees.map((emp) => (
                  <option key={emp.id} value={emp.user?.id}>
                    {emp.firstName} {emp.lastName}
                    {emp.designation ? ` — ${emp.designation}` : ""} (
                    {emp.user?.role || "no account"})
                  </option>
                ))}
              </select>
              {operatorEmployees.length === 0 && !operatorsLoading && (
                <p className="text-sm text-gray-500 mt-2">
                  No OperatorDriver-role employees found. Assign the role to an
                  employee in HR → Employees first.
                </p>
              )}
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
              <button
                onClick={() => setOperatorModalOpen(false)}
                className="px-4 py-2 text-gray-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAssignOperator}
                disabled={!selectedUserId}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}

      {viewingMachine && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setViewingMachine(null);
            setMachineReport(null);
          }}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl text-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">
              {viewingMachine.name} Details
            </h2>
            <div className="space-y-3 mb-6">
              <p>
                <strong>Category:</strong> {viewingMachine.category}
              </p>
              <p>
                <strong>Ownership:</strong> {viewingMachine.ownershipType}
              </p>
              <p>
                <strong>Total Hours:</strong> {viewingMachine.runningHours}
              </p>
              <p>
                <strong>Project:</strong>{" "}
                {viewingMachine.project?.name || "Unassigned"}
              </p>
            </div>
            {machineReport && (
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-2">Financial Track</h3>
                <div className="grid grid-cols-3 gap-4 text-center mb-4">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600">Income</p>
                    <p className="font-bold text-green-900">
                      ${machineReport.totalIncome}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-red-600">Expenses</p>
                    <p className="font-bold text-red-900">
                      ${machineReport.totalExpense}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-xs text-indigo-600">Profit</p>
                    <p className="font-bold text-indigo-900">
                      ${machineReport.profit}
                    </p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[
                      {
                        name: "Finances",
                        Income: machineReport.totalIncome,
                        Expenses: machineReport.totalExpense,
                      },
                    ]}
                  >
                    <XAxis dataKey="name" />
                    <Tooltip />
                    <Bar dataKey="Income" fill="#10b981" />
                    <Bar dataKey="Expenses" fill="#ef4444" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
            <button
              onClick={() => {
                setViewingMachine(null);
                setMachineReport(null);
              }}
              className="mt-6 w-full px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">
              {editingMachine ? "Edit Machinery" : "Register New Machinery"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Machinery Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Category
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                  >
                    <option>Heavy Machinery</option>
                    <option>Transport Vehicle</option>
                    <option>Power Tool</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Ownership
                  </label>
                  <select
                    value={formData.ownershipType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        ownershipType: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                  >
                    <option value="OWNED">Owned (Asset)</option>
                    <option value="RENTED">Rented (Liability)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assign to Project (Optional)
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectId: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option value="">None</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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

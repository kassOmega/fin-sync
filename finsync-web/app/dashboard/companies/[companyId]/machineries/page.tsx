"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import {
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
  code?: string | null;
  type: string;
  status: string;
  make?: string | null;
  model?: string | null;
  plateNumber?: string | null;
  serialNumber?: string | null;
  totalHoursRun: number;
  currentMileage: number;
  hourlyRate?: number | null;
  dailyRate?: number | null;
  projectId?: number | null;
  project?: { id: number; name: string } | null;
  operator?: { id: number; firstName: string; lastName: string } | null;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  residualValue?: number | null;
  usefulLifeYears?: number | null;
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

interface UsageLog {
  id: number;
  machinery_id: number;
  hours_logged: number;
  fuel_liters?: number | null;
  fuel_cost?: number | null;
  date: string;
  machinery?: { id: number; name: string; code?: string; type?: string } | null;
  operator?: { id: number; firstName: string; lastName: string } | null;
  project?: { id: number; name: string } | null;
}

const EMPTY_FORM = {
  name: "",
  code: "",
  type: "OTHER",
  status: "AVAILABLE",
  make: "",
  model: "",
  plateNumber: "",
  serialNumber: "",
  currentMileage: "",
  hourlyRate: "",
  dailyRate: "",
  projectId: "",
  purchaseDate: "",
  purchaseCost: "",
  residualValue: "",
  usefulLifeYears: "",
};

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
  const [formData, setFormData] = useState(EMPTY_FORM);

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

  // Tab state: "machines" | "timesheets"
  const [activeTab, setActiveTab] = useState<"machines" | "timesheets">(
    "machines",
  );

  // Equipment usage logs (timesheet)
  const [logs, setLogs] = useState<UsageLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logMachineryFilter, setLogMachineryFilter] = useState("");
  const [logStart, setLogStart] = useState("");
  const [logEnd, setLogEnd] = useState("");
  const [showLogModal, setShowLogModal] = useState(false);
  const [logForm, setLogForm] = useState({
    machineryId: "",
    hours: "",
    fuelLiters: "",
    fuelCost: "",
    projectId: "",
    note: "",
  });

  // Table filters
  const [searchFilter, setSearchFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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
    const num = (v: string) => (v === "" ? undefined : Number(v));
    const payload: Record<string, unknown> = {
      name: formData.name,
      code: formData.code || undefined,
      type: formData.type,
      status: formData.status,
      make: formData.make || undefined,
      model: formData.model || undefined,
      plateNumber: formData.plateNumber || undefined,
      serialNumber: formData.serialNumber || undefined,
      currentMileage: num(formData.currentMileage),
      hourlyRate: num(formData.hourlyRate),
      dailyRate: num(formData.dailyRate),
      projectId: formData.projectId ? Number(formData.projectId) : undefined,
      purchaseDate: formData.purchaseDate || undefined,
      purchaseCost: num(formData.purchaseCost),
      residualValue: num(formData.residualValue),
      usefulLifeYears: num(formData.usefulLifeYears),
    };
    try {
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
      setFormData(EMPTY_FORM);
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
        { hours: parseFloat(hours) },
      );
      if (res.data.maintenanceDue)
        toast(`Maintenance Due! needs servicing.`, { icon: "⚠️" });
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
      await api.post(
        `/companies/${companyId}/machineries/${operatorMachine.id}/operators`,
        { userId: Number(selectedUserId) },
      );
      toast.success("Operator assigned");
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

  // ── Timesheets ──

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const params = new URLSearchParams();
      if (logMachineryFilter) params.append("machineryId", logMachineryFilter);
      if (logStart) params.append("startDate", logStart);
      if (logEnd) params.append("endDate", logEnd);
      const qs = params.toString();
      const res = await api.get(
        `/companies/${companyId}/machineries/logs${qs ? `?${qs}` : ""}`,
      );
      setLogs(res.data || []);
    } catch {
      setLogs([]);
      toast.error("Failed to load timesheets");
    } finally {
      setLogsLoading(false);
    }
  };

  const submitLog = async () => {
    if (!logForm.machineryId) return;
    try {
      await api.post(`/companies/${companyId}/machineries/logs`, {
        machineryId: Number(logForm.machineryId),
        hours: logForm.hours ? Number(logForm.hours) : undefined,
        fuelLiters: logForm.fuelLiters ? Number(logForm.fuelLiters) : undefined,
        fuelCost: logForm.fuelCost ? Number(logForm.fuelCost) : undefined,
        projectId: logForm.projectId ? Number(logForm.projectId) : undefined,
        note: logForm.note || undefined,
      });
      toast.success("Equipment usage logged");
      setShowLogModal(false);
      setLogForm({
        machineryId: "",
        hours: "",
        fuelLiters: "",
        fuelCost: "",
        projectId: "",
        note: "",
      });
      fetchLogs();
      fetchMachines();
    } catch {
      toast.error("Failed to log usage");
    }
  };

  if (pageLoading) return <Loading />;

  const types = Array.from(
    new Set(machines.map((m) => m.type).filter(Boolean)),
  ).sort();
  const statuses = Array.from(
    new Set(machines.map((m) => m.status).filter(Boolean)),
  ).sort();

  const filteredMachines = machines.filter((machine) => {
    const q = searchFilter.toLowerCase();
    const matchesSearch =
      !q ||
      machine.name.toLowerCase().includes(q) ||
      (machine.code || "").toLowerCase().includes(q) ||
      (machine.model || "").toLowerCase().includes(q);
    const matchesType = !typeFilter || machine.type === typeFilter;
    const matchesStatus = !statusFilter || machine.status === statusFilter;
    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Tab switcher */}
      <div className="flex gap-2 bg-gray-100 rounded-lg p-1 max-w-fit">
        {(
          [
            ["machines", "Machines"],
            ["timesheets", "Timesheets"],
          ] as ["machines" | "timesheets", string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setActiveTab(key);
              if (key === "timesheets") fetchLogs();
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              activeTab === key
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">
          Machineries & Vehicles
        </h1>
        {hasRole([SystemRole.Owner]) && (
          <button
            onClick={() => {
              setEditingMachine(null);
              setFormData(EMPTY_FORM);
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-1" /> Register Machinery
          </button>
        )}
      </div>

      {activeTab === "timesheets" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800">
              Equipment Timesheets
            </h2>
            <button
              onClick={() => setShowLogModal(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              <Clock className="h-5 w-5 mr-1" /> Log Usage
            </button>
          </div>

          {/* Timesheet filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <select
              value={logMachineryFilter}
              onChange={(e) => {
                setLogMachineryFilter(e.target.value);
                setTimeout(fetchLogs, 0);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              <option value="">All Machinery</option>
              {machines.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
            <input
              type="date"
              value={logStart}
              onChange={(e) => {
                setLogStart(e.target.value);
                setTimeout(fetchLogs, 0);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
            <input
              type="date"
              value={logEnd}
              onChange={(e) => {
                setLogEnd(e.target.value);
                setTimeout(fetchLogs, 0);
              }}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
            <span className="ml-auto text-sm text-gray-500">
              {logsLoading ? "Loading..." : `${logs.length} logs`}
            </span>
          </div>

          {/* Timesheets table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Machinery
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Operator
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Project
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Hours
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Fuel (L)
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Fuel Cost
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logsLoading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : logs.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500"
                      >
                        No equipment usage logs yet. Click "Log Usage" to record
                        operating hours.
                      </td>
                    </tr>
                  ) : (
                    logs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(log.date).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {log.machinery?.name || `#${log.machinery_id}`}
                          {log.machinery?.type
                            ? ` (${log.machinery.type})`
                            : ""}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {log.operator
                            ? `${log.operator.firstName} ${log.operator.lastName}`
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {log.project?.name || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-medium text-gray-900 whitespace-nowrap">
                          {Number(log.hours_logged).toFixed(2)} hrs
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 whitespace-nowrap">
                          {log.fuel_liters != null
                            ? Number(log.fuel_liters).toFixed(2)
                            : "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 whitespace-nowrap">
                          {log.fuel_cost != null
                            ? `$${Number(log.fuel_cost).toFixed(2)}`
                            : "—"}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === "machines" && (
        <>
          {/* Filter bar */}
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                placeholder="Search name/code/model..."
                className="pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-md w-56"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              <option value="">All Types</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
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
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
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
                    filteredMachines.map((machine) => (
                      <tr key={machine.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {machine.name}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-500 whitespace-nowrap">
                          {machine.code || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {machine.type}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              machine.status === "AVAILABLE"
                                ? "bg-green-100 text-green-800"
                                : machine.status === "IN_USE"
                                  ? "bg-blue-100 text-blue-800"
                                  : machine.status === "UNDER_MAINTENANCE"
                                    ? "bg-yellow-100 text-yellow-800"
                                    : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {machine.status}
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
                                onClick={() =>
                                  handleUnassignOperator(machine.id)
                                }
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
                          {Number(machine.totalHoursRun || 0).toFixed(2)} hrs
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
                            <button
                              onClick={() => {
                                setEditingMachine(machine);
                                setFormData({
                                  name: machine.name,
                                  code: machine.code || "",
                                  type: machine.type || "OTHER",
                                  status: machine.status || "AVAILABLE",
                                  make: machine.make || "",
                                  model: machine.model || "",
                                  plateNumber: machine.plateNumber || "",
                                  serialNumber: machine.serialNumber || "",
                                  currentMileage: machine.currentMileage
                                    ? String(machine.currentMileage)
                                    : "",
                                  hourlyRate: machine.hourlyRate
                                    ? String(machine.hourlyRate)
                                    : "",
                                  dailyRate: machine.dailyRate
                                    ? String(machine.dailyRate)
                                    : "",
                                  projectId: machine.projectId
                                    ? String(machine.projectId)
                                    : "",
                                  purchaseDate: machine.purchaseDate
                                    ? String(machine.purchaseDate).split("T")[0]
                                    : "",
                                  purchaseCost: machine.purchaseCost
                                    ? String(machine.purchaseCost)
                                    : "",
                                  residualValue: machine.residualValue
                                    ? String(machine.residualValue)
                                    : "",
                                  usefulLifeYears: machine.usefulLifeYears
                                    ? String(machine.usefulLifeYears)
                                    : "",
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
                    ))
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
                      No OperatorDriver-role employees found. Assign the role to
                      an employee in HR → Employees first.
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
                    <strong>Type:</strong> {viewingMachine.type}
                  </p>
                  <p>
                    <strong>Status:</strong> {viewingMachine.status}
                  </p>
                  <p>
                    <strong>Code:</strong> {viewingMachine.code || "—"}
                  </p>
                  <p>
                    <strong>Make:</strong> {viewingMachine.make || "—"}
                  </p>
                  <p>
                    <strong>Model:</strong> {viewingMachine.model || "—"}
                  </p>
                  <p>
                    <strong>Plate:</strong> {viewingMachine.plateNumber || "—"}
                  </p>
                  <p>
                    <strong>Total Hours:</strong>{" "}
                    {Number(viewingMachine.totalHoursRun || 0).toFixed(2)}
                  </p>
                  <p>
                    <strong>Mileage:</strong>{" "}
                    {viewingMachine.currentMileage || 0}
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

          {/* Register/Edit Machinery Modal (schema-compliant) */}
          {isModalOpen && (
            <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl text-gray-900 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold">
                    {editingMachine
                      ? "Edit Machinery"
                      : "Register New Machinery"}
                  </h2>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Name *
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
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Code
                      </label>
                      <input
                        type="text"
                        value={formData.code}
                        onChange={(e) =>
                          setFormData({ ...formData, code: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                        placeholder="e.g. EXC-01"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) =>
                          setFormData({ ...formData, type: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                      >
                        <option value="EXCAVATOR">Excavator</option>
                        <option value="CRANE">Crane</option>
                        <option value="MIXER">Mixer</option>
                        <option value="TRUCK">Truck</option>
                        <option value="TRACTOR">Tractor</option>
                        <option value="HARVESTER">Harvester</option>
                        <option value="SMT">SMT Machine</option>
                        <option value="COMPRESSOR">Compressor</option>
                        <option value="GENERATOR">Generator</option>
                        <option value="OTHER">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Status
                      </label>
                      <select
                        value={formData.status}
                        onChange={(e) =>
                          setFormData({ ...formData, status: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                      >
                        <option value="AVAILABLE">Available</option>
                        <option value="IN_USE">In Use</option>
                        <option value="UNDER_MAINTENANCE">
                          Under Maintenance
                        </option>
                        <option value="RETIRED">Retired</option>
                      </select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Make
                      </label>
                      <input
                        type="text"
                        value={formData.make}
                        onChange={(e) =>
                          setFormData({ ...formData, make: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                        placeholder="e.g. CAT, Komatsu"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Model
                      </label>
                      <input
                        type="text"
                        value={formData.model}
                        onChange={(e) =>
                          setFormData({ ...formData, model: e.target.value })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Plate Number
                      </label>
                      <input
                        type="text"
                        value={formData.plateNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            plateNumber: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Serial Number
                      </label>
                      <input
                        type="text"
                        value={formData.serialNumber}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            serialNumber: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Current Mileage
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.currentMileage}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            currentMileage: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Hourly Rate ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.hourlyRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            hourlyRate: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Daily Rate ($)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={formData.dailyRate}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            dailyRate: e.target.value,
                          })
                        }
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Assign to Project
                      </label>
                      <select
                        value={formData.projectId}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            projectId: e.target.value,
                          })
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
                  </div>
                  <div className="border-t border-gray-200 pt-3">
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">
                      Depreciation
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Purchase Date
                        </label>
                        <input
                          type="date"
                          value={formData.purchaseDate}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              purchaseDate: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Purchase Cost ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.purchaseCost}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              purchaseCost: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Residual Value ($)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.residualValue}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              residualValue: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">
                          Useful Life (Years)
                        </label>
                        <input
                          type="number"
                          step="1"
                          min="1"
                          value={formData.usefulLifeYears}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              usefulLifeYears: e.target.value,
                            })
                          }
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                        />
                      </div>
                    </div>
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
                      {editingMachine
                        ? "Update Machinery"
                        : "Register Machinery"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}

      {/* Log Usage Modal (Timesheets tab) */}
      {showLogModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Log Equipment Usage</h2>
              <button
                onClick={() => setShowLogModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Machinery *
                </label>
                <select
                  value={logForm.machineryId}
                  onChange={(e) =>
                    setLogForm({ ...logForm, machineryId: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                >
                  <option value="">Select machinery...</option>
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Hours
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={logForm.hours}
                    onChange={(e) =>
                      setLogForm({ ...logForm, hours: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fuel (Liters)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={logForm.fuelLiters}
                    onChange={(e) =>
                      setLogForm({ ...logForm, fuelLiters: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Fuel Cost ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={logForm.fuelCost}
                    onChange={(e) =>
                      setLogForm({ ...logForm, fuelCost: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Project
                  </label>
                  <select
                    value={logForm.projectId}
                    onChange={(e) =>
                      setLogForm({ ...logForm, projectId: e.target.value })
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  >
                    <option value="">None</option>
                    {projects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Note
                </label>
                <textarea
                  rows={2}
                  value={logForm.note}
                  onChange={(e) =>
                    setLogForm({ ...logForm, note: e.target.value })
                  }
                  className="mt-1 w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={submitLog}
                  disabled={!logForm.machineryId}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save Log
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import {
  CheckCircle,
  Clock,
  Eye,
  Pencil,
  Plus,
  Trash2,
  Wrench,
} from "lucide-react";
import { useParams } from "next/navigation"; // Use useParams hook
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";

export default function MachineriesPage() {
  // Use the hook correctly for Next.js 15
  const params = useParams();
  const companyId = params.companyId as string;

  const { hasRole } = useAuthStore();
  const [machines, setMachines] = useState([]);
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMachine, setEditingMachine] = useState(null);
  const [viewingMachine, setViewingMachine] = useState(null);
  const [machineReport, setMachineReport] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    category: "Heavy Machinery",
    projectId: "",
  });

  const fetchMachines = async () => {
    if (!companyId) return;
    try {
      const res = await api.get(`/companies/${companyId}/machineries`);
      setMachines(res.data);
    } catch {
      toast.error("Failed to load machineries");
    }
  };

  const fetchProjects = async () => {
    if (!companyId) return;
    try {
      const res = await api.get(`/companies/${companyId}/projects`);
      setProjects(res.data);
    } catch (error) {
      console.error(
        "Failed to fetch projects. Check if ProjectsModule is added to backend app.module.ts",
        error,
      );
    }
  };

  useEffect(() => {
    fetchMachines();
    fetchProjects();
  }, [companyId]);

  const handleSubmit = async (e) => {
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
      setFormData({ name: "", category: "Heavy Machinery", projectId: "" });
      fetchMachines();
    } catch {
      toast.error("Failed to save machinery");
    }
  };

  const handleDelete = async (id) => {
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

  const handleLogHours = async (id, hours) => {
    try {
      const res = await api.post(
        `/companies/${companyId}/machineries/${id}/log-hours`,
        { hours: parseFloat(hours) },
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

  const handleCompleteMaintenance = async (id) => {
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

  const handleViewDetails = async (machine) => {
    setViewingMachine(machine);
    try {
      const res = await api.get(`/machineries/${machine.id}/reports`);
      setMachineReport(res.data);
    } catch {
      setMachineReport(null);
    }
  };

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
              });
              setIsModalOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            <Plus className="h-5 w-5 mr-1" /> Register Machinery
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map((machine) => {
          const hoursSinceMaintenance =
            machine.runningHours - machine.lastMaintenanceHours;
          const maintenanceDue = hoursSinceMaintenance >= 250;
          return (
            <div
              key={machine.id}
              className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {machine.name}
                  </h3>
                  <p className="text-xs text-gray-500">
                    {machine.category}{" "}
                    {machine.project && `| ${machine.project.name}`}
                  </p>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetails(machine)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingMachine(machine);
                      setFormData({
                        name: machine.name,
                        category: machine.category,
                        projectId: machine.projectId || "",
                      });
                      setIsModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(machine.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              <div className="space-y-2 text-sm border-t pt-4">
                <div className="flex justify-between text-gray-600">
                  <span>Hours:</span>
                  <span className="font-medium text-gray-900">
                    {machine.runningHours} hrs
                  </span>
                </div>
                {maintenanceDue ? (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-3 text-center">
                    <Wrench className="h-5 w-5 text-red-600 mx-auto mb-1" />
                    <p className="text-xs text-red-800 font-medium mb-2">
                      Maintenance Required
                    </p>
                    <button
                      onClick={() => handleCompleteMaintenance(machine.id)}
                      className="text-xs flex items-center mx-auto text-white bg-red-600 px-3 py-1 rounded-md hover:bg-red-700"
                    >
                      <CheckCircle className="h-3 w-3 mr-1" /> Mark as Serviced
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      const h = prompt("Enter hours worked:");
                      if (h) handleLogHours(machine.id, h);
                    }}
                    className="mt-4 w-full flex items-center justify-center text-sm text-indigo-600 border border-indigo-200 rounded-md py-2 hover:bg-indigo-50"
                  >
                    <Clock className="h-4 w-4 mr-1" /> Log Working Hours
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

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

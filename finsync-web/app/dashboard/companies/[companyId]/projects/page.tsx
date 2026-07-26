"use client";

import api from "@/lib/api";
import { Eye, Flag, Pencil, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1744",
];

export default function ProjectsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const [projects, setProjects] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProj, setEditingProj] = useState(null);
  const [viewingProj, setViewingProj] = useState(null);
  const [projReport, setProjReport] = useState(null);
  const [formData, setFormData] = useState({ name: "", progress: 0 });

  const fetchProjects = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/projects`);
      setProjects(res.data);
    } catch {
      toast.error("Failed to load projects");
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [companyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingProj) {
        await api.patch(
          `/companies/${companyId}/projects/${editingProj.id}`,
          formData,
        );
        toast.success("Project updated");
      } else {
        await api.post(`/companies/${companyId}/projects`, formData);
        toast.success("Project created");
      }
      setIsModalOpen(false);
      setEditingProj(null);
      setFormData({ name: "", progress: 0 });
      fetchProjects();
    } catch {
      toast.error("Failed to save project");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this project?")) {
      try {
        await api.delete(`/companies/${companyId}/projects/${id}`);
        toast.success("Deleted");
        fetchProjects();
      } catch {
        toast.error("Failed to delete");
      }
    }
  };

  const handleViewDetails = async (proj) => {
    setViewingProj(proj);
    try {
      const res = await api.get(`/projects/${proj.id}/reports`);
      setProjReport(res.data);
    } catch {
      setProjReport(null);
    }
  };

  // Helper to format data for charts
  const formatPieData = (dataObj) => {
    return Object.entries(dataObj || {}).map(([name, value]) => ({
      name,
      value,
    }));
  };

  const expensePieData = formatPieData(projReport?.expensesByCategory);
  const incomePieData = formatPieData(projReport?.incomesByCategory);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Projects</h1>
        <button
          onClick={() => {
            setEditingProj(null);
            setFormData({ name: "", progress: 0 });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> New Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {projects.map((proj) => (
          <div
            key={proj.id}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <Flag className="h-6 w-6 text-blue-600" />
                </div>
                <h3 className="font-semibold text-gray-900">{proj.name}</h3>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleViewDetails(proj)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setEditingProj(proj);
                    setFormData({ name: proj.name, progress: proj.progress });
                    setIsModalOpen(true);
                  }}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(proj.id)}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-900">
                  {proj.progress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${proj.progress}%` }}
                ></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Project Details & Charts Modal */}
      {viewingProj && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => {
            setViewingProj(null);
            setProjReport(null);
          }}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl text-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">{viewingProj.name} Details</h2>
              <button
                onClick={() => {
                  setViewingProj(null);
                  setProjReport(null);
                }}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-1">
                Current Progress:{" "}
                <span className="font-bold text-gray-900">
                  {viewingProj.progress}%
                </span>
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-blue-600 h-2.5 rounded-full"
                  style={{ width: `${viewingProj.progress}%` }}
                ></div>
              </div>
            </div>

            {projReport && (
              <>
                <div className="grid grid-cols-3 gap-4 text-center mb-6">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-green-600">Income</p>
                    <p className="font-bold text-green-900">
                      ${projReport.totalIncome.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-red-600">Expenses</p>
                    <p className="font-bold text-red-900">
                      ${projReport.totalExpense.toLocaleString()}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-xs text-indigo-600">Profit</p>
                    <p className="font-bold text-indigo-900">
                      ${projReport.profit.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                  {/* Income vs Expense Bar Chart */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">
                      Income vs Expenses
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart
                        data={[
                          {
                            name: "Total",
                            Income: projReport.totalIncome,
                            Expenses: projReport.totalExpense,
                          },
                        ]}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="Income" fill="#10b981" />
                        <Bar dataKey="Expenses" fill="#ef4444" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Expense Breakdown Pie Chart */}
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 text-center">
                      Expense Breakdown
                    </h4>
                    {expensePieData.length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie
                            data={expensePieData}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {expensePieData.map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                          <Legend wrapperStyle={{ fontSize: "12px" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <p className="text-gray-500 text-center py-12 text-sm">
                        No expenses recorded
                      </p>
                    )}
                  </div>
                </div>
              </>
            )}

            <button
              onClick={() => {
                setViewingProj(null);
                setProjReport(null);
              }}
              className="mt-2 w-full px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Add/Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">
              {editingProj ? "Edit Project" : "New Project"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Project Name
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
                  Progress (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  required
                  value={formData.progress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      progress: parseFloat(e.target.value),
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
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

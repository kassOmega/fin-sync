"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { Eye, Flag, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1744",
];

interface Project {
  id: number | string;
  name: string;
  progress: number;
}

interface ProjectReport {
  totalIncome: number;
  totalExpense: number;
  profit: number;
  expensesByCategory?: Record<string, number>;
  incomesByCategory?: Record<string, number>;
}

export default function ProjectsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const { user } = useAuthStore();
  const [projects, setProjects] = useState<Project[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProj, setEditingProj] = useState<Project | null>(null);
  const [viewingProj, setViewingProj] = useState<Project | null>(null);
  const [projReport, setProjReport] = useState<ProjectReport | null>(null);
  const [formData, setFormData] = useState({ name: "", progress: 0 });

  const fetchProjects = async () => {
    try {
      const isScopedRole =
        user?.role === SystemRole.ProjectManager ||
        user?.role === SystemRole.Foreman;
      const endpoint = isScopedRole
        ? `/companies/${companyId}/projects/my`
        : `/companies/${companyId}/projects`;
      const res = await api.get(endpoint);
      setProjects(res.data);
    } catch {
      toast.error("Failed to load projects");
    }
  };

  const fetchProjectReport = async (projectId: number | string) => {
    try {
      const res = await api.get(`/projects/${projectId}/reports`);
      setProjReport(res.data);
    } catch {
      /* silent */
    }
  };

  useEffect(() => {
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    const load = async () => {
      setPageLoading(true);
      await fetchProjects();
      setPageLoading(false);
    };
    load();
  }, [companyId, router]);

  if (!companyId) {
    return null;
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
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

  const handleDelete = async (id: number | string) => {
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

  if (pageLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

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
          <Plus className="h-5 w-5 mr-1" /> Add Project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {projects.map((p) => (
          <Link
            key={p.id}
            href={`/dashboard/companies/${companyId}/projects/${p.id}`}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-all group block"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-indigo-50 rounded-lg">
                  <Flag className="h-6 w-6 text-indigo-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{p.name}</h3>
                  <p className="text-xs text-gray-500">
                    Progress: {p.progress}%
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div
                className="bg-indigo-600 h-2.5 rounded-full"
                style={{ width: `${p.progress}%` }}
              ></div>
            </div>
            <div className="flex justify-between items-center">
              <div className="flex space-x-2">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setViewingProj(p);
                    fetchProjectReport(p.id);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Eye className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setEditingProj(p);
                    setFormData({ name: p.name, progress: p.progress });
                    setIsModalOpen(true);
                  }}
                  className="text-indigo-600 hover:text-indigo-900"
                >
                  <Pencil className="h-5 w-5" />
                </button>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    handleDelete(p.id);
                  }}
                  className="text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {viewingProj && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingProj(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">{viewingProj.name}</h2>
            {projReport ? (
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Income</p>
                    <p className="text-lg font-bold text-green-600">
                      ${projReport.totalIncome}
                    </p>
                  </div>
                  <div className="bg-red-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Expense</p>
                    <p className="text-lg font-bold text-red-600">
                      ${projReport.totalExpense}
                    </p>
                  </div>
                  <div className="bg-indigo-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Profit</p>
                    <p
                      className={`text-lg font-bold ${projReport.profit >= 0 ? "text-indigo-600" : "text-red-600"}`}
                    >
                      ${projReport.profit}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
              </div>
            )}
            <button
              onClick={() => setViewingProj(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
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
                  value={formData.progress}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      progress: parseInt(e.target.value) || 0,
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

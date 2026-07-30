"use client";

import Loading from "@/components/Loading";

import api from "@/lib/api";
import { Pencil, Save, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Project {
  id: number;
  name: string;
  code: string | null;
  description: string | null;
  status: string;
  progress: number;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  completedAt: string | null;
  manager: { id: number; firstName: string; lastName: string } | null;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  PLANNED: "bg-gray-100 text-gray-700",
  IN_PROGRESS: "bg-blue-100 text-blue-700",
  ON_HOLD: "bg-yellow-100 text-yellow-800",
  COMPLETED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function ProjectOverviewPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "",
    budget: "",
    progress: 0,
    startDate: "",
    endDate: "",
  });

  const fetchProject = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/projects`);
      const found = res.data.find((p: Project) => String(p.id) === projectId);
      setProject(found || null);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyId || !projectId) {
      router.push("/dashboard/companies");
      return;
    }
    fetchProject();
  }, [companyId, projectId]);

  const openEdit = () => {
    if (!project) return;
    setForm({
      name: project.name,
      description: project.description || "",
      status: project.status,
      budget: project.budget != null ? String(project.budget) : "",
      progress: project.progress,
      startDate: project.startDate ? project.startDate.split("T")[0] : "",
      endDate: project.endDate ? project.endDate.split("T")[0] : "",
    });
    setEditOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.patch(`/companies/${companyId}/projects/${projectId}`, {
        name: form.name,
        description: form.description || undefined,
        status: form.status,
        budget: form.budget ? parseFloat(form.budget) : null,
        progress: form.progress,
        startDate: form.startDate
          ? new Date(form.startDate).toISOString()
          : null,
        endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      });
      toast.success("Project updated");
      setEditOpen(false);
      fetchProject();
    } catch {
      toast.error("Failed to update");
    }
  };

  if (loading) return <Loading />;
  if (!project)
    return (
      <div className="text-center py-20 text-gray-500">Project not found.</div>
    );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{project.name}</h2>
            <div className="flex items-center gap-3 mt-1">
              {project.code && (
                <span className="text-sm font-mono text-gray-400">
                  {project.code}
                </span>
              )}
              <span
                className={`px-2 py-0.5 text-xs rounded-full font-medium ${STATUS_STYLES[project.status] || "bg-gray-100 text-gray-700"}`}
              >
                {project.status}
              </span>
            </div>
          </div>
          <button
            onClick={openEdit}
            className="flex items-center px-3 py-1.5 text-sm bg-indigo-50 text-indigo-700 rounded-md hover:bg-indigo-100"
          >
            <Pencil className="h-4 w-4 mr-1" /> Edit
          </button>
        </div>
        {project.description && (
          <p className="mt-3 text-sm text-gray-600 border-t pt-3">
            {project.description}
          </p>
        )}
      </div>

      {/* Progress */}
      <div className="bg-white p-5 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold text-gray-500">Progress</h3>
          <span className="text-sm font-bold text-gray-900">
            {project.progress}%
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-indigo-600 h-3 rounded-full transition-all"
            style={{ width: `${project.progress}%` }}
          />
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Timeline
          </h3>
          <p className="text-sm mt-1 text-gray-900">
            {project.startDate
              ? new Date(project.startDate).toLocaleDateString()
              : "—"}{" "}
            →{" "}
            {project.endDate
              ? new Date(project.endDate).toLocaleDateString()
              : "—"}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Manager
          </h3>
          <p className="text-sm mt-1 text-gray-900 font-medium">
            {project.manager
              ? `${project.manager.firstName} ${project.manager.lastName}`
              : "Unassigned"}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Budget
          </h3>
          <p className="text-sm mt-1 text-gray-900 font-bold">
            {project.budget != null
              ? `$${Number(project.budget).toLocaleString()}`
              : "—"}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Created
          </h3>
          <p className="text-sm mt-1 text-gray-900">
            {project.createdAt
              ? new Date(project.createdAt).toLocaleDateString()
              : "—"}
          </p>
        </div>
      </div>

      {/* Edit Modal */}
      {editOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold text-gray-900">Edit Project</h2>
              <button
                onClick={() => setEditOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name
                </label>
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm({ ...form, status: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  >
                    <option value="PLANNED">Planned</option>
                    <option value="IN_PROGRESS">In Progress</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Budget ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.budget}
                    onChange={(e) =>
                      setForm({ ...form, budget: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Progress (%)
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={form.progress}
                  onChange={(e) =>
                    setForm({ ...form, progress: parseInt(e.target.value) })
                  }
                  className="w-full"
                />
                <span className="text-sm text-gray-500">{form.progress}%</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) =>
                      setForm({ ...form, startDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) =>
                      setForm({ ...form, endDate: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 flex items-center"
                >
                  <Save className="h-4 w-4 mr-1" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

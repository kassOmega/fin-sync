"use client";

import api from "@/lib/api";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Project {
  id: number;
  name: string;
  code: string | null;
  status: string;
  progress: number;
  budget: number | null;
  startDate: string | null;
  endDate: string | null;
  manager: { id: number; firstName: string; lastName: string } | null;
}

export default function ProjectOverviewPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !projectId) {
      router.push("/dashboard/companies");
      return;
    }
    api
      .get(`/companies/${companyId}/projects`)
      .then((res) => {
        const found = res.data.find((p: Project) => String(p.id) === projectId);
        setProject(found || null);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [companyId, projectId]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );
  if (!project)
    return (
      <div className="text-center py-20 text-gray-500">Project not found.</div>
    );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 bg-white p-6 rounded-lg shadow-sm border">
          <h2 className="text-xl font-bold text-gray-800">{project.name}</h2>
          {project.code && (
            <p className="text-sm text-gray-500">{project.code}</p>
          )}
          <div className="mt-4 flex gap-4">
            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-sm font-medium">
              {project.status}
            </span>
            {project.budget != null && (
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                Budget: ${Number(project.budget).toLocaleString()}
              </span>
            )}
          </div>
          <div className="mt-4 w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-indigo-600 h-3 rounded-full"
              style={{ width: `${project.progress}%` }}
            />
          </div>
          <p className="text-sm text-gray-500 mt-1">
            {project.progress}% Complete
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500">Timeline</h3>
          <p className="text-sm mt-1">
            {project.startDate || "—"} → {project.endDate || "—"}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500">Manager</h3>
          <p className="text-sm mt-1">
            {project.manager
              ? `${project.manager.firstName} ${project.manager.lastName}`
              : "Unassigned"}
          </p>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border">
          <h3 className="text-sm font-semibold text-gray-500">Budget</h3>
          <p className="text-sm mt-1 font-bold">
            $
            {project.budget != null
              ? Number(project.budget).toLocaleString()
              : "—"}
          </p>
        </div>
      </div>
    </div>
  );
}

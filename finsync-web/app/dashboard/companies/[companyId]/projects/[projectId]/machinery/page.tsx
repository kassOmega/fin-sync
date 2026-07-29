"use client";

import api from "@/lib/api";
import { Wrench } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Machinery {
  id: number;
  name: string;
  code: string | null;
  type: string;
  status: string;
  plateNumber: string | null;
  totalHoursRun: number;
}

export default function ProjectMachineryPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [machines, setMachines] = useState<Machinery[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId || !projectId) {
      router.push("/dashboard/companies");
      return;
    }
    api
      .get(`/companies/${companyId}/machineries`)
      .then((res) => {
        const filtered = (res.data || []).filter(
          (m: any) => m.projectId == parseInt(projectId),
        );
        setMachines(filtered);
      })
      .catch(() => toast.error("Failed to load"))
      .finally(() => setLoading(false));
  }, [companyId, projectId]);

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Project Machinery</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {machines.length === 0 ? (
          <div className="col-span-3 text-center py-10 text-gray-500">
            No machinery assigned to this project.
          </div>
        ) : (
          machines.map((m) => (
            <div
              key={m.id}
              className="bg-white p-4 rounded-lg shadow-sm border"
            >
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold">{m.name}</h3>
              </div>
              <p className="text-xs text-gray-500">{m.code || "No code"}</p>
              <div className="mt-2 flex gap-2">
                <span className="px-2 py-0.5 bg-gray-100 rounded text-xs">
                  {m.type}
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded text-xs">
                  {m.status}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Hours: {Number(m.totalHoursRun || 0)}h
              </p>
              {m.plateNumber && (
                <p className="text-xs text-gray-400">Plate: {m.plateNumber}</p>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}

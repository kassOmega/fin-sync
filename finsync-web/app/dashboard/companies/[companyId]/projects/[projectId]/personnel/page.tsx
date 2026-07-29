"use client";

import api from "@/lib/api";
import { CheckCircle, UserPlus, UserX } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
  designation: string;
}

export default function ProjectPersonnelPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [assignedIds, setAssignedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState("");

  const fetchData = async () => {
    try {
      const [empRes, projRes] = await Promise.all([
        api.get(`/companies/${companyId}/employees`),
        api.get(`/companies/${companyId}/projects`),
      ]);
      setEmployees(empRes.data);
      // Extract assigned user IDs from all project assignments
      const allProjs = Array.isArray(projRes.data) ? projRes.data : [];
      const thisProj = allProjs.find((p: any) => String(p.id) === projectId);
      const assignments = thisProj?.assignments || [];
      setAssignedIds(
        assignments.map((a: any) => a.user?.id || a.userId).filter(Boolean),
      );
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyId || !projectId) {
      router.push("/dashboard/companies");
      return;
    }
    fetchData();
  }, [companyId, projectId]);

  const handleAssign = async () => {
    if (!selectedEmp) return;
    try {
      await api.post(`/companies/${companyId}/projects/${projectId}/assign`, {
        userId: parseInt(selectedEmp),
      });
      toast.success("Assigned");
      setAssignOpen(false);
      setSelectedEmp("");
      fetchData();
    } catch {
      toast.error("Failed");
    }
  };

  const handleRemove = async (userId: number) => {
    if (!confirm("Remove from project?")) return;
    try {
      await api.delete(
        `/companies/${companyId}/projects/${projectId}/assign/${userId}`,
      );
      toast.success("Removed");
      fetchData();
    } catch {
      toast.error("Failed");
    }
  };

  if (loading)
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500" />
      </div>
    );

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Project Personnel</h2>
        <button
          onClick={() => setAssignOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <UserPlus className="h-5 w-5 mr-1" /> Assign Worker
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
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
              <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No employees found.
                </td>
              </tr>
            ) : (
              employees.map((emp) => {
                const isAssigned = assignedIds.includes(emp.id);
                return (
                  <tr key={emp.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-mono text-gray-500">
                      {emp.employeeCode}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {emp.firstName} {emp.lastName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {emp.designation}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isAssigned ? (
                        <span className="inline-flex items-center px-2 py-0.5 text-xs bg-green-100 text-green-800 rounded-full">
                          <CheckCircle className="h-3 w-3 mr-1" /> Assigned
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-500 rounded-full">
                          —
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {isAssigned ? (
                        <button
                          onClick={() => handleRemove(emp.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <UserX className="h-4 w-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSelectedEmp(String(emp.id));
                            setAssignOpen(true);
                          }}
                          className="text-indigo-600 hover:text-indigo-900"
                        >
                          Assign
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {assignOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold mb-4">Assign Worker to Project</h2>
            <select
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              className="w-full border border-gray-300 rounded p-2 mb-4 bg-white text-gray-900"
            >
              <option value="">Select employee...</option>
              {employees
                .filter((e) => !assignedIds.includes(e.id))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} — {e.designation}
                  </option>
                ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setAssignOpen(false)}
                className="px-4 py-2 text-gray-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md text-sm"
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

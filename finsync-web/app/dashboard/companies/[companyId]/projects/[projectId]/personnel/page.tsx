"use client";

import EmployeeSelector from "@/components/EmployeeSelector";
import Loading from "@/components/Loading";
import api from "@/lib/api";
import { getRoleLabel } from "@/lib/roles";
import { UserPlus, UserX, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface AssignedEmployee {
  id: number;
  employeeId: number;
  roleOnSite?: string;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation: string;
    role?: string;
  };
}

export default function ProjectPersonnelPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [assigned, setAssigned] = useState<AssignedEmployee[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedEmployeeIds, setSelectedEmployeeIds] = useState<number[]>([]);

  const fetchData = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/projects`);
      const projects = res.data || [];
      const project = projects.find((p: any) => String(p.id) === projectId);
      setAssigned(project?.members || []);
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

  const handleBatchAssign = async () => {
    if (selectedEmployeeIds.length === 0) return;
    try {
      await Promise.all(
        selectedEmployeeIds.map((employeeId) =>
          api.post(`/companies/${companyId}/projects/${projectId}/assign`, {
            employeeId,
          }),
        ),
      );
      toast.success(`${selectedEmployeeIds.length} employee(s) assigned`);
      setAssignOpen(false);
      setSelectedEmployeeIds([]);
      fetchData();
    } catch {
      toast.error("Failed to assign");
    }
  };

  const handleRemove = async (employeeId: number) => {
    if (!confirm("Remove from project?")) return;
    try {
      await api.delete(
        `/companies/${companyId}/projects/${projectId}/assign/${employeeId}`,
      );
      toast.success("Removed");
      fetchData();
    } catch {
      toast.error("Failed to remove");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-800">Project Personnel</h2>
        <button
          onClick={() => setAssignOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <UserPlus className="h-5 w-5 mr-1" /> Assign Employees
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
                Role
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Designation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                On Site
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {assigned.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No personnel assigned to this project.
                </td>
              </tr>
            ) : (
              assigned.map((member) => (
                <tr key={member.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-mono text-gray-500">
                    {member.employee?.employeeCode || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {member.employee?.firstName} {member.employee?.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {member.employee?.role ? (
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                        {getRoleLabel(member.employee.role)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {member.employee?.designation || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {member.roleOnSite || "—"}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(member.employeeId)}
                      className="text-red-500 hover:text-red-700"
                      title="Remove from project"
                    >
                      <UserX className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Assign Modal with EmployeeSelector */}
      {assignOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[80vh] flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Assign Employees</h2>
              <button
                onClick={() => setAssignOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <EmployeeSelector
                companyId={parseInt(companyId)}
                selectedIds={selectedEmployeeIds}
                onChange={setSelectedEmployeeIds}
                multiple={true}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4 border-t mt-4">
              <button
                onClick={() => setAssignOpen(false)}
                className="px-4 py-2 text-gray-600 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleBatchAssign}
                disabled={selectedEmployeeIds.length === 0}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm"
              >
                Assign ({selectedEmployeeIds.length})
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

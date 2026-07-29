"use client";

import api from "@/lib/api";
import { UserPlus, UserX } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Member {
  id: number;
  employeeId: number;
  employee: {
    id: number;
    firstName: string;
    lastName: string;
    employeeCode: string;
    designation: string;
  };
  roleOnSite: string | null;
}
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
  const [members, setMembers] = useState<Member[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState("");

  const fetchData = async () => {
    try {
      const [mRes, eRes] = await Promise.all([
        api.get(`/companies/${companyId}/projects/${projectId}/members`),
        api.get(`/companies/${companyId}/employees`),
      ]);
      setMembers(Array.isArray(mRes.data) ? mRes.data : []);
      setEmployees(eRes.data);
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
  }, []);

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

  const handleRemove = async (memberId: number) => {
    if (!confirm("Remove from project?")) return;
    try {
      await api.delete(
        `/companies/${companyId}/projects/${projectId}/assign/${memberId}`,
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
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Project Personnel</h1>
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
                Name
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Designation
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Role
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {members.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                  No workers assigned.
                </td>
              </tr>
            ) : (
              members.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium">
                    {m.employee?.firstName} {m.employee?.lastName}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {m.employee?.designation}
                  </td>
                  <td className="px-4 py-3 text-sm">{m.roleOnSite || "—"}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleRemove(m.employeeId)}
                      className="text-red-500 hover:text-red-700"
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
      {assignOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">Assign Worker</h2>
            <select
              value={selectedEmp}
              onChange={(e) => setSelectedEmp(e.target.value)}
              className="w-full border rounded p-2 mb-4"
            >
              <option value="">Select employee...</option>
              {employees
                .filter((e) => !members.find((m) => m.employeeId === e.id))
                .map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.firstName} {e.lastName} — {e.designation}
                  </option>
                ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setAssignOpen(false)}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAssign}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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

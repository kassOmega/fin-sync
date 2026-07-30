"use client";

import Loading from "@/components/Loading";

import api from "@/lib/api";
import { STAFF_ROLES } from "@/lib/roles";
import { SystemRole } from "@/lib/types";
import { Pencil, Shield, Trash2, UserPlus, X } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface StaffMember {
  id: number | string;
  role: string;
  companyRoleId: number | null;
  user: { id: number; name: string; email: string };
}

interface CompanyRole {
  id: number;
  name: string;
  permissions: {
    permission: { id: number; code: string; description: string };
  }[];
}

export default function StaffPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<StaffMember | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: SystemRole.Cashier,
  });
  const [loading, setLoading] = useState(false);

  const fetchStaff = async () => {
    try {
      const staffRes = await api.get(`/companies/${companyId}/staff`);
      setStaff(staffRes.data);
    } catch {
      toast.error("Failed to load staff");
    }
    try {
      const rolesRes = await api.get(`/companies/${companyId}/roles`);
      setRoles(rolesRes.data);
    } catch {
      // roles endpoint may not be deployed yet — don't fail
    }
  };

  useEffect(() => {
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    const load = async () => {
      setPageLoading(true);
      await Promise.all([fetchStaff()]);
      setPageLoading(false);
    };
    load();
  }, [companyId, router]);

  if (!companyId) {
    return null;
  }

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users/staff", {
        ...formData,
        companyId: parseInt(companyId),
      });
      toast.success("Staff member added!");
      setIsModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: SystemRole.Cashier,
      });
      fetchStaff();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  const handleEditStart = (member: StaffMember) => {
    setEditingMember(member);
    setSelectedRoleId(member.companyRoleId);
  };

  const handleRoleAssign = async () => {
    if (!editingMember) return;
    try {
      if (selectedRoleId) {
        await api.patch(
          `/companies/${companyId}/staff/${editingMember.id}/assign-role`,
          {
            roleId: selectedRoleId,
          },
        );
      } else {
        await api.delete(
          `/companies/${companyId}/staff/${editingMember.id}/assign-role`,
        );
      }
      toast.success("Role updated");
      setEditingMember(null);
      setSelectedRoleId(null);
      fetchStaff();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleRemove = async (memberId: number | string) => {
    if (!confirm("Remove this staff member?")) return;
    try {
      await api.delete(`/companies/${companyId}/staff/${memberId}`);
      toast.success("Staff removed");
      fetchStaff();
    } catch {
      toast.error("Failed to remove staff");
    }
  };

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  if (pageLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Company Staff</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <UserPlus className="h-5 w-5 mr-1" /> Add Staff
        </button>
      </div>

      {/* Staff Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  System Role
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Custom Role
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {staff.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No staff members yet.
                  </td>
                </tr>
              ) : (
                staff.map((member) => {
                  const role = roles.find((r) => r.id === member.companyRoleId);
                  return (
                    <tr key={member.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">
                        {member.user.name}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {member.user.email}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className="inline-block px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded-full">
                          {member.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {role ? (
                          <span className="inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full">
                            {role.name} ({role.permissions.length} perms)
                          </span>
                        ) : (
                          <span className="text-xs text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleEditStart(member)}
                            className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                            title="Change Role"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemove(member.id)}
                            className="p-1 text-red-500 hover:bg-red-50 rounded"
                            title="Remove"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Role Modal */}
      {editingMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Change Role — {editingMember.user.name}
              </h2>
              <button
                onClick={() => setEditingMember(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                value={selectedRoleId ?? ""}
                onChange={(e) =>
                  setSelectedRoleId(
                    e.target.value ? Number(e.target.value) : null,
                  )
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white text-gray-900"
              >
                <option value="">No role</option>
                {roles.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.permissions.length} perms)
                  </option>
                ))}
              </select>
            </div>

            {/* Show selected role permissions */}
            {selectedRole && (
              <div className="mb-4 p-3 bg-gray-50 rounded-md border border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Shield className="h-4 w-4 mr-1 text-indigo-500" />
                  {selectedRole.name} Permissions
                </p>
                <div className="flex flex-wrap gap-1">
                  {selectedRole.permissions.map((rp) => (
                    <span
                      key={rp.permission.code}
                      className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded"
                    >
                      {rp.permission.code}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingMember(null)}
                className="px-4 py-2 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleAssign}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Add New Staff Member
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Temporary Password
                </label>
                <input
                  type="password"
                  required
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 text-gray-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  System Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as SystemRole,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  {STAFF_ROLES.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
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
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { Plus, Save, Shield, Trash2, UserPlus, X } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Permission {
  id: number;
  code: string;
  description: string;
}

interface CompanyRole {
  id: number;
  name: string;
  createdAt: string;
  permissions: { permission: Permission }[];
  _count?: { members: number };
}

interface StaffMember {
  id: number;
  role: string;
  companyRoleId: number | null;
  user: { id: number; name: string; email: string };
}

export default function RolesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const { user, hasRole } = useAuthStore();

  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<CompanyRole[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);

  // Create role form
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newRoleName, setNewRoleName] = useState("");
  const [selectedPerms, setSelectedPerms] = useState<Set<string>>(new Set());

  // Edit role
  const [editingRole, setEditingRole] = useState<CompanyRole | null>(null);
  const [editRoleName, setEditRoleName] = useState("");
  const [editSelectedPerms, setEditSelectedPerms] = useState<Set<string>>(
    new Set(),
  );

  // Assign role to staff
  const [assigningStaff, setAssigningStaff] = useState<number | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [permsRes, rolesRes, staffRes] = await Promise.all([
        api.get(`/companies/${companyId}/permissions`),
        api.get(`/companies/${companyId}/roles`),
        api.get(`/companies/${companyId}/staff`),
      ]);
      setPermissions(permsRes.data);
      setRoles(rolesRes.data);
      setStaff(staffRes.data);
    } catch {
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (companyId) fetchData();
  }, [companyId]);

  const togglePerm = (
    code: string,
    set: Set<string>,
    setter: (s: Set<string>) => void,
  ) => {
    const next = new Set(set);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setter(next);
  };

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) {
      toast.error("Role name is required");
      return;
    }
    try {
      await api.post(`/companies/${companyId}/roles`, {
        name: newRoleName,
        permissionCodes: Array.from(selectedPerms),
      });
      toast.success("Role created!");
      setShowCreateForm(false);
      setNewRoleName("");
      setSelectedPerms(new Set());
      fetchData();
    } catch {
      toast.error("Failed to create role");
    }
  };

  const handleUpdateRole = async () => {
    if (!editingRole || !editRoleName.trim()) return;
    try {
      await api.patch(`/companies/${companyId}/roles/${editingRole.id}`, {
        name: editRoleName,
        permissionCodes: Array.from(editSelectedPerms),
      });
      toast.success("Role updated!");
      setEditingRole(null);
      fetchData();
    } catch {
      toast.error("Failed to update role");
    }
  };

  const handleDeleteRole = async (roleId: number) => {
    if (!confirm("Delete this role? This cannot be undone.")) return;
    try {
      await api.delete(`/companies/${companyId}/roles/${roleId}`);
      toast.success("Role deleted");
      fetchData();
    } catch {
      toast.error("Failed to delete role");
    }
  };

  const handleAssignRole = async (memberId: number, roleId: number | null) => {
    try {
      if (roleId) {
        await api.patch(
          `/companies/${companyId}/staff/${memberId}/assign-role`,
          { roleId },
        );
        toast.success("Role assigned");
      } else {
        await api.delete(
          `/companies/${companyId}/staff/${memberId}/assign-role`,
        );
        toast.success("Role removed");
      }
      setAssigningStaff(null);
      fetchData();
    } catch {
      toast.error("Failed to assign role");
    }
  };

  const startEdit = (role: CompanyRole) => {
    setEditingRole(role);
    setEditRoleName(role.name);
    setEditSelectedPerms(
      new Set(role.permissions.map((rp) => rp.permission.code)),
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Role & Permission Management
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Create custom roles and assign granular permissions to staff members
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-1" /> Create Role
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Roles List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center">
            <Shield className="h-5 w-5 mr-2 text-indigo-500" />
            Custom Roles
          </h2>

          {roles.length === 0 && (
            <div className="bg-white p-8 rounded-lg border border-gray-200 text-center text-gray-500">
              No roles created yet. Click "Create Role" to get started.
            </div>
          )}

          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white p-5 rounded-lg border border-gray-200"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-gray-900">{role.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {role._count?.members || 0} member(s) assigned
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => startEdit(role)}
                    className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                    title="Edit"
                  >
                    <Save className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteRole(role.id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {role.permissions.map((rp) => (
                  <span
                    key={rp.permission.code}
                    className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full"
                  >
                    {rp.permission.code}
                  </span>
                ))}
                {role.permissions.length === 0 && (
                  <span className="text-xs text-gray-400">No permissions</span>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Staff List with Role Assignment */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-700 flex items-center">
            <UserPlus className="h-5 w-5 mr-2 text-indigo-500" />
            Staff Roles
          </h2>

          <div className="bg-white rounded-lg border border-gray-200 divide-y">
            {staff.map((member) => (
              <div key={member.id} className="p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {member.user.name}
                    </p>
                    <p className="text-xs text-gray-500">{member.user.email}</p>
                    <span className="mt-1 inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                      {member.role}
                    </span>
                  </div>
                  <button
                    onClick={() =>
                      setAssigningStaff(
                        assigningStaff === member.id ? null : member.id,
                      )
                    }
                    className="text-xs text-indigo-600 hover:underline"
                  >
                    {member.companyRoleId ? "Change" : "Assign"}
                  </button>
                </div>

                {assigningStaff === member.id && (
                  <div className="mt-3 space-y-1 max-h-40 overflow-y-auto">
                    <button
                      onClick={() => handleAssignRole(member.id, null)}
                      className={`w-full text-left px-3 py-1.5 text-xs rounded ${
                        !member.companyRoleId
                          ? "bg-indigo-100 text-indigo-700"
                          : "text-gray-500 hover:bg-gray-50"
                      }`}
                    >
                      None
                    </button>
                    {roles.map((role) => (
                      <button
                        key={role.id}
                        onClick={() => handleAssignRole(member.id, role.id)}
                        className={`w-full text-left px-3 py-1.5 text-xs rounded ${
                          member.companyRoleId === role.id
                            ? "bg-indigo-100 text-indigo-700"
                            : "text-gray-700 hover:bg-gray-50"
                        }`}
                      >
                        {role.name}
                        <span className="text-gray-400 ml-1">
                          ({role.permissions.length} perms)
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {staff.length === 0 && (
              <div className="p-4 text-sm text-gray-400 text-center">
                No staff found
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Role Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">
                Create Custom Role
              </h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name
              </label>
              <input
                type="text"
                value={newRoleName}
                onChange={(e) => setNewRoleName(e.target.value)}
                placeholder="e.g., Senior Operator"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-1 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                {permissions.map((perm) => (
                  <label
                    key={perm.code}
                    className="flex items-center px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={selectedPerms.has(perm.code)}
                      onChange={() =>
                        togglePerm(perm.code, selectedPerms, setSelectedPerms)
                      }
                      className="mr-2 accent-indigo-600"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        {perm.code}
                      </span>
                      <p className="text-xs text-gray-500">
                        {perm.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-1">
                {selectedPerms.size} of {permissions.length} selected
              </p>
            </div>

            <button
              onClick={handleCreateRole}
              disabled={!newRoleName.trim() || selectedPerms.size === 0}
              className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              Create Role
            </button>
          </div>
        </div>
      )}

      {/* Edit Role Modal */}
      {editingRole && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-xl max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Edit Role</h2>
              <button
                onClick={() => setEditingRole(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Role Name
              </label>
              <input
                type="text"
                value={editRoleName}
                onChange={(e) => setEditRoleName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              />
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Permissions
              </label>
              <div className="space-y-1 max-h-60 overflow-y-auto border border-gray-200 rounded-md p-2 bg-white">
                {permissions.map((perm) => (
                  <label
                    key={perm.code}
                    className="flex items-center px-2 py-1.5 hover:bg-gray-100 rounded cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={editSelectedPerms.has(perm.code)}
                      onChange={() =>
                        togglePerm(
                          perm.code,
                          editSelectedPerms,
                          setEditSelectedPerms,
                        )
                      }
                      className="mr-2 accent-indigo-600"
                    />
                    <div>
                      <span className="text-sm font-semibold text-gray-900">
                        {perm.code}
                      </span>
                      <p className="text-xs text-gray-500">
                        {perm.description}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={handleUpdateRole}
              disabled={!editRoleName.trim()}
              className="w-full py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 text-sm font-medium"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

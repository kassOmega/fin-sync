"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { Trash2, UserPlus, Users } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface StaffMember {
  id: number | string;
  role: string;
  user: {
    name: string;
    email: string;
  };
}

export default function StaffPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: SystemRole.Cashier,
  });
  const [loading, setLoading] = useState(false);

  const fetchStaff = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/staff`);
      setStaff(res.data);
    } catch (error) {
      toast.error("Failed to load staff");
    }
  };

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      await fetchStaff();
      setPageLoading(false);
    };
    load();
  }, [companyId]);

  const handleCreate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/users/staff", {
        ...formData,
        companyId: parseInt(companyId),
      });
      toast.success("Staff member added successfully!");
      setIsModalOpen(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role: SystemRole.Cashier,
      });
      fetchStaff();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to add staff");
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (memberId: number | string) => {
    if (confirm("Remove this staff member from the company?")) {
      try {
        await api.delete(`/companies/${companyId}/staff/${memberId}`);
        toast.success("Staff member removed");
        fetchStaff();
      } catch (error) {
        toast.error("Failed to remove staff");
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
        <h1 className="text-2xl font-bold text-gray-800">Company Staff</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <UserPlus className="h-5 w-5 mr-1" /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staff.map((member) => (
          <div
            key={member.id}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 flex justify-between items-start"
          >
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-gray-100 rounded-full">
                <Users className="h-6 w-6 text-gray-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">
                  {member.user.name}
                </h3>
                <p className="text-sm text-gray-500">{member.user.email}</p>
                <span className="mt-1 inline-block px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs rounded-full font-medium">
                  {member.role}
                </span>
              </div>
            </div>
            <button
              onClick={() => handleRemove(member.id)}
              className="text-red-400 hover:text-red-600"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Add New Staff Member</h2>
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
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
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Role
                </label>
                <select
                  value={formData.role}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      role: e.target.value as SystemRole,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white"
                >
                  <option value={SystemRole.Cashier}>Cashier</option>
                  <option value={SystemRole.Storekeeper}>Storekeeper</option>
                  <option value={SystemRole.OperatorDriver}>
                    Operator/Driver
                  </option>
                  <option value={SystemRole.Sales}>Sales</option>
                  <option value={SystemRole.ProjectManager}>
                    Project Manager
                  </option>
                  <option value={SystemRole.Foreman}>Foreman</option>
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

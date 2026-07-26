"use client";

import api from "@/lib/api";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function CompanyIncomesPage() {
  const { companyId } = useParams();
  const [incomes, setIncomes] = useState([]);
  const [projects, setProjects] = useState([]); // Fetch projects for dropdown
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingIncome, setEditingIncome] = useState(null);
  const [viewingIncome, setViewingIncome] = useState(null);
  const [formData, setFormData] = useState({
    amount: "",
    category: "Sales",
    note: "",
    projectId: "",
  });

  const fetchIncomes = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/incomes`);
      setIncomes(res.data);
    } catch {
      toast.error("Failed to load incomes");
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/projects`);
      setProjects(res.data);
    } catch {
      console.error("Failed to fetch projects for dropdown");
    }
  };

  useEffect(() => {
    fetchIncomes();
    fetchProjects();
  }, [companyId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Convert projectId to integer or null
      const payload = {
        ...formData,
        amount: parseFloat(formData.amount),
        projectId: formData.projectId ? parseInt(formData.projectId) : null,
      };

      if (editingIncome) {
        await api.patch(
          `/companies/${companyId}/incomes/${editingIncome.id}`,
          payload,
        );
        toast.success("Income updated");
      } else {
        await api.post(`/companies/${companyId}/incomes`, payload);
        toast.success("Income added");
      }
      setIsModalOpen(false);
      setEditingIncome(null);
      setFormData({ amount: "", category: "Sales", note: "", projectId: "" });
      fetchIncomes();
    } catch {
      toast.error("Failed to save income");
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Delete this income record?")) {
      try {
        await api.delete(`/companies/${companyId}/incomes/${id}`);
        toast.success("Deleted");
        fetchIncomes();
      } catch {
        toast.error("Failed to delete");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Company Incomes</h1>
        <button
          onClick={() => {
            setEditingIncome(null);
            setFormData({
              amount: "",
              category: "Sales",
              note: "",
              projectId: "",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> Add Income
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Project
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {incomes.map((inc) => (
              <tr key={inc.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(inc.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {inc.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {inc.project?.name || "General"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">
                  ${inc.amount}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setViewingIncome(inc)}
                    className="text-gray-400 hover:text-gray-600 mx-1"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingIncome(inc);
                      setFormData({
                        amount: inc.amount,
                        category: inc.category,
                        note: inc.note || "",
                        projectId: inc.projectId || "",
                      });
                      setIsModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mx-1"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(inc.id)}
                    className="text-red-500 hover:text-red-700 mx-1"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {viewingIncome && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingIncome(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Income Details</h2>
            <div className="space-y-3">
              <p>
                <strong>Amount:</strong>{" "}
                <span className="text-green-600 font-bold">
                  ${viewingIncome.amount}
                </span>
              </p>
              <p>
                <strong>Category:</strong> {viewingIncome.category}
              </p>
              <p>
                <strong>Project:</strong>{" "}
                {viewingIncome.project?.name || "General Income"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(viewingIncome.date).toLocaleString()}
              </p>
              <p>
                <strong>Registered By:</strong>{" "}
                {viewingIncome.user?.name || "Unknown"}
              </p>
              <p>
                <strong>Note:</strong>{" "}
                {viewingIncome.note || "No note provided"}
              </p>
            </div>
            <button
              onClick={() => setViewingIncome(null)}
              className="mt-6 w-full px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200"
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
              {editingIncome ? "Edit Income" : "Add Income"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Amount ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) =>
                    setFormData({ ...formData, amount: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) =>
                    setFormData({ ...formData, category: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option>Sales</option>
                  <option>Milestone</option>
                  <option>Service</option>
                  <option>Rental</option>
                  <option>Misc</option>
                </select>
              </div>
              {/* PROJECT DROPDOWN */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Assign to Project (Optional)
                </label>
                <select
                  value={formData.projectId}
                  onChange={(e) =>
                    setFormData({ ...formData, projectId: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option value="">None (General Income)</option>
                  {projects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Note
                </label>
                <textarea
                  value={formData.note}
                  onChange={(e) =>
                    setFormData({ ...formData, note: e.target.value })
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

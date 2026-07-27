"use client";

import api from "@/lib/api";
import { useOfflineQueueStore } from "@/store/offlineQueueStore";
import { Eye, Pencil, Plus, Trash2, WifiOff } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Expense {
  id: number | string;
  amount: number;
  category: string;
  note?: string;
  date: string;
  projectId?: number | null;
  unit?: string;
  project?: { id: number; name: string };
  user?: { name: string };
}

interface Project {
  id: number;
  name: string;
}

interface Unit {
  id: number;
  name: string;
}

export default function CompanyExpensesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const addToQueue = useOfflineQueueStore((state) => state.addToQueue);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Expense | null>(null);
  const [viewingExp, setViewingExp] = useState<Expense | null>(null);
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    note: "",
    projectId: "",
    unitId: "",
    isRecurring: false,
    recurringFrequency: "MONTHLY",
  });

  const fetchExpenses = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/expenses`);
      setExpenses(res.data);
    } catch {
      toast.error("Failed to load expenses");
    }
  };

  const fetchProjects = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/projects`);
      setProjects(res.data);
    } catch {
      console.error("Failed to fetch projects");
    }
  };

  const fetchUnits = async () => {
    try {
      // Change URL
      const res = await api.get("/measuring-units");
      setUnits(res.data);
    } catch {
      console.error("Failed to fetch units");
    }
  };

  useEffect(() => {
    fetchExpenses();
    fetchProjects();
    fetchUnits();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload = {
      ...formData,
      amount: parseFloat(formData.amount),
      projectId: formData.projectId ? parseInt(formData.projectId) : null,
      unitId: formData.unitId ? parseInt(formData.unitId) : null,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring
        ? formData.recurringFrequency
        : null,
    };

    try {
      if (editingExp) {
        await api.patch(
          `/companies/${companyId}/expenses/${editingExp.id}`,
          payload,
        );
        toast.success("Expense updated");
      } else {
        await api.post(`/companies/${companyId}/expenses`, payload);
        toast.success("Expense logged");
      }
      setIsModalOpen(false);
      setEditingExp(null);
      setFormData({
        amount: "",
        category: "Fuel",
        note: "",
        projectId: "",
        unit: "",
      });
      fetchExpenses();
    } catch (error) {
      if (!navigator.onLine && !editingExp) {
        addToQueue({ ...payload, companyId: parseInt(companyId) });
        setIsModalOpen(false);
        setFormData({
          amount: "",
          category: "Fuel",
          note: "",
          projectId: "",
          unit: "",
        });
      } else {
        toast.error("Failed to save expense");
      }
    }
  };

  const handleDelete = async (id: number | string) => {
    if (confirm("Delete this expense?")) {
      try {
        await api.delete(`/companies/${companyId}/expenses/${id}`);
        toast.success("Deleted");
        fetchExpenses();
      } catch {
        toast.error("Failed to delete");
      }
    }
  };

  const handleAddNewUnit = async () => {
    const newUnit = prompt(
      "Enter new measuring unit name (e.g., liters, bags):",
    );
    if (newUnit) {
      try {
        // Change URL
        const res = await api.post("/measuring-units", { name: newUnit });
        setUnits([...units, res.data]);
        setFormData({ ...formData, unit: res.data.name });
        toast.success("Unit added!");
      } catch {
        toast.error("Failed to add unit");
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Company Expenses</h1>
        <button
          onClick={() => {
            setEditingExp(null);
            setFormData({
              amount: "",
              category: "Fuel",
              note: "",
              projectId: "",
              unit: "",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> Add Expense
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
            {expenses.map((exp) => (
              <tr key={exp.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {new Date(exp.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {exp.category}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {exp.project?.name || "General"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-red-600">
                  ${exp.amount}{" "}
                  {exp.unit && (
                    <span className="text-gray-400 font-normal">
                      ({exp.unit})
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <button
                    onClick={() => setViewingExp(exp)}
                    className="text-gray-400 hover:text-gray-600 mx-1"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingExp(exp);
                      setFormData({
                        amount: String(exp.amount),
                        category: exp.category,
                        note: exp.note || "",
                        projectId: exp.projectId ? String(exp.projectId) : "",
                        unit: exp.unit || "",
                      });
                      setIsModalOpen(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-900 mx-1"
                  >
                    <Pencil className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(exp.id)}
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

      {viewingExp && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setViewingExp(null)}
        >
          <div
            className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold mb-4">Expense Details</h2>
            <div className="space-y-3">
              <p>
                <strong>Amount:</strong>{" "}
                <span className="text-red-600 font-bold">
                  ${viewingExp.amount}
                </span>{" "}
                {viewingExp.unit && `(${viewingExp.unit})`}
              </p>
              <p>
                <strong>Category:</strong> {viewingExp.category}
              </p>
              <p>
                <strong>Project:</strong>{" "}
                {viewingExp.project?.name || "General Expense"}
              </p>
              <p>
                <strong>Date:</strong>{" "}
                {new Date(viewingExp.date).toLocaleString()}
              </p>
              <p>
                <strong>Registered By:</strong>{" "}
                {viewingExp.user?.name || "Unknown"}
              </p>
              <p>
                <strong>Note:</strong> {viewingExp.note || "No note provided"}
              </p>
            </div>
            <button
              onClick={() => setViewingExp(null)}
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
              {editingExp ? "Edit Expense" : "Add Expense"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
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
                    Measuring Unit (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <select
                      value={formData.unit}
                      onChange={(e) =>
                        setFormData({ ...formData, unit: e.target.value })
                      }
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                    >
                      <option value="">None</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.name}>
                          {u.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={handleAddNewUnit}
                      className="mt-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm whitespace-nowrap"
                    >
                      + Add
                    </button>
                  </div>
                </div>
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
                  <option>Fuel</option>
                  <option>Salary</option>
                  <option>Materials</option>
                  <option>Rent</option>
                  <option>Utilities</option>
                  <option>Maintenance</option>
                  <option>Misc</option>
                </select>
              </div>
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
                  <option value="">None (General Expense)</option>
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
              <div className="flex items-center space-x-2 pt-2">
                <input
                  type="checkbox"
                  id="isRecurring"
                  checked={formData.isRecurring}
                  onChange={(e) =>
                    setFormData({ ...formData, isRecurring: e.target.checked })
                  }
                  className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                />
                <label htmlFor="isRecurring" className="text-sm text-gray-700">
                  Make this a recurring expense
                </label>
              </div>

              {formData.isRecurring && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Frequency
                  </label>
                  <select
                    value={formData.recurringFrequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        recurringFrequency: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                  >
                    <option value="MONTHLY">Monthly (on this day)</option>
                  </select>
                </div>
              )}

              {!navigator.onLine && (
                <div className="flex items-center text-amber-600 text-sm bg-amber-50 p-2 rounded-md">
                  <WifiOff className="h-4 w-4 mr-2" /> You are offline. This
                  will be synced later.
                </div>
              )}
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

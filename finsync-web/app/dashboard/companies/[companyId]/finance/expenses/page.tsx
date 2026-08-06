"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
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
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatAccountId, setNewCatAccountId] = useState("");
  const [editingExp, setEditingExp] = useState<Expense | null>(null);
  const [viewingExp, setViewingExp] = useState<Expense | null>(null);
  const [accounts, setAccounts] = useState<
    { id: number; code: string; name: string; type: string }[]
  >([]);
  const [formData, setFormData] = useState({
    amount: "",
    category: "",
    note: "",
    projectId: "",
    unitId: "",
    unit: "",
    accountId: "",
    isRecurring: false,
    recurringFrequency: "MONTHLY",
  });

  const fetchAccounts = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/accounts`);
      setAccounts(res.data || []);
    } catch {
      /* fallback */
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/expenses/categories`);
      setCategories(res.data);
    } catch {
      /* fallback to empty */
    }
  };

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
      /* silent */
    }
  };

  const fetchUnits = async () => {
    try {
      const res = await api.get("/measuring-units");
      setUnits(res.data);
    } catch {
      /* silent */
    }
  };

  const [projectFilter, setProjectFilter] = useState("");
  const filteredExpenses = projectFilter
    ? expenses.filter((exp) => String(exp.projectId) === projectFilter)
    : expenses;

  useEffect(() => {
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    const load = async () => {
      setPageLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchExpenses(),
        fetchProjects(),
        fetchUnits(),
        fetchAccounts(),
      ]);
      setPageLoading(false);
    };
    load();
  }, [companyId, router]);

  if (!companyId) {
    return null;
  }

  const handleAddCategory = async () => {
    if (!newCatName.trim()) return;
    if (categories.includes(newCatName.trim())) {
      toast.error("Item Category already exists");
      return;
    }
    // Persist the category → COA account binding (auto-resolves ledger account)
    try {
      await api.post(`/companies/${companyId}/accounts/category-bindings`, {
        category: newCatName.trim(),
        accountId: newCatAccountId ? parseInt(newCatAccountId) : undefined,
      });
      toast.success("Item Category created & linked");
    } catch {
      toast.error("Failed to link account — category saved locally");
    }
    setCategories([...categories, newCatName.trim()]);
    setFormData({ ...formData, category: newCatName.trim() });
    setIsAddingCategory(false);
    setNewCatName("");
    setNewCatAccountId("");
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const payload: Record<string, unknown> = {
      category: formData.category,
      amount: parseFloat(formData.amount),
      note: formData.note,
      projectId: formData.projectId ? parseInt(formData.projectId) : null,
      unit: formData.unit || undefined,
      isRecurring: formData.isRecurring,
      recurringFrequency: formData.isRecurring
        ? formData.recurringFrequency
        : null,
      accountId: formData.accountId ? parseInt(formData.accountId) : undefined,
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
        ...formData,
        amount: "",
        category: "",
        note: "",
        projectId: "",
        unit: "",
      });
      fetchExpenses();
      fetchCategories();
    } catch {
      toast.error("Failed to save expense");
    }
  };

  const handleDelete = async (id: number | string) => {
    if (confirm("Delete this expense?")) {
      try {
        await api.delete(`/companies/${companyId}/expenses/${id}`);
        toast.success("Deleted");
        fetchExpenses();
        fetchCategories();
      } catch {
        toast.error("Failed to delete");
      }
    }
  };

  if (pageLoading) {
    return <Loading />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Company Expenses</h1>
        <button
          onClick={() => {
            setEditingExp(null);
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> Add Expense
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-4">
        <select
          value={projectFilter}
          onChange={(e) => setProjectFilter(e.target.value)}
          className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-md bg-white text-gray-900"
        >
          <option value="">All Projects</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <th className="text-left px-4 py-3 font-medium">Date</th>
                  <th className="text-left px-4 py-3 font-medium">Category</th>
                  <th className="text-left px-4 py-3 font-medium hidden sm:table-cell">Project</th>
                  <th className="text-left px-4 py-3 font-medium">Amount</th>
                  <th className="text-right px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredExpenses.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500 text-xs sm:text-sm">
                      No expenses recorded yet.
                    </td>
                  </tr>
                ) : (
                  filteredExpenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-gray-50 text-gray-900">
                      <td className="px-4 py-3 text-xs sm:text-sm">
                        {new Date(exp.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm">
                        {exp.category}
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                        {exp.project?.name || "—"}
                      </td>
                      <td className="px-4 py-3 text-xs sm:text-sm font-medium text-red-600">
                        ${exp.amount}{" "}
                        {exp.unit && (
                          <span className="text-gray-400 font-normal">
                            ({exp.unit})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => setViewingExp(exp)} className="text-gray-400 hover:text-gray-600 mx-1">
                          <Eye className="h-5 w-5" />
                        </button>
                        <button onClick={() => { setEditingExp(exp); setFormData({ amount: String(exp.amount), category: exp.category, note: exp.note || "", projectId: exp.projectId ? String(exp.projectId) : "", unitId: "", unit: exp.unit || "", accountId: "", isRecurring: false, recurringFrequency: "MONTHLY" }); setIsModalOpen(true); }} className="text-indigo-600 hover:text-indigo-900 mx-1">
                          <Pencil className="h-5 w-5" />
                        </button>
                        <button onClick={() => handleDelete(exp.id)} className="text-red-500 hover:text-red-700 mx-1">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
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
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Category
                </label>
                <div className="flex space-x-2">
                  <select
                    required
                    value={formData.category}
                    onChange={(e) =>
                      setFormData({ ...formData, category: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                  >
                    <option value="">Select item category</option>
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => setIsAddingCategory(true)}
                    className="mt-1 px-3 py-2 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 text-sm whitespace-nowrap"
                  >
                    + Add
                  </button>
                </div>
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

      {isAddingCategory && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">Add Item Category</h2>
            <input
              type="text"
              value={newCatName}
              onChange={(e) => setNewCatName(e.target.value)}
              placeholder="Item category name"
              className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
            />
            <div className="mt-3">
              <label className="block text-sm font-medium text-gray-700">
                Link to COA Account (auto-applies to ledger)
              </label>
              <select
                value={newCatAccountId}
                onChange={(e) => setNewCatAccountId(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
              >
                <option value="">Default (Misc Expense)</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.code} — {a.name} ({a.type})
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => setIsAddingCategory(false)}
                className="px-4 py-2 text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleAddCategory}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

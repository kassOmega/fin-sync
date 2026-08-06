"use client";
import Loading from "@/components/Loading";
import api from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Expense {
  id: number;
  amount: number;
  category: string;
  note?: string;
  date: string;
  user?: { name: string };
}

export default function CompanyExpensesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ amount: "", category: "", note: "" });

  const fetchAll = async () => {
    try {
      const r = await api.get(`/companies/${companyId}/expenses`);
      setExpenses(r.data);
    } catch {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    fetchAll();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/companies/${companyId}/expenses`, form);
      toast.success("Added");
      setModalOpen(false);
      setForm({ amount: "", category: "", note: "" });
      fetchAll();
    } catch {
      toast.error("Failed");
    }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    try {
      await api.delete(`/companies/${companyId}/expenses/${id}`);
      toast.success("Deleted");
      fetchAll();
    } catch {
      toast.error("Failed");
    }
  };

  if (loading) return <Loading />;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Expenses</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Expense
        </button>
      </div>
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="max-h-[60vh] overflow-y-auto">
            <table className="w-full text-xs sm:text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {expenses.map((e) => (
              <tr key={e.id} className="hover:bg-gray-50 text-gray-900">
                <td className="px-4 py-3 text-sm text-gray-900">
                  {new Date(e.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-sm text-gray-900">
                  {e.category}
                </td>
                <td className="px-4 py-3 text-sm text-right font-medium text-red-600">
                  ${e.amount}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => handleDelete(e.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
          </div>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">
              Add Expense
            </h2>
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="number"
                step="0.01"
                required
                placeholder="Amount"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
              />
              <input
                required
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
              />
              <input
                placeholder="Note"
                value={form.note}
                onChange={(e) => setForm({ ...form, note: e.target.value })}
                className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
              />
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md"
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

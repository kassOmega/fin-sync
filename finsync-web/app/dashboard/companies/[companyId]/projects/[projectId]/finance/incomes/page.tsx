"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { Plus, Trash2 } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Income {
  id: number;
  amount: number;
  category: string;
  quantity?: number;
  unit?: string;
  note?: string;
  date: string;
}

export default function ProjectIncomesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [units, setUnits] = useState<string[]>([]);
  const [newUnit, setNewUnit] = useState("");
  const [form, setForm] = useState({
    amount: "",
    category: "",
    quantity: "1",
    unit: "pcs",
    note: "",
  });

  const fetchAll = async () => {
    try {
      const [iRes, uRes] = await Promise.all([
        api.get(`/companies/${companyId}/projects/${projectId}/incomes`),
        api.get(`/measuring-units`),
      ]);
      setIncomes(iRes.data);
      setUnits(
        Array.isArray(uRes.data)
          ? uRes.data.map((u: any) => u.name || u)
          : ["pcs", "hrs", "kg", "m", "L", "box"],
      );
    } catch {
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    if (!companyId || !projectId) {
      router.push("/dashboard/companies");
      return;
    }
    fetchAll();
  }, []);

  const handleAddUnit = async () => {
    if (!newUnit.trim()) return;
    try {
      await api.post(`/measuring-units`, { name: newUnit.trim() });
      toast.success("Unit added");
      setNewUnit("");
      const u = await api.get(`/measuring-units`);
      setUnits(u.data.map((x: any) => x.name || x));
    } catch {
      toast.error("Failed");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(
        `/companies/${companyId}/projects/${projectId}/incomes`,
        form,
      );
      toast.success("Added");
      setModalOpen(false);
      setForm({
        amount: "",
        category: "",
        quantity: "1",
        unit: "pcs",
        note: "",
      });
      fetchAll();
    } catch {
      toast.error("Failed");
    }
  };
  const handleDelete = async (id: number) => {
    if (!confirm("Delete?")) return;
    try {
      await api.delete(
        `/companies/${companyId}/projects/${projectId}/incomes/${id}`,
      );
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
        <h2 className="text-xl font-bold text-gray-900">Project Incomes</h2>
        <button
          onClick={() => setModalOpen(true)}
          className="flex items-center px-3 py-1.5 bg-indigo-600 text-white rounded-md text-sm"
        >
          <Plus className="h-4 w-4 mr-1" /> Add Income
        </button>
      </div>
      <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Date
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Category
              </th>
              <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Qty
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Unit
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
            {incomes.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                  No incomes recorded.
                </td>
              </tr>
            ) : (
              incomes.map((inc) => (
                <tr key={inc.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {new Date(inc.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">
                    {inc.category}
                  </td>
                  <td className="px-4 py-3 text-sm font-medium text-right text-gray-900">
                    {inc.quantity || 1}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {inc.unit || "—"}
                  </td>
                  <td className="px-4 py-3 text-sm text-right font-medium text-green-600">
                    ${inc.amount}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(inc.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Add Income</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Category *
                </label>
                <input
                  required
                  placeholder="e.g. Sales, Investment"
                  value={form.category}
                  onChange={(e) =>
                    setForm({ ...form, category: e.target.value })
                  }
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm({ ...form, quantity: e.target.value })
                    }
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit
                  </label>
                  <select
                    value={form.unit}
                    onChange={(e) => {
                      if (e.target.value === "__add__") return;
                      setForm({ ...form, unit: e.target.value });
                    }}
                    className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                  >
                    {units.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                    <option disabled>─────────</option>
                    <option value="__add__" className="text-indigo-600">
                      + Add new unit...
                    </option>
                  </select>
                  {form.unit === "__add__" && (
                    <div className="mt-2 bg-indigo-50 p-2 rounded flex space-x-2">
                      <input
                        placeholder="e.g. ton"
                        value={newUnit}
                        onChange={(e) => setNewUnit(e.target.value)}
                        className="flex-1 border border-gray-300 rounded p-1.5 text-sm bg-white text-gray-900"
                      />
                      <button
                        type="button"
                        onClick={handleAddUnit}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded text-sm whitespace-nowrap"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Unit Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={form.amount}
                  onChange={(e) => setForm({ ...form, amount: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Note (optional)
                </label>
                <input
                  placeholder="Description"
                  value={form.note}
                  onChange={(e) => setForm({ ...form, note: e.target.value })}
                  className="w-full border border-gray-300 rounded p-2 text-sm bg-white text-gray-900"
                />
              </div>
              <div className="bg-gray-50 p-3 rounded text-right">
                <p className="text-sm text-gray-500">
                  Total:{" "}
                  <span className="text-lg font-bold text-gray-900">
                    $
                    {(
                      parseFloat(form.amount || "0") *
                      parseInt(form.quantity || "1")
                    ).toFixed(2)}
                  </span>
                </p>
              </div>
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
                  className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
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

"use client";

import api from "@/lib/api";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Employee {
  id: number | string;
  name: string;
  employmentType: string;
  wage: number | null;
  nextPayDate: string | null;
}

export default function EmployeesPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [pageLoading, setPageLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    employmentType: "PERMANENT",
    wage: "",
    nextPayDate: "",
  });

  const fetchEmployees = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/employees`);
      setEmployees(res.data);
    } catch (error) {
      toast.error("Failed to load employees");
    }
  };

  useEffect(() => {
    const load = async () => {
      setPageLoading(true);
      await fetchEmployees();
      setPageLoading(false);
    };
    load();
  }, [companyId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        employmentType: formData.employmentType,
        wage: formData.wage ? parseFloat(formData.wage) : null,
        nextPayDate: formData.nextPayDate
          ? new Date(formData.nextPayDate).toISOString()
          : null,
      };

      if (editingEmp) {
        await api.patch(
          `/companies/${companyId}/employees/${editingEmp.id}`,
          payload,
        );
        toast.success("Employee updated");
      } else {
        await api.post(`/companies/${companyId}/employees`, payload);
        toast.success("Employee added");
      }
      setIsModalOpen(false);
      setEditingEmp(null);
      setFormData({
        name: "",
        employmentType: "PERMANENT",
        wage: "",
        nextPayDate: "",
      });
      fetchEmployees();
    } catch (error) {
      toast.error("Failed to save employee");
    }
  };

  const handleEdit = (emp: Employee) => {
    setEditingEmp(emp);
    setFormData({
      name: emp.name,
      employmentType: emp.employmentType,
      wage: emp.wage ? String(emp.wage) : "",
      nextPayDate: emp.nextPayDate
        ? new Date(emp.nextPayDate).toISOString().split("T")[0]
        : "",
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number | string) => {
    if (confirm("Delete this employee?")) {
      try {
        await api.delete(`/companies/${companyId}/employees/${id}`);
        toast.success("Employee deleted");
        fetchEmployees();
      } catch {
        toast.error("Failed to delete employee");
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
        <h1 className="text-2xl font-bold text-gray-800">Employees</h1>
        <button
          onClick={() => {
            setEditingEmp(null);
            setFormData({
              name: "",
              employmentType: "PERMANENT",
              wage: "",
              nextPayDate: "",
            });
            setIsModalOpen(true);
          }}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          <Plus className="h-5 w-5 mr-1" /> Add Employee
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Name
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Wage
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                Next Pay
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {employees.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  No employees added yet.
                </td>
              </tr>
            ) : (
              employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {emp.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {emp.employmentType}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {emp.wage ? `$${emp.wage}` : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {emp.nextPayDate
                      ? new Date(emp.nextPayDate).toLocaleDateString()
                      : "—"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(emp)}
                      className="text-indigo-600 hover:text-indigo-900 mx-1"
                    >
                      <Pencil className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(emp.id)}
                      className="text-red-500 hover:text-red-700 mx-1"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">
              {editingEmp ? "Edit Employee" : "Add Employee"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Employment Type
                </label>
                <select
                  value={formData.employmentType}
                  onChange={(e) =>
                    setFormData({ ...formData, employmentType: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                >
                  <option value="PERMANENT">Permanent</option>
                  <option value="DAILY_LABORER">Daily Laborer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Wage ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.wage}
                  onChange={(e) =>
                    setFormData({ ...formData, wage: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Next Pay Date
                </label>
                <input
                  type="date"
                  value={formData.nextPayDate}
                  onChange={(e) =>
                    setFormData({ ...formData, nextPayDate: e.target.value })
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

"use client";

import api from "@/lib/api";
import { ArrowRight, Building2, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

export default function CompaniesPage() {
  const [companies, setCompanies] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchCompanies = async () => {
    try {
      const res = await api.get("/companies");
      setCompanies(res.data);
    } catch (error) {
      toast.error("Failed to fetch companies");
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post("/companies", { name, industry });
      toast.success("Company created successfully!");
      setIsModalOpen(false);
      setName("");
      setIndustry("");
      fetchCompanies();
    } catch (error) {
      toast.error("Failed to create company");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Your Companies</h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-5 w-5 mr-1" /> New Company
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <Link
            href={`/dashboard/companies/${company.id}`}
            key={company.id}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 transition-all group"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 bg-indigo-50 rounded-lg">
                <Building2 className="h-8 w-8 text-indigo-600" />
              </div>
              <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {company.name}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {company.industry || "General Business"}
            </p>
            <div className="mt-4 flex space-x-4 text-sm text-gray-600">
              <span>{company._count?.members || 0} Staff</span>
              <span>{company._count?.expenses || 0} Expenses</span>
            </div>
          </Link>
        ))}
      </div>

      {/* Create Company Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <h2 className="text-xl font-bold mb-4">Create New Company</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Industry (Optional)
                </label>
                <input
                  type="text"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

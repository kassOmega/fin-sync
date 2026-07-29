"use client";

import api from "@/lib/api";
import {
  ArrowLeft,
  Boxes,
  DollarSign,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface InventoryItem {
  id: number;
  name: string;
  category: string;
  quantity: number;
  sellingPrice: number;
  costPrice: number;
  unit: string;
  totalSold: number;
  totalPurchased: number;
  saleRevenue: number;
  purchaseCost: number;
  profitMargin: number;
}

export default function InventoryReportPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  useEffect(() => {
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    const fetchData = async () => {
      try {
        const res = await api.get(`/companies/${companyId}/reports/inventory`);
        setItems(res.data);
      } catch {
        console.error("Failed to fetch inventory report");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [companyId, router]);

  if (!companyId) {
    return null;
  }

  const categories = [...new Set(items.map((i) => i.category)).values()].sort();
  const totalValue = items.reduce((s, i) => s + i.quantity * i.sellingPrice, 0);
  const totalCost = items.reduce((s, i) => s + i.quantity * i.costPrice, 0);
  const totalStock = items.reduce((s, i) => s + i.quantity, 0);

  let filtered = categoryFilter
    ? items.filter((i) => i.category === categoryFilter)
    : items;

  filtered = [...filtered].sort((a, b) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const aVal = (a as any)[sortField];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const bVal = (b as any)[sortField];
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "asc" ? aVal - bVal : bVal - aVal;
    }
    const aStr = String(aVal || "");
    const bStr = String(bVal || "");
    return sortDir === "asc"
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr);
  });

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("asc");
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/dashboard/companies/${companyId}/reports`}
          className="p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Inventory Report</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Boxes className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Items</p>
              <p className="text-xl font-bold text-gray-800">{items.length}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <Boxes className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Stock</p>
              <p className="text-xl font-bold text-gray-800">{totalStock}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Stock Value (Sell)</p>
              <p className="text-xl font-bold text-green-600">
                ${totalValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-orange-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Stock Cost</p>
              <p className="text-xl font-bold text-orange-600">
                ${totalCost.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex items-center space-x-3">
        <label className="text-sm font-medium text-gray-700">Filter:</label>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="border border-gray-300 rounded-md p-2 bg-white text-sm"
        >
          <option value="">All Categories</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  { key: "name", label: "Item" },
                  { key: "category", label: "Category" },
                  { key: "quantity", label: "Stock" },
                  { key: "costPrice", label: "Cost" },
                  { key: "sellingPrice", label: "Price" },
                  { key: "totalSold", label: "Sold" },
                  { key: "totalPurchased", label: "Purchased" },
                  { key: "profitMargin", label: "Margin" },
                ].map((col) => (
                  <th
                    key={col.key}
                    onClick={() => toggleSort(col.key)}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  >
                    {col.label}
                    {sortField === col.key && (
                      <span className="ml-1">
                        {sortDir === "asc" ? "↑" : "↓"}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No inventory data.
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`font-semibold ${item.quantity <= 5 ? "text-red-600" : "text-gray-900"}`}
                      >
                        {item.quantity} {item.unit}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ${item.costPrice}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      ${item.sellingPrice}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center text-green-600">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {item.totalSold}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className="flex items-center text-blue-600">
                        <TrendingDown className="h-3 w-3 mr-1" />
                        {item.totalPurchased}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm font-medium">
                      <span
                        className={
                          item.profitMargin >= 0
                            ? "text-green-600"
                            : "text-red-600"
                        }
                      >
                        ${item.profitMargin.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

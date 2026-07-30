"use client";

import Loading from "@/components/Loading";

import api from "@/lib/api";
import { ArrowLeft, DollarSign, ShoppingCart, Truck } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#AF19FF",
  "#FF1744",
];

interface PurchaseItemDetail {
  itemName: string;
  category: string;
  quantity: number;
  unitCost: number;
  total: number;
}

interface PurchaseDetail {
  id: number;
  date: string;
  totalAmount: number;
  note: string | null;
  supplier: string;
  registeredBy: string;
  items: PurchaseItemDetail[];
}

interface PurchasesReport {
  summary: {
    totalSpent: number;
    totalItemsPurchased: number;
    purchaseCount: number;
    averagePurchaseValue: number;
  };
  purchasesByCategory: Record<string, number>;
  purchasesBySupplier: Record<string, { count: number; total: number }>;
  purchases: PurchaseDetail[];
}

export default function PurchasesReportPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const [report, setReport] = useState<PurchasesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedPurchase, setExpandedPurchase] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/companies/${companyId}/reports/purchases`);
        setReport(res.data);
      } catch {
        console.error("Failed to fetch purchases report");
      } finally {
        setLoading(false);
      }
    };
    if (!companyId) {
      router.push("/dashboard/companies");
      return;
    }
    fetchData();
  }, [companyId, router]);

  if (!companyId) {
    return null;
  }

  if (loading) return <Loading />;

  if (!report) {
    return (
      <div className="text-center py-20 text-gray-500">No data available.</div>
    );
  }

  const categoryPieData = Object.entries(report.purchasesByCategory).map(
    ([name, value]) => ({ name, value }),
  );
  const supplierBarData = Object.entries(report.purchasesBySupplier).map(
    ([name, data]) => ({
      name,
      total: data.total,
      count: data.count,
    }),
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link
          href={`/dashboard/companies/${companyId}/reports`}
          className="p-2 bg-white rounded-md border border-gray-200 hover:bg-gray-50"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </Link>
        <h1 className="text-2xl font-bold text-gray-800">Purchase Report</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-red-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Spent</p>
              <p className="text-xl font-bold text-red-600">
                ${report.summary.totalSpent.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <ShoppingCart className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Purchases</p>
              <p className="text-xl font-bold text-gray-800">
                {report.summary.purchaseCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Truck className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Items Purchased</p>
              <p className="text-xl font-bold text-gray-800">
                {report.summary.totalItemsPurchased}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-purple-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-purple-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Avg Purchase</p>
              <p className="text-xl font-bold text-purple-600">
                ${report.summary.averagePurchaseValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Purchases by Category
          </h3>
          {categoryPieData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryPieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-20">No data</p>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Purchases by Supplier
          </h3>
          {supplierBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={supplierBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#f59e0b" name="Total ($)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-20">No data</p>
          )}
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <h3 className="text-lg font-medium text-gray-800 p-4 border-b">
          All Purchases
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  By
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {report.purchases.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No purchase data.
                  </td>
                </tr>
              ) : (
                report.purchases.map((purchase) => (
                  <>
                    <tr key={purchase.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(purchase.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {purchase.supplier}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {purchase.items.length} item(s)
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-red-600">
                        ${purchase.totalAmount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {purchase.registeredBy}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() =>
                            setExpandedPurchase(
                              expandedPurchase === purchase.id
                                ? null
                                : purchase.id,
                            )
                          }
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                        >
                          {expandedPurchase === purchase.id ? "Hide" : "View"}{" "}
                          items
                        </button>
                      </td>
                    </tr>
                    {expandedPurchase === purchase.id && (
                      <tr key={`${purchase.id}-items`}>
                        <td colSpan={6} className="px-4 py-3 bg-gray-50">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-500">
                                <th className="text-left py-1">Item</th>
                                <th className="text-left py-1">Category</th>
                                <th className="text-left py-1">Qty</th>
                                <th className="text-left py-1">Cost</th>
                                <th className="text-left py-1">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {purchase.items.map((item, i) => (
                                <tr key={i}>
                                  <td className="py-1 text-gray-900">
                                    {item.itemName}
                                  </td>
                                  <td className="py-1 text-gray-500">
                                    {item.category}
                                  </td>
                                  <td className="py-1 text-gray-700">
                                    {item.quantity}
                                  </td>
                                  <td className="py-1 text-gray-700">
                                    ${item.unitCost}
                                  </td>
                                  <td className="py-1 font-medium text-gray-900">
                                    ${item.total}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

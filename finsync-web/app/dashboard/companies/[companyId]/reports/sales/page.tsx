"use client";

import Loading from "@/components/Loading";

import api from "@/lib/api";
import { ArrowLeft, DollarSign, ShoppingCart, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
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

interface SaleItemDetail {
  itemName: string;
  category: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface SaleDetail {
  id: number;
  date: string;
  totalAmount: number;
  discount: number;
  note: string | null;
  customer: string;
  registeredBy: string;
  items: SaleItemDetail[];
}

interface SalesReport {
  summary: {
    totalRevenue: number;
    totalDiscount: number;
    totalItemsSold: number;
    saleCount: number;
    averageSaleValue: number;
  };
  salesByCategory: Record<string, number>;
  salesByCustomer: Record<string, { count: number; total: number }>;
  sales: SaleDetail[];
}

export default function SalesReportPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const router = useRouter();
  const [report, setReport] = useState<SalesReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSale, setExpandedSale] = useState<number | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/companies/${companyId}/reports/sales`);
        setReport(res.data);
      } catch {
        console.error("Failed to fetch sales report");
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

  const categoryPieData = Object.entries(report.salesByCategory).map(
    ([name, value]) => ({ name, value }),
  );
  const customerBarData = Object.entries(report.salesByCustomer).map(
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
        <h1 className="text-2xl font-bold text-gray-800">Sales Report</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-50 rounded-lg">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Revenue</p>
              <p className="text-xl font-bold text-green-600">
                ${report.summary.totalRevenue.toLocaleString()}
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
              <p className="text-xs text-gray-500">Sales</p>
              <p className="text-xl font-bold text-gray-800">
                {report.summary.saleCount}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-5 rounded-lg shadow-sm border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-50 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Items Sold</p>
              <p className="text-xl font-bold text-gray-800">
                {report.summary.totalItemsSold}
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
              <p className="text-xs text-gray-500">Discounts</p>
              <p className="text-xl font-bold text-orange-600">
                ${report.summary.totalDiscount.toLocaleString()}
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
              <p className="text-xs text-gray-500">Avg Sale</p>
              <p className="text-xl font-bold text-purple-600">
                ${report.summary.averageSaleValue.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h3 className="text-lg font-medium text-gray-800 mb-4">
            Sales by Category
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
            Sales by Customer
          </h3>
          {customerBarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={customerBarData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="total" fill="#6366f1" name="Revenue ($)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-gray-500 text-center py-20">No data</p>
          )}
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
        <h3 className="text-lg font-medium text-gray-800 p-4 border-b">
          All Sales
        </h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Customer
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
              {report.sales.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-gray-500"
                  >
                    No sales data.
                  </td>
                </tr>
              ) : (
                report.sales.map((sale) => (
                  <React.Fragment key={sale.id}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {new Date(sale.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {sale.customer}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {sale.items.length} item(s)
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-green-600">
                        ${sale.totalAmount.toLocaleString()}
                        {sale.discount > 0 && (
                          <span className="text-xs text-gray-400 ml-1">
                            (-${sale.discount})
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {sale.registeredBy}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <button
                          onClick={() =>
                            setExpandedSale(
                              expandedSale === sale.id ? null : sale.id,
                            )
                          }
                          className="text-indigo-600 hover:text-indigo-800 text-xs font-medium"
                        >
                          {expandedSale === sale.id ? "Hide" : "View"} items
                        </button>
                      </td>
                    </tr>
                    {expandedSale === sale.id && (
                      <tr key={`${sale.id}-items`}>
                        <td colSpan={6} className="px-4 py-3 bg-gray-50">
                          <table className="min-w-full text-sm">
                            <thead>
                              <tr className="text-xs text-gray-500">
                                <th className="text-left py-1">Item</th>
                                <th className="text-left py-1">Category</th>
                                <th className="text-left py-1">Qty</th>
                                <th className="text-left py-1">Price</th>
                                <th className="text-left py-1">Total</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.items.map((item, i) => (
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
                                    ${item.unitPrice}
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
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

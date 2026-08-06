"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { Play, Plus, Settings2 } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface NBVItem {
  id: number;
  name: string;
  code?: string | null;
  purchaseCost: number;
  residualValue: number;
  method: string;
  accumulatedDepreciation: number;
  netBookValue: number;
}

interface DepSchedule {
  id: number;
  machineryId: number;
  startDate: string;
  endDate: string;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  netBookValue: number;
  status: string;
  machinery?: { id: number; name: string; code?: string | null };
}

interface DepMethod {
  id: number;
  name: string;
  type: string;
  defaultRate: number;
  defaultUsefulLifeYears: number;
  isActive: boolean;
}

interface Machine {
  id: number;
  name: string;
  code?: string | null;
  type?: string;
  depreciationEnabled?: boolean;
  purchaseDate?: string | null;
  purchaseCost?: number | null;
  residualValue?: number | null;
  usefulLifeYears?: number | null;
}

type Tab = "nbv" | "schedules" | "methods" | "machinery";

const TAB_LIST: [Tab, string][] = [
  ["nbv", "Net Book Value"],
  ["schedules", "Schedules"],
  ["methods", "Methods"],
  ["machinery", "Machinery"],
];

export default function DepreciationsPage() {
  const params = useParams();
  const companyId = params.companyId as string;
  const [tab, setTab] = useState<Tab>("nbv");
  const [loading, setLoading] = useState(true);

  const [nbvItems, setNbvItems] = useState<NBVItem[]>([]);
  const [schedules, setSchedules] = useState<DepSchedule[]>([]);
  const [methods, setMethods] = useState<DepMethod[]>([]);
  const [machines, setMachines] = useState<Machine[]>([]);

  // Month selector for generate/post
  const now = new Date();
  const [month, setMonth] = useState(
    `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`,
  );

  // Add method modal
  const [methodModalOpen, setMethodModalOpen] = useState(false);
  const [methodForm, setMethodForm] = useState({
    name: "",
    type: "STRAIGHT_LINE",
    defaultRate: "20",
    defaultUsefulLifeYears: "5",
  });

  // Enable depreciation modal
  const [depModalOpen, setDepModalOpen] = useState(false);
  const [depMachine, setDepMachine] = useState<Machine | null>(null);
  const [depForm, setDepForm] = useState({
    purchaseDate: "",
    purchaseCost: "",
    residualValue: "0",
    usefulLifeYears: "5",
    depMethodId: "",
  });

  const fetchNBV = async () => {
    try {
      const res = await api.get(
        `/companies/${companyId}/depreciations/net-book-value`,
      );
      setNbvItems(res.data || []);
    } catch {
      setNbvItems([]);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await api.get(
        `/companies/${companyId}/depreciations/schedules`,
      );
      setSchedules(res.data || []);
    } catch {
      setSchedules([]);
    }
  };

  const fetchMethods = async () => {
    try {
      const res = await api.get(
        `/companies/${companyId}/depreciations/methods`,
      );
      setMethods(res.data || []);
    } catch {
      setMethods([]);
    }
  };

  const fetchMachines = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/machineries`);
      setMachines(res.data || []);
    } catch {
      setMachines([]);
    }
  };

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([
        fetchNBV(),
        fetchSchedules(),
        fetchMethods(),
        fetchMachines(),
      ]);
      setLoading(false);
    };
    load();
  }, [companyId]);

  if (loading) return <Loading />;

  const handleGenerate = async () => {
    if (!month) return;
    try {
      const res = await api.post(
        `/companies/${companyId}/depreciations/generate?month=${month}`,
      );
      toast.success(`Generated ${res.data?.generated ?? 0} schedules`);
      fetchSchedules();
    } catch {
      toast.error("Failed to generate");
    }
  };

  const handlePostMonth = async () => {
    if (!month) return;
    if (
      !confirm(
        `Post all PLANNED depreciation for ${month}? This creates GL journal entries.`,
      )
    )
      return;
    try {
      const res = await api.post(
        `/companies/${companyId}/depreciations/post?month=${month}`,
      );
      toast.success(`Posted ${res.data?.posted ?? 0} journals`);
      fetchSchedules();
      fetchNBV();
    } catch {
      toast.error("Failed to post month");
    }
  };

  const handlePostSchedule = async (id: number) => {
    if (
      !confirm(
        "Post this schedule? This creates a GL journal entry (Dr Depreciation Expense / Cr Accumulated Depreciation).",
      )
    )
      return;
    try {
      await api.post(
        `/companies/${companyId}/depreciations/schedules/${id}/post`,
      );
      toast.success("Schedule posted");
      fetchSchedules();
      fetchNBV();
    } catch {
      toast.error("Failed to post schedule");
    }
  };

  const handleCreateMethod = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post(`/companies/${companyId}/depreciations/methods`, {
        name: methodForm.name,
        type: methodForm.type,
        defaultRate: parseFloat(methodForm.defaultRate),
        defaultUsefulLifeYears: parseInt(methodForm.defaultUsefulLifeYears),
      });
      toast.success("Depreciation method added");
      setMethodModalOpen(false);
      setMethodForm({
        name: "",
        type: "STRAIGHT_LINE",
        defaultRate: "20",
        defaultUsefulLifeYears: "5",
      });
      fetchMethods();
    } catch {
      toast.error("Failed to add method");
    }
  };

  const openDepModal = (m: Machine) => {
    setDepMachine(m);
    setDepForm({
      purchaseDate: m.purchaseDate ? String(m.purchaseDate).split("T")[0] : "",
      purchaseCost: m.purchaseCost ? String(m.purchaseCost) : "",
      residualValue: m.residualValue ? String(m.residualValue) : "0",
      usefulLifeYears: m.usefulLifeYears ? String(m.usefulLifeYears) : "5",
      depMethodId: methods[0] ? String(methods[0].id) : "",
    });
    setDepModalOpen(true);
  };

  const handleEnableDep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!depMachine || !depForm.depMethodId) return;
    try {
      await api.patch(
        `/companies/${companyId}/depreciations/machineries/${depMachine.id}`,
        {
          purchaseDate: depForm.purchaseDate || undefined,
          purchaseCost: parseFloat(depForm.purchaseCost),
          residualValue: parseFloat(depForm.residualValue) || 0,
          usefulLifeYears: parseInt(depForm.usefulLifeYears) || undefined,
          depMethodId: parseInt(depForm.depMethodId),
        },
      );
      toast.success("Depreciation enabled");
      setDepModalOpen(false);
      setDepMachine(null);
      fetchMachines();
      fetchNBV();
    } catch {
      toast.error("Failed to enable depreciation");
    }
  };

  const fmtMoney = (n?: number | null) =>
    `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1 max-w-fit">
        {TAB_LIST.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={`px-4 py-2 rounded-md text-sm font-medium ${
              tab === key
                ? "bg-white shadow-sm text-gray-900"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Net Book Value ── */}
      {tab === "nbv" && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              Net Book Value
            </h2>
            <button
              onClick={fetchNBV}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              Refresh
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Machinery
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Code
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Purchase Cost
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Residual
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Method
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Accum Depr
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                    Net Book Value
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {nbvItems.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500 text-xs sm:text-sm"
                    >
                      No depreciation-enabled machinery yet. Enable depreciation
                      from the Machinery tab.
                    </td>
                  </tr>
                ) : (
                  nbvItems.map((n) => (
                    <tr key={n.id} className="hover:bg-gray-50 text-gray-900">
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                        {n.name}
                      </td>
                      <td className="px-4 py-3 text-sm font-mono text-gray-500 whitespace-nowrap">
                        {n.code || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-900 whitespace-nowrap">
                        {fmtMoney(n.purchaseCost)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-gray-500 whitespace-nowrap">
                        {fmtMoney(n.residualValue)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                        {n.method || "—"}
                      </td>
                      <td className="px-4 py-3 text-sm text-right text-red-600 whitespace-nowrap">
                        {fmtMoney(n.accumulatedDepreciation)}
                      </td>
                      <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
                        {fmtMoney(n.netBookValue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Schedules ── */}
      {tab === "schedules" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <input
              type="month"
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
            <button
              onClick={handleGenerate}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Generate Month
            </button>
            <button
              onClick={handlePostMonth}
              className="flex items-center px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
            >
              <Play className="h-4 w-4 mr-1" /> Post Month
            </button>
            <span className="ml-auto text-sm text-gray-500">
              {schedules.length} schedules
            </span>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Period
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Machinery
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Accumulated
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Net Book Value
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {schedules.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-6 py-8 text-center text-gray-500 text-xs sm:text-sm"
                      >
                        No depreciation schedules yet. Click "Generate Month" to
                        create PLANNED schedules.
                      </td>
                    </tr>
                  ) : (
                    schedules.map((s) => (
                      <tr key={s.id} className="hover:bg-gray-50 text-gray-900">
                        <td className="px-4 py-3 text-sm text-gray-900 whitespace-nowrap">
                          {new Date(s.startDate).toLocaleDateString()} →{" "}
                          {new Date(s.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {s.machinery?.name || `#${s.machineryId}`}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 whitespace-nowrap">
                          {fmtMoney(s.depreciationAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-500 whitespace-nowrap">
                          {fmtMoney(s.accumulatedDepreciation)}
                        </td>
                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900 whitespace-nowrap">
                          {fmtMoney(s.netBookValue)}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              s.status === "POSTED"
                                ? "bg-green-100 text-green-800"
                                : "bg-blue-100 text-blue-800"
                            }`}
                          >
                            {s.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                          {s.status !== "POSTED" && (
                            <button
                              onClick={() => handlePostSchedule(s.id)}
                              className="inline-flex items-center px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs"
                            >
                              <Play className="h-3 w-3 mr-1" /> Post
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Methods ── */}
      {tab === "methods" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              Depreciation Methods
            </h2>
            <button
              onClick={() => setMethodModalOpen(true)}
              className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            >
              <Plus className="h-4 w-4 mr-1" /> Add Method
            </button>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Default Rate
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Useful Life (yrs)
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {methods.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-6 py-8 text-center text-gray-500 text-xs sm:text-sm"
                      >
                        No depreciation methods yet.
                      </td>
                    </tr>
                  ) : (
                    methods.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 text-gray-900">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {m.name}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {m.type}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 whitespace-nowrap">
                          {m.defaultRate}%
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 whitespace-nowrap">
                          {m.defaultUsefulLifeYears}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              m.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {m.isActive ? "Active" : "Inactive"}
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
      )}

      {/* ── Machinery ── */}
      {tab === "machinery" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-800">
              Depreciation Configuration
            </h2>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-gray-50 text-gray-500 text-xs uppercase tracking-wider border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Machinery
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Code
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Type
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Cost
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {machines.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-6 py-8 text-center text-gray-500 text-xs sm:text-sm"
                      >
                        No machinery registered for this company.
                      </td>
                    </tr>
                  ) : (
                    machines.map((m) => (
                      <tr key={m.id} className="hover:bg-gray-50 text-gray-900">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">
                          {m.name}
                        </td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-500 whitespace-nowrap">
                          {m.code || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500 whitespace-nowrap">
                          {m.type || "—"}
                        </td>
                        <td className="px-4 py-3 text-sm text-right text-gray-900 whitespace-nowrap">
                          {fmtMoney(m.purchaseCost)}
                        </td>
                        <td className="px-4 py-3 text-sm whitespace-nowrap">
                          <span
                            className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                              m.depreciationEnabled
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {m.depreciationEnabled
                              ? "Depr. Enabled"
                              : "Not Configured"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-sm whitespace-nowrap">
                          <button
                            onClick={() => openDepModal(m)}
                            className="inline-flex items-center px-2 py-1 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-xs"
                          >
                            <Settings2 className="h-3 w-3 mr-1" />
                            {m.depreciationEnabled ? "Reconfigure" : "Enable"}
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
      )}

      {/* ── Add Method Modal ── */}
      {methodModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Add Depreciation Method</h2>
              <button
                onClick={() => setMethodModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleCreateMethod} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={methodForm.name}
                  onChange={(e) =>
                    setMethodForm({ ...methodForm, name: e.target.value })
                  }
                  placeholder="e.g. Straight Line 10yr"
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select
                    value={methodForm.type}
                    onChange={(e) =>
                      setMethodForm({ ...methodForm, type: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  >
                    <option value="STRAIGHT_LINE">Straight Line</option>
                    <option value="DECLINING_BALANCE">Declining Balance</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Default Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={methodForm.defaultRate}
                    onChange={(e) =>
                      setMethodForm({
                        ...methodForm,
                        defaultRate: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Default Useful Life (years)
                </label>
                <input
                  type="number"
                  min="1"
                  value={methodForm.defaultUsefulLifeYears}
                  onChange={(e) =>
                    setMethodForm({
                      ...methodForm,
                      defaultUsefulLifeYears: e.target.value,
                    })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                />
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setMethodModalOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  Add Method
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Enable Depreciation Modal ── */}
      {depModalOpen && depMachine && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                Depreciation — {depMachine.name}
              </h2>
              <button
                onClick={() => setDepModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleEnableDep} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Purchase Date
                  </label>
                  <input
                    type="date"
                    value={depForm.purchaseDate}
                    onChange={(e) =>
                      setDepForm({ ...depForm, purchaseDate: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Purchase Cost ($) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={depForm.purchaseCost}
                    onChange={(e) =>
                      setDepForm({ ...depForm, purchaseCost: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Residual Value ($)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={depForm.residualValue}
                    onChange={(e) =>
                      setDepForm({ ...depForm, residualValue: e.target.value })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Useful Life (years)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={depForm.usefulLifeYears}
                    onChange={(e) =>
                      setDepForm({
                        ...depForm,
                        usefulLifeYears: e.target.value,
                      })
                    }
                    className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Depreciation Method *
                </label>
                <select
                  required
                  value={depForm.depMethodId}
                  onChange={(e) =>
                    setDepForm({ ...depForm, depMethodId: e.target.value })
                  }
                  className="mt-1 block w-full border border-gray-300 rounded-md p-2 bg-white text-gray-900"
                >
                  {methods.length === 0 ? (
                    <option value="">Add a method first</option>
                  ) : (
                    methods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.defaultRate}%)
                      </option>
                    ))
                  )}
                </select>
                {methods.length === 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Create a depreciation method in the Methods tab first.
                  </p>
                )}
              </div>
              <div className="flex justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDepModalOpen(false)}
                  className="px-4 py-2 text-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={methods.length === 0}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  Enable Depreciation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

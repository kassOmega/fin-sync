"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Laborer {
  id: number;
  laborerCode: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  dailyRate: string;
  isActive: boolean;
  timesheetCount?: number | string;
  totalHours?: number | string;
}

interface LaborerTimesheet {
  id: number;
  laborerId: number;
  date: string;
  hours: string;
  breakDay: boolean;
  note?: string | null;
  status: string;
  laborer?: {
    id: number;
    firstName: string;
    lastName: string;
    laborerCode: string;
    dailyRate: string;
  };
}

type Tab = "registry" | "timesheets" | "payroll";

const TABS: [Tab, string][] = [
  ["registry", "Registry"],
  ["timesheets", "Timesheets"],
  ["payroll", "Generate Payroll"],
];

export default function DailyLaborersPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = Number(params.companyId);

  const [tab, setTab] = useState<Tab>("registry");
  const [loading, setLoading] = useState(true);

  // Registry
  const [laborers, setLaborers] = useState<Laborer[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Laborer | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    laborerCode: "",
    firstName: "",
    lastName: "",
    phone: "",
    dailyRate: "",
  });

  // Timesheets
  const [timesheets, setTimesheets] = useState<LaborerTimesheet[]>([]);
  const [tsOpen, setTsOpen] = useState(false);
  const [tsForm, setTsForm] = useState({
    laborerId: "",
    date: new Date().toISOString().split("T")[0],
    hours: "8",
    breakDay: false,
    note: "",
  });

  // Payroll
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [generating, setGenerating] = useState(false);
  const [lastRun, setLastRun] = useState<{
    payrollId: number;
    items: number;
    totalAmount: number;
  } | null>(null);

  const loadLaborers = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/daily-laboreers`);
      setLaborers(res.data || []);
    } catch {
      setLaborers([]);
    }
  };

  const loadTimesheets = async () => {
    try {
      const res = await api.get(
        `/companies/${companyId}/daily-laboreers/timesheets`,
      );
      setTimesheets(res.data || []);
    } catch {
      setTimesheets([]);
    }
  };

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([loadLaborers(), loadTimesheets()]);
      setLoading(false);
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  if (loading) return <Loading />;

  const openAdd = () => {
    setEditing(null);
    setForm({
      laborerCode: "",
      firstName: "",
      lastName: "",
      phone: "",
      dailyRate: "",
    });
    setModalOpen(true);
  };

  const openEdit = (l: Laborer) => {
    setEditing(l);
    setForm({
      laborerCode: l.laborerCode,
      firstName: l.firstName,
      lastName: l.lastName,
      phone: l.phone || "",
      dailyRate: String(l.dailyRate ?? ""),
    });
    setModalOpen(true);
  };

  const saveLaborer = async () => {
    if (!form.laborerCode.trim() || !form.firstName.trim() || !form.dailyRate)
      return;
    setSaving(true);
    try {
      if (editing) {
        await api.patch(
          `/companies/${companyId}/daily-laboreers/${editing.id}`,
          {
            laborerCode: form.laborerCode.trim(),
            firstName: form.firstName.trim(),
            lastName: form.lastName.trim(),
            phone: form.phone.trim() || undefined,
            dailyRate: parseFloat(form.dailyRate),
          },
        );
        toast.success("Daily laborer updated");
      } else {
        await api.post(`/companies/${companyId}/daily-laboreers`, {
          laborerCode: form.laborerCode.trim(),
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || undefined,
          dailyRate: parseFloat(form.dailyRate),
        });
        toast.success("Daily laborer registered");
      }
      setModalOpen(false);
      await loadLaborers();
    } catch {
      toast.error(editing ? "Failed to update" : "Failed to register");
    } finally {
      setSaving(false);
    }
  };

  const deleteLaborer = async (l: Laborer) => {
    if (!confirm(`Delete daily laborer ${l.firstName} ${l.lastName}?`)) return;
    try {
      await api.delete(`/companies/${companyId}/daily-laboreers/${l.id}`);
      toast.success("Daily laborer deleted");
      await loadLaborers();
    } catch {
      toast.error("Failed to delete");
    }
  };

  const saveTimesheet = async () => {
    if (!tsForm.laborerId || !tsForm.date) return;
    setSaving(true);
    try {
      await api.post(`/companies/${companyId}/daily-laboreers/timesheets`, {
        laborerId: Number(tsForm.laborerId),
        date: tsForm.date,
        hours: tsForm.breakDay ? undefined : parseFloat(tsForm.hours) || 8,
        breakDay: tsForm.breakDay,
        note: tsForm.note.trim() || undefined,
      });
      toast.success(tsForm.breakDay ? "Break day recorded" : "Timesheet saved");
      setTsOpen(false);
      setTsForm({
        ...tsForm,
        hours: "8",
        breakDay: false,
        note: "",
      });
      await loadTimesheets();
    } catch {
      toast.error("Failed to save timesheet");
    } finally {
      setSaving(false);
    }
  };

  const generatePayroll = async () => {
    if (!startDate || !endDate) return;
    setGenerating(true);
    try {
      const res = await api.post(
        `/companies/${companyId}/daily-laboreers/payroll/generate?startDate=${startDate}&endDate=${endDate}`,
      );
      setLastRun(res.data);
      toast.success(
        `Payroll #${res.data.payrollId} generated — ${res.data.items} laborer(s), $${res.data.totalAmount.toLocaleString()}`,
      );
    } catch {
      toast.error("Failed to generate payroll");
    } finally {
      setGenerating(false);
    }
  };

  const money = (n: number | string) =>
    `$${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Daily Laborers</h1>
          <p className="text-sm text-gray-500">
            Dedicated registry for daily workers — fully separated from standard
            employees.
          </p>
        </div>
      </div>

      <div className="flex gap-2 bg-gray-100 rounded-lg p-1 max-w-fit">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              if (key === "timesheets") loadTimesheets();
            }}
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

      {tab === "registry" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Laborer Registry</h3>
            <button
              onClick={openAdd}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
            >
              + Register Laborer
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b">
                <th className="text-left px-4 py-2">Code</th>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-right px-4 py-2">Daily Rate</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Shifts</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {laborers.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No daily laborers yet. Click "+ Register Laborer" to add
                    one.
                  </td>
                </tr>
              ) : (
                laborers.map((l) => (
                  <tr key={l.id} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-mono text-gray-800">
                      {l.laborerCode}
                    </td>
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {l.firstName} {l.lastName}
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {l.phone || "—"}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      {money(l.dailyRate)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          l.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-500"
                        }`}
                      >
                        {l.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">
                      {Number(l.timesheetCount || 0)} shift(s)
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => openEdit(l)}
                        className="text-xs text-indigo-600 hover:text-indigo-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteLaborer(l)}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === "timesheets" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">
                Laborer Timesheets / Attendance
              </h3>
              <button
                onClick={() => setTsOpen(!tsOpen)}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
              >
                {tsOpen ? "Cancel" : "+ Add Shift / Break"}
              </button>
            </div>
            {tsOpen && (
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 space-y-3">
                <div className="grid grid-cols-5 gap-3 items-end">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Laborer
                    </label>
                    <select
                      value={tsForm.laborerId}
                      onChange={(e) =>
                        setTsForm({ ...tsForm, laborerId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    >
                      <option value="">Select...</option>
                      {laborers
                        .filter((l) => l.isActive)
                        .map((l) => (
                          <option key={l.id} value={l.id}>
                            {l.firstName} {l.lastName} ({l.laborerCode})
                          </option>
                        ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={tsForm.date}
                      onChange={(e) =>
                        setTsForm({ ...tsForm, date: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Hours
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      disabled={tsForm.breakDay}
                      value={tsForm.hours}
                      onChange={(e) =>
                        setTsForm({ ...tsForm, hours: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 text-xs text-gray-700 pt-4">
                      <input
                        type="checkbox"
                        checked={tsForm.breakDay}
                        onChange={(e) =>
                          setTsForm({ ...tsForm, breakDay: e.target.checked })
                        }
                        className="h-4 w-4"
                      />
                      Break day (not payable)
                    </label>
                  </div>
                  <div>
                    <button
                      onClick={saveTimesheet}
                      disabled={saving}
                      className="w-full px-4 py-2 bg-indigo-600 text-white text-xs rounded-md disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>
                </div>
              </div>
            )}
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b">
                  <th className="text-left px-4 py-2">Laborer</th>
                  <th className="text-left px-4 py-2">Date</th>
                  <th className="text-right px-4 py-2">Hours</th>
                  <th className="text-left px-4 py-2">Type</th>
                  <th className="text-left px-4 py-2">Status</th>
                </tr>
              </thead>
              <tbody>
                {timesheets.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-6 text-center text-gray-500"
                    >
                      No timesheets recorded.
                    </td>
                  </tr>
                ) : (
                  timesheets.map((t) => (
                    <tr key={t.id} className="border-b border-gray-100">
                      <td className="px-4 py-2 font-medium text-gray-900">
                        {t.laborer?.firstName} {t.laborer?.lastName}
                      </td>
                      <td className="px-4 py-2 text-gray-900">
                        {new Date(t.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-900">
                        {t.breakDay ? "—" : `${Number(t.hours)}h`}
                      </td>
                      <td className="px-4 py-2">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs ${
                            t.breakDay
                              ? "bg-orange-100 text-orange-700"
                              : "bg-blue-100 text-blue-700"
                          }`}
                        >
                          {t.breakDay ? "Break" : "Work"}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-gray-600">{t.status}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === "payroll" && (
        <div className="bg-white rounded-lg shadow overflow-hidden max-w-2xl">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Period Payroll Run</h3>
            <p className="text-xs text-gray-500">
              Pay = daily rate × worked days (break days excluded). Creates a
              DRAFT payroll that flows through approve → ledger.
            </p>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  End Date
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                />
              </div>
            </div>
            <button
              onClick={generatePayroll}
              disabled={generating || !startDate || !endDate}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50"
            >
              {generating ? "Generating..." : "Generate Payroll"}
            </button>
            {lastRun && (
              <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm text-green-800">
                <strong>Payroll #{lastRun.payrollId}</strong> generated —{" "}
                {lastRun.items} laborer(s), total {money(lastRun.totalAmount)}.
                Find it under Personnel → Payroll → Payroll Runs (status DRAFT).
              </div>
            )}
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                {editing ? "Edit Daily Laborer" : "Register Daily Laborer"}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Laborer Code *
                  </label>
                  <input
                    value={form.laborerCode}
                    onChange={(e) =>
                      setForm({ ...form, laborerCode: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    placeholder="e.g. DL-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Daily Rate ($)*
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={form.dailyRate}
                    onChange={(e) =>
                      setForm({ ...form, dailyRate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    placeholder="e.g. 80"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    First Name *
                  </label>
                  <input
                    value={form.firstName}
                    onChange={(e) =>
                      setForm({ ...form, firstName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Last Name
                  </label>
                  <input
                    value={form.lastName}
                    onChange={(e) =>
                      setForm({ ...form, lastName: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Phone
                </label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="+251..."
                />
              </div>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveLaborer}
                  disabled={saving}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50"
                >
                  {saving ? "Saving..." : editing ? "Update" : "Register"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

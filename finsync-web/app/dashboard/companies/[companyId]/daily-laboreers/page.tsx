"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface Worker {
  id: number;
  laborerCode: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  dailyRate: string;
  hourlyRate?: string | null;
  taxMethod?: string;
  taxRate?: string | null;
  isActive: boolean;
  timesheetCount?: number | string;
  totalHours?: number | string;
}

interface WorkerTimesheet {
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

interface WorkerAttendance {
  id: number;
  laborerId: number;
  date: string;
  status: string;
  note?: string | null;
  laborer?: {
    id: number;
    firstName: string;
    lastName: string;
    laborerCode: string;
  };
}

type Tab = "registry" | "timesheets" | "attendance" | "payroll";

const ATT_STATUS: [string, string][] = [
  ["PRESENT", "Present"],
  ["LATE", "Late"],
  ["HALF_DAY", "Half Day"],
  ["ABSENT", "Absent"],
];

const TAX_METHODS: [string, string][] = [
  ["GLOBAL", "Global (company default)"],
  ["CUSTOM", "Custom rate"],
  ["EXEMPT", "Exempt"],
];

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className="mt-1 text-lg font-semibold text-gray-900">{value}</p>
    </div>
  );
}

export default function TemporaryWorkersPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = Number(params.companyId);

  const [tab, setTab] = useState<Tab>("registry");
  const [loading, setLoading] = useState(true);

  // Company temp-worker settings
  const [timeMode, setTimeMode] = useState<"ATTENDANCE" | "TIMESHEET">(
    "TIMESHEET",
  );
  const [taxEnabled, setTaxEnabled] = useState(false);
  const [taxRate, setTaxRate] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  // Registry
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    laborerCode: "",
    firstName: "",
    lastName: "",
    phone: "",
    dailyRate: "",
    hourlyRate: "",
    taxMethod: "GLOBAL",
    taxRate: "",
  });

  // Timesheets
  const [timesheets, setTimesheets] = useState<WorkerTimesheet[]>([]);
  const [tsOpen, setTsOpen] = useState(false);
  const [tsForm, setTsForm] = useState({
    laborerId: "",
    date: new Date().toISOString().split("T")[0],
    hours: "8",
    breakDay: false,
    note: "",
  });

  // Attendance
  const [attendances, setAttendances] = useState<WorkerAttendance[]>([]);
  const [attOpen, setAttOpen] = useState(false);
  const [attForm, setAttForm] = useState({
    laborerId: "",
    date: new Date().toISOString().split("T")[0],
    status: "PRESENT",
    note: "",
  });

  // Temporary-worker payroll (separate cycle from employee payroll —
  // can be run daily, weekly, or monthly with its own date range)
  const today = new Date().toISOString().split("T")[0];
  const [payStart, setPayStart] = useState(today);
  const [payEnd, setPayEnd] = useState(today);
  const [generating, setGenerating] = useState(false);
  const [payResult, setPayResult] = useState<any>(null);
  const [payError, setPayError] = useState("");

  const iso = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const applyPreset = (label: string) => {
    const now = new Date();
    let s = now;
    let e = now;
    if (label === "Yesterday") {
      s = new Date(now.getTime() - 86400000);
      e = s;
    } else if (label === "This Week") {
      const day = (now.getDay() + 6) % 7; // Monday-start week
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      e = now;
    } else if (label === "Last Week") {
      const day = (now.getDay() + 6) % 7;
      s = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day - 7);
      e = new Date(s.getFullYear(), s.getMonth(), s.getDate() + 6);
    } else if (label === "This Month") {
      s = new Date(now.getFullYear(), now.getMonth(), 1);
      e = now;
    } else if (label === "Last Month") {
      s = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      e = new Date(now.getFullYear(), now.getMonth(), 0);
    }
    setPayStart(iso(s));
    setPayEnd(iso(e));
  };

  const generatePayroll = async () => {
    if (!payStart || !payEnd) {
      toast.error("Select a date range first");
      return;
    }
    setGenerating(true);
    setPayError("");
    setPayResult(null);
    try {
      const res = await api.post(
        `/companies/${companyId}/daily-laboreers/payroll/generate?startDate=${payStart}&endDate=${payEnd}`,
      );
      setPayResult(res.data);
      toast.success(
        `Payroll generated — ${res.data?.items ?? 0} item(s) · ${money(
          res.data?.totalAmount ?? 0,
        )}`,
      );
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || "Failed to generate payroll";
      setPayError(msg);
      toast.error(msg);
    } finally {
      setGenerating(false);
    }
  };

  const loadCompany = async () => {
    try {
      const res = await api.get(`/companies/${companyId}`);
      setTimeMode(
        res.data?.tempWorkerTimeMode === "ATTENDANCE"
          ? "ATTENDANCE"
          : "TIMESHEET",
      );
      setTaxEnabled(!!res.data?.tempWorkerTaxEnabled);
      setTaxRate(
        res.data?.tempWorkerTaxRate != null
          ? String(res.data.tempWorkerTaxRate)
          : "",
      );
    } catch {
      /* keep defaults */
    }
  };

  const loadWorkers = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/daily-laboreers`);
      setWorkers(res.data || []);
    } catch {
      setWorkers([]);
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

  const loadAttendances = async () => {
    try {
      const res = await api.get(
        `/companies/${companyId}/daily-laboreers/attendance`,
      );
      setAttendances(res.data || []);
    } catch {
      setAttendances([]);
    }
  };

  useEffect(() => {
    if (!companyId) return;
    const load = async () => {
      setLoading(true);
      await Promise.all([
        loadCompany(),
        loadWorkers(),
        loadTimesheets(),
        loadAttendances(),
      ]);
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
      hourlyRate: "",
      taxMethod: "GLOBAL",
      taxRate: "",
    });
    setModalOpen(true);
  };

  const openEdit = (l: Worker) => {
    setEditing(l);
    setForm({
      laborerCode: l.laborerCode,
      firstName: l.firstName,
      lastName: l.lastName,
      phone: l.phone || "",
      dailyRate: String(l.dailyRate ?? ""),
      hourlyRate: l.hourlyRate ? String(l.hourlyRate) : "",
      taxMethod: l.taxMethod || "GLOBAL",
      taxRate: l.taxRate ? String(l.taxRate) : "",
    });
    setModalOpen(true);
  };

  const saveWorker = async () => {
    const rateOk =
      timeMode === "ATTENDANCE" ? form.dailyRate : form.hourlyRate;
    if (!form.laborerCode.trim() || !form.firstName.trim() || !rateOk) return;
    setSaving(true);
    const payload = {
      laborerCode: form.laborerCode.trim(),
      firstName: form.firstName.trim(),
      lastName: form.lastName.trim(),
      phone: form.phone.trim() || undefined,
      dailyRate:
        timeMode === "ATTENDANCE" ? parseFloat(form.dailyRate) : undefined,
      ...(timeMode === "TIMESHEET" && form.hourlyRate
        ? { hourlyRate: parseFloat(form.hourlyRate) }
        : {}),
      taxMethod: form.taxMethod,
      ...(form.taxRate && { taxRate: parseFloat(form.taxRate) }),
    };
    try {
      if (editing) {
        await api.patch(
          `/companies/${companyId}/daily-laboreers/${editing.id}`,
          payload,
        );
        toast.success("Temporary worker updated");
      } else {
        await api.post(`/companies/${companyId}/daily-laboreers`, payload);
        toast.success("Temporary worker registered");
      }
      setModalOpen(false);
      await loadWorkers();
    } catch {
      toast.error(editing ? "Failed to update" : "Failed to register");
    } finally {
      setSaving(false);
    }
  };

  const deleteWorker = async (l: Worker) => {
    if (!confirm(`Delete temporary worker ${l.firstName} ${l.lastName}?`))
      return;
    try {
      await api.delete(`/companies/${companyId}/daily-laboreers/${l.id}`);
      toast.success("Temporary worker deleted");
      await loadWorkers();
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
      setTsForm({ ...tsForm, hours: "8", breakDay: false, note: "" });
      await loadTimesheets();
    } catch {
      toast.error("Failed to save timesheet");
    } finally {
      setSaving(false);
    }
  };

  const saveAttendance = async () => {
    if (!attForm.laborerId || !attForm.date) return;
    setSaving(true);
    try {
      await api.post(`/companies/${companyId}/daily-laboreers/attendance`, {
        laborerId: Number(attForm.laborerId),
        date: attForm.date,
        status: attForm.status,
        note: attForm.note.trim() || undefined,
      });
      toast.success("Attendance saved");
      setAttOpen(false);
      setAttForm({ ...attForm, note: "" });
      await loadAttendances();
    } catch {
      toast.error("Failed to save attendance");
    } finally {
      setSaving(false);
    }
  };

  const deleteAttendance = async (a: WorkerAttendance) => {
    const name = a.laborer
      ? `${a.laborer.firstName} ${a.laborer.lastName}`
      : `#${a.laborerId}`;
    if (!confirm(`Delete attendance for ${name} on ${a.date}?`)) return;
    try {
      await api.delete(
        `/companies/${companyId}/daily-laboreers/attendance/${a.id}`,
      );
      toast.success("Attendance deleted");
      await loadAttendances();
    } catch {
      toast.error("Failed to delete attendance");
    }
  };

  const saveConfig = async () => {
    setSavingConfig(true);
    try {
      await api.patch(`/companies/${companyId}`, {
        tempWorkerTimeMode: timeMode,
        tempWorkerTaxEnabled: taxEnabled,
        ...(taxRate ? { tempWorkerTaxRate: parseFloat(taxRate) } : {}),
      });
      toast.success("Temporary worker settings saved");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSavingConfig(false);
    }
  };

  const money = (n: number | string) =>
    `$${Number(n || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;

  const tabs: [Tab, string][] = [
    ["registry", "Registry"],
    ...(timeMode === "ATTENDANCE"
      ? ([["attendance", "Attendance"]] as [Tab, string][])
      : ([["timesheets", "Timesheets"]] as [Tab, string][])),
    ["payroll", "Generate Payroll"],
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">
            Temporary Workers
          </h1>
          <p className="text-sm text-gray-500">
            Dedicated registry for temporary workers — fully separated from
            standard employees.
          </p>
        </div>
      </div>

      {/* Settings: time mode + global tax */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <h3 className="font-semibold text-gray-900">
            Temporary Worker Settings
          </h3>
        </div>
        <div className="p-4 grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Time Tracking Mode
            </label>
            <div className="grid grid-cols-2 gap-2">
              {(
                [
                  ["TIMESHEET", "Timesheet"],
                  ["ATTENDANCE", "Attendance"],
                ] as const
              ).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setTimeMode(v)}
                  className={`px-3 py-2 text-sm font-medium rounded-md border ${
                    timeMode === v
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Timesheet = hours-based (uses hourly rate). Attendance =
              presence-based (half-day = 0.5 day, late = full day).
            </p>
          </div>
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-700 mb-1">
              <input
                type="checkbox"
                checked={taxEnabled}
                onChange={(e) => setTaxEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              Enable taxation (global default %)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="100"
              disabled={!taxEnabled}
              value={taxRate}
              onChange={(e) => setTaxRate(e.target.value)}
              placeholder="e.g. 2"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900 disabled:opacity-50"
            />
            <p className="text-xs text-gray-500 mt-1">
              Applied to workers using &quot;Global&quot; tax method unless
              overridden.
            </p>
          </div>
          <div className="flex items-end">
            <button
              onClick={saveConfig}
              disabled={savingConfig}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50"
            >
              {savingConfig ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </div>
      </div>

      <div className="flex gap-2 bg-gray-100 rounded-lg p-1 max-w-fit">
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              if (key === "timesheets") loadTimesheets();
              if (key === "attendance") loadAttendances();
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
            <h3 className="font-semibold text-gray-900">Worker Registry</h3>
            <button
              onClick={openAdd}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
            >
              + Register Worker
            </button>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b">
                <th className="text-left px-4 py-2">Code</th>
                <th className="text-left px-4 py-2">Name</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-right px-4 py-2">
                  {timeMode === "ATTENDANCE" ? "Daily Rate" : "Hourly Rate"}
                </th>
                <th className="text-left px-4 py-2">Tax</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Shifts</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {workers.length === 0 ? (
                <tr>
                  <td
                    colSpan={9}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No temporary workers yet. Click &quot;+ Register Worker&quot;
                    to add one.
                  </td>
                </tr>
              ) : (
                workers.map((l) => (
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
                      {timeMode === "ATTENDANCE"
                        ? money(l.dailyRate)
                        : l.hourlyRate
                          ? money(l.hourlyRate)
                          : "—"}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          l.taxMethod === "EXEMPT"
                            ? "bg-green-100 text-green-700"
                            : l.taxMethod === "CUSTOM"
                              ? "bg-indigo-100 text-indigo-700"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {l.taxMethod === "GLOBAL"
                          ? taxEnabled
                            ? `Global ${taxRate}%`
                            : "Global"
                          : l.taxMethod === "CUSTOM"
                            ? `${l.taxRate ?? 0}%`
                            : "Exempt"}
                      </span>
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
                        onClick={() => deleteWorker(l)}
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
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Worker Timesheets</h3>
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
                    Worker
                  </label>
                  <select
                    value={tsForm.laborerId}
                    onChange={(e) =>
                      setTsForm({ ...tsForm, laborerId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  >
                    <option value="">Select...</option>
                    {workers
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
                <th className="text-left px-4 py-2">Worker</th>
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
                      {t.laborer
                        ? `${t.laborer.firstName} ${t.laborer.lastName}`
                        : `Worker #${t.laborerId}`}
                    </td>
                    <td className="px-4 py-2 text-gray-900">
                      {new Date(t.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right text-gray-900">
                      {t.breakDay ? "—" : Number(t.hours)}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          t.breakDay
                            ? "bg-gray-100 text-gray-500"
                            : "bg-indigo-100 text-indigo-700"
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
      )}

      {tab === "attendance" && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Worker Attendance</h3>
            <button
              onClick={() => setAttOpen(!attOpen)}
              className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
            >
              {attOpen ? "Cancel" : "+ Mark Attendance"}
            </button>
          </div>
          {attOpen && (
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 space-y-3">
              <div className="grid grid-cols-5 gap-3 items-end">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Worker
                  </label>
                  <select
                    value={attForm.laborerId}
                    onChange={(e) =>
                      setAttForm({ ...attForm, laborerId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  >
                    <option value="">Select...</option>
                    {workers
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
                    value={attForm.date}
                    onChange={(e) =>
                      setAttForm({ ...attForm, date: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Status
                  </label>
                  <select
                    value={attForm.status}
                    onChange={(e) =>
                      setAttForm({ ...attForm, status: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  >
                    {ATT_STATUS.map(([v, l]) => (
                      <option key={v} value={v}>
                        {l}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Note
                  </label>
                  <input
                    value={attForm.note}
                    onChange={(e) =>
                      setAttForm({ ...attForm, note: e.target.value })
                    }
                    placeholder="Optional"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  />
                </div>
                <div>
                  <button
                    onClick={saveAttendance}
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
                <th className="text-left px-4 py-2">Worker</th>
                <th className="text-left px-4 py-2">Date</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-left px-4 py-2">Note</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendances.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-6 text-center text-gray-500"
                  >
                    No attendance recorded.
                  </td>
                </tr>
              ) : (
                attendances.map((a) => (
                  <tr key={a.id} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-900">
                      {a.laborer
                        ? `${a.laborer.firstName} ${a.laborer.lastName}`
                        : `Worker #${a.laborerId}`}
                    </td>
                    <td className="px-4 py-2 text-gray-900">
                      {new Date(a.date).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs ${
                          a.status === "PRESENT"
                            ? "bg-green-100 text-green-700"
                            : a.status === "LATE"
                              ? "bg-yellow-100 text-yellow-700"
                              : a.status === "HALF_DAY"
                                ? "bg-indigo-100 text-indigo-700"
                                : "bg-red-100 text-red-700"
                        }`}
                      >
                        {a.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{a.note || "—"}</td>
                    <td className="px-4 py-2 text-right">
                      <button
                        onClick={() => deleteAttendance(a)}
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

      {tab === "payroll" && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Generate Temporary Workers Payroll
              </h3>
              <p className="text-xs text-gray-500">
                Run payroll for temporary workers on its own cycle — daily,
                weekly, or monthly. Employee payroll is generated separately
                from the Payroll page.
              </p>
            </div>
            <div className="p-4">
              <div className="flex flex-wrap items-end gap-3">
                <div className="flex gap-2 flex-wrap">
                  {[
                    "Today",
                    "Yesterday",
                    "This Week",
                    "Last Week",
                    "This Month",
                    "Last Month",
                  ].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => applyPreset(l)}
                      className="px-2 py-1 text-xs rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50"
                    >
                      {l}
                    </button>
                  ))}
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    From
                  </label>
                  <input
                    type="date"
                    value={payStart}
                    onChange={(e) => setPayStart(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-600 mb-1">
                    To
                  </label>
                  <input
                    type="date"
                    value={payEnd}
                    onChange={(e) => setPayEnd(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 rounded-md bg-white text-gray-900"
                  />
                </div>
                <button
                  onClick={generatePayroll}
                  disabled={generating}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {generating ? "Generating..." : "Generate Payroll"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Attendance mode pays daily rate × worked days; timesheet mode
                pays hours × hourly rate. An existing DRAFT run for the same
                range blocks generation — delete it on the Payroll page first.
              </p>
            </div>
          </div>

          {payError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg p-4">
              {payError}
            </div>
          )}

          {payResult && (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  Payroll Result
                </h3>
                <Link
                  href={`/dashboard/companies/${companyId}/personnel/payroll?tab=runs`}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  View & approve in Payroll →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-gray-200 border-b border-gray-200 text-center">
                <StatBox label="Items" value={String(payResult.items ?? 0)} />
                <StatBox
                  label="Net Total"
                  value={money(payResult.totalAmount ?? 0)}
                />
                <StatBox label="Tax" value={money(payResult.totalTax ?? 0)} />
                <StatBox label="Mode" value={payResult.timeMode || "—"} />
              </div>
              {(payResult.laborers || []).length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase border-b">
                        <th className="text-left px-4 py-2">Worker</th>
                        <th className="text-right px-4 py-2">Days</th>
                        <th className="text-right px-4 py-2">Hours</th>
                        <th className="text-right px-4 py-2">Rate/Day</th>
                        <th className="text-right px-4 py-2">Tax</th>
                        <th className="text-right px-4 py-2">Pay</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(payResult.laborers || []).map((l: any) => {
                        const days = Number(l.workedDays ?? 0);
                        const hours = Number(l.totalHours ?? 0);
                        const rate = Number(l.dailyRate ?? 0);
                        const hRate = Number(l.hourlyRate ?? 0);
                        const pay =
                          hours > 0 && hRate > 0
                            ? hours * hRate
                            : days * rate;
                        return (
                          <tr key={l.id} className="border-b border-gray-100">
                            <td className="px-4 py-2 font-medium text-gray-800">
                              {l.firstName} {l.lastName}
                            </td>
                            <td className="px-4 py-2 text-right">{days}</td>
                            <td className="px-4 py-2 text-right">{hours}</td>
                            <td className="px-4 py-2 text-right">
                              {rate.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-600">
                              {l.taxMethod || "GLOBAL"}
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-green-700">
                              {money(pay)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">
              {editing ? "Edit Temporary Worker" : "Register Temporary Worker"}
            </h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Worker Code *
                  </label>
                  <input
                    value={form.laborerCode}
                    onChange={(e) =>
                      setForm({ ...form, laborerCode: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    placeholder="e.g. TW-001"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {timeMode === "ATTENDANCE"
                      ? "Daily Rate ($)*"
                      : "Hourly Rate ($)*"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={
                      timeMode === "ATTENDANCE"
                        ? form.dailyRate
                        : form.hourlyRate
                    }
                    onChange={(e) =>
                      timeMode === "ATTENDANCE"
                        ? setForm({ ...form, dailyRate: e.target.value })
                        : setForm({ ...form, hourlyRate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    placeholder={timeMode === "ATTENDANCE" ? "e.g. 80" : "e.g. 10"}
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
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Tax Method
                </label>
                <select
                  value={form.taxMethod}
                  onChange={(e) =>
                    setForm({ ...form, taxMethod: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  {TAX_METHODS.map(([v, l]) => (
                    <option key={v} value={v}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              {form.taxMethod === "CUSTOM" && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    Tax Rate (%)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="100"
                    value={form.taxRate}
                    onChange={(e) =>
                      setForm({ ...form, taxRate: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    placeholder="e.g. 5"
                  />
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveWorker}
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

"use client";

import { leaveService } from "@/lib/services/leave";
import type {
  LeaveBalance,
  LeaveCalendarEntry,
  LeaveRequest,
  LeaveType,
} from "@/lib/services/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type TabType = "my" | "request" | "all" | "calendar" | "admin";

export default function LeavesPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = Number(params.companyId);
  const [tab, setTab] = useState<TabType>("my");
  const [balances, setBalances] = useState<LeaveBalance[]>([]);
  const [types, setTypes] = useState<LeaveType[]>([]);
  const [myRequests, setMyRequests] = useState<LeaveRequest[]>([]);
  const [allRequests, setAllRequests] = useState<LeaveRequest[]>([]);
  const [calendar, setCalendar] = useState<LeaveCalendarEntry[]>([]);
  const [products, setProducts] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRequests = async () => {
    const [mine, all] = await Promise.all([
      leaveService.getMyRequests(companyId),
      leaveService.getCompanyRequests(companyId),
    ]);
    setMyRequests(mine);
    setAllRequests(all);
  };

  const loadCalendar = async () => {
    const start = new Date();
    start.setDate(1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 0);
    const entries = await leaveService.getCalendar(
      companyId,
      start.toISOString().split("T")[0],
      end.toISOString().split("T")[0],
    );
    setCalendar(entries);
  };

  const loadBalances = async () => {
    const [bal, typesData] = await Promise.all([
      leaveService.getMyBalances(companyId),
      leaveService.getTypes(companyId),
    ]);
    setBalances(bal);
    setTypes(typesData);
    setProducts(typesData);
  };

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    Promise.all([loadBalances(), loadRequests(), loadCalendar()]).finally(() =>
      setLoading(false),
    );
  }, [companyId, tab]);

  const handleSubmit = async (data: {
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    isHalfDay?: boolean;
    reason?: string;
  }) => {
    await leaveService.submitRequest(companyId, data);
    await Promise.all([loadRequests(), loadBalances()]);
    setTab("my");
  };

  const handleApprove = async (id: number) => {
    await leaveService.approveRequest(companyId, id);
    await loadRequests();
  };

  const handleReject = async (id: number, reason?: string) => {
    await leaveService.rejectRequest(companyId, id, reason);
    await loadRequests();
  };

  const handleCancel = async (id: number) => {
    await leaveService.cancelRequest(companyId, id);
    await loadRequests();
  };

  // ── Leave Types CRUD ──
  const [typeModalOpen, setTypeModalOpen] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);

  const loadTypes = async () => {
    const data = await leaveService.getTypes(companyId);
    setTypes(data);
    setProducts(data);
  };

  const handleSaveType = async (payload: any) => {
    if (editingType) {
      await leaveService.updateType(companyId, editingType.id, payload);
    } else {
      await leaveService.createType(companyId, payload);
    }
    setTypeModalOpen(false);
    setEditingType(null);
    await loadTypes();
    await loadBalances();
  };

  const handleDeleteType = async (id: number) => {
    if (!confirm("Delete this leave type?")) return;
    try {
      await leaveService.deleteType(companyId, id);
      await loadTypes();
      await loadBalances();
    } catch {
      // Might be in use
    }
  };

  if (loading) return <div className="p-8 text-gray-500">Loading leave...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leave Management</h1>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1 max-w-fit">
        {(
          [
            ["my", "My Balance"],
            ["request", "Request Leave"],
            ["all", "My Requests"],
            ["calendar", "Team Calendar"],
            ["admin", "Admin"],
          ] as [TabType, string][]
        ).map(([key, label]) => (
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

      {tab === "my" && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from(
            new Map(balances.map((bal) => [bal.leaveTypeId, bal])).values(),
          ).map((bal) => {
            const remaining = bal.totalDays - bal.usedDays - bal.pendingDays;
            const pct = Math.min(
              100,
              ((bal.usedDays + bal.pendingDays) / Math.max(bal.totalDays, 1)) *
                100,
            );
            return (
              <div
                key={bal.id}
                className="bg-white rounded-lg shadow-sm border p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-gray-900">
                    {bal.leaveType.name}
                  </h3>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                      bal.leaveType.isPaid
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {bal.leaveType.isPaid ? "Paid" : "Unpaid"}
                  </span>
                </div>
                {bal.carriedForwardDays > 0 && (
                  <p className="text-xs text-gray-500 mb-1">
                    +{bal.carriedForwardDays} carried forward
                  </p>
                )}
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-indigo-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 text-center text-sm">
                  <div>
                    <div className="font-bold text-gray-900">
                      {bal.totalDays}
                    </div>
                    <div className="text-xs text-gray-500">Total</div>
                  </div>
                  <div>
                    <div className="font-bold text-green-600">
                      {bal.usedDays}
                    </div>
                    <div className="text-xs text-gray-500">Used</div>
                  </div>
                  <div>
                    <div className="font-bold text-yellow-600">
                      {bal.pendingDays}
                    </div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                  <div>
                    <div className="font-bold text-indigo-600">{remaining}</div>
                    <div className="text-xs text-gray-500">Available</div>
                  </div>
                </div>
              </div>
            );
          })}
          {balances.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-500">
              No leave balances found. Ask your manager to configure leave
              types.
            </div>
          )}
        </div>
      )}

      {tab === "request" && (
        <LeaveRequestForm
          types={products}
          onCancel={() => setTab("my")}
          onSubmit={handleSubmit}
        />
      )}

      {tab === "all" && (
        <LeaveRequestsList
          requests={myRequests}
          showActions={false}
          onCancel={handleCancel}
        />
      )}

      {tab === "calendar" && (
        <LeaveCalendarView
          companyId={companyId}
          entries={calendar}
          types={products}
          onMonthChange={loadCalendar}
        />
      )}

      {tab === "admin" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                Leave Types
              </h2>
              <button
                onClick={() => {
                  setEditingType(null);
                  setTypeModalOpen(true);
                }}
                className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
              >
                + Add Type
              </button>
            </div>
            <LeaveTypesTable
              types={types}
              onEdit={(t) => {
                setEditingType(t);
                setTypeModalOpen(true);
              }}
              onDelete={handleDeleteType}
            />
          </div>

          <div className="bg-white rounded-lg shadow border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              All Requests
            </h2>
            <LeaveRequestsList
              requests={allRequests}
              showActions
              onApprove={handleApprove}
              onReject={handleReject}
            />
          </div>
        </div>
      )}

      {typeModalOpen && (
        <LeaveTypeModal
          editing={editingType}
          onClose={() => {
            setTypeModalOpen(false);
            setEditingType(null);
          }}
          onSave={handleSaveType}
        />
      )}
    </div>
  );
}

function LeaveRequestForm({
  types,
  onCancel,
  onSubmit,
  initial,
}: {
  types: LeaveType[];
  onCancel: () => void;
  onSubmit: (data: {
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    isHalfDay?: boolean;
    reason?: string;
  }) => Promise<void>;
  initial?: {
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    isHalfDay?: boolean;
    reason?: string;
  };
}) {
  const [leaveTypeId, setLeaveTypeId] = useState<number | 0>(
    initial?.leaveTypeId || 0,
  );
  const [startDate, setStartDate] = useState(initial?.startDate || "");
  const [endDate, setEndDate] = useState(initial?.endDate || "");
  const [isHalfDay, setIsHalfDay] = useState(initial?.isHalfDay || false);
  const [reason, setReason] = useState(initial?.reason || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leaveTypeId || !startDate) return;
    setSaving(true);
    setError("");
    try {
      await onSubmit({
        leaveTypeId,
        startDate,
        endDate: endDate || startDate,
        isHalfDay,
        reason: reason || undefined,
      });
    } catch (err: any) {
      setError(err?.response?.data?.message || "Failed to submit request");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl bg-white rounded-lg shadow border p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">
        Submit Leave Request
      </h2>
      {error && (
        <div className="mb-4 px-4 py-2 bg-red-50 text-red-700 text-sm rounded-md">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-600 mb-1">Leave Type</label>
          <select
            value={leaveTypeId}
            onChange={(e) => setLeaveTypeId(Number(e.target.value))}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          >
            <option value={0}>Select type...</option>
            {types.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} ({t.isPaid ? "Paid" : "Unpaid"})
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">End Date</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={isHalfDay}
            onChange={(e) => setIsHalfDay(e.target.checked)}
            className="h-4 w-4"
          />
          <label className="text-sm text-gray-600">Half-day request</label>
        </div>
        <div>
          <label className="block text-sm text-gray-600 mb-1">Reason</label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            rows={3}
            placeholder="Optional reason..."
          />
        </div>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-sm text-gray-600"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !leaveTypeId || !startDate}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md disabled:opacity-50"
          >
            {saving ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </div>
  );
}

function LeaveRequestsList({
  requests,
  showActions,
  onApprove,
  onReject,
  onCancel,
}: {
  requests: LeaveRequest[];
  showActions?: boolean;
  onApprove?: (id: number) => Promise<void>;
  onReject?: (id: number, reason?: string) => Promise<void>;
  onCancel?: (id: number) => Promise<void>;
}) {
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-gray-500 text-xs uppercase border-b">
            <th className="text-left px-4 py-2">Type</th>
            <th className="text-left px-4 py-2">Dates</th>
            <th className="text-left px-4 py-2">Days</th>
            <th className="text-left px-4 py-2">Status</th>
            <th className="text-left px-4 py-2">Reason</th>
            {showActions && <th className="text-right px-4 py-2">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {requests.length === 0 && (
            <tr>
              <td colSpan={6} className="py-8 text-center text-gray-500">
                No leave requests found.
              </td>
            </tr>
          )}
          {requests.map((req) => (
            <tr key={req.id} className="border-b border-gray-100">
              <td className="px-4 py-2 font-medium text-gray-800">
                {req.leaveType?.name}
              </td>
              <td className="px-4 py-2 text-gray-600">
                {new Date(req.startDate).toLocaleDateString()} →{" "}
                {new Date(req.endDate).toLocaleDateString()}
                {req.isHalfDay && (
                  <span className="ml-2 text-xs bg-yellow-100 text-yellow-700 px-1 rounded">
                    Half-day
                  </span>
                )}
              </td>
              <td className="px-4 py-2 font-medium">{req.totalDays}</td>
              <td className="px-4 py-2">
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    req.status === "APPROVED"
                      ? "bg-green-100 text-green-700"
                      : req.status === "PENDING"
                        ? "bg-yellow-100 text-yellow-700"
                        : req.status === "REJECTED"
                          ? "bg-red-100 text-red-700"
                          : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {req.status}
                </span>
              </td>
              <td className="px-4 py-2 text-gray-600">{req.reason}</td>
              {showActions && (
                <td className="px-4 py-2 text-right">
                  {req.status === "PENDING" && (
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => onApprove?.(req.id)}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => {
                          setRejectingId(req.id);
                          setRejectReason("");
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Reject
                      </button>
                    </div>
                  )}
                </td>
              )}
              {!showActions && req.status === "PENDING" && onCancel && (
                <td className="px-4 py-2 text-right">
                  <button
                    onClick={() => onCancel?.(req.id)}
                    className="text-xs text-gray-500 hover:text-gray-700"
                  >
                    Cancel
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>

      {rejectingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50">
          <div className="bg-white rounded-lg p-6 w-96">
            <h3 className="font-semibold text-gray-900 mb-2">Reject Request</h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              rows={3}
              placeholder="Rejection reason (optional)"
            />
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setRejectingId(null)}
                className="px-4 py-2 text-sm text-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onReject?.(rejectingId, rejectReason || undefined);
                  setRejectingId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-md"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LeaveTypesTable({
  types,
  onEdit,
  onDelete,
}: {
  types: LeaveType[];
  onEdit: (t: LeaveType) => void;
  onDelete: (id: number) => Promise<void>;
}) {
  const [deleteState, setDeleteState] = useState<string>("");
  return (
    <table className="w-full text-sm">
      <thead>
        <tr className="text-gray-500 text-xs uppercase border-b">
          <th className="text-left px-4 py-2">Name</th>
          <th className="text-left px-4 py-2">Paid</th>
          <th className="text-right px-4 py-2">Days/Year</th>
          <th className="text-right px-4 py-2">Carry Fwd</th>
          <th className="text-left px-4 py-2">Approval</th>
          <th className="text-left px-4 py-2">Status</th>
          <th className="text-right px-4 py-2">Actions</th>
        </tr>
      </thead>
      <tbody>
        {types.length === 0 && (
          <tr>
            <td colSpan={7} className="py-8 text-center text-gray-500">
              No leave types configured.
            </td>
          </tr>
        )}
        {types.map((t) => (
          <tr key={t.id} className="border-b border-gray-100">
            <td className="px-4 py-2 font-medium text-gray-800">{t.name}</td>
            <td className="px-4 py-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  t.isPaid
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-600"
                }`}
              >
                {t.isPaid ? "Paid" : "Unpaid"}
              </span>
            </td>
            <td className="px-4 py-2 text-right text-gray-900">
              {t.defaultDaysPerYear}
            </td>
            <td className="px-4 py-2 text-right text-gray-900">
              {t.maxCarryForwardDays ?? "—"}
            </td>
            <td className="px-4 py-2 text-gray-900">
              {t.requiresApproval ? "Required" : "None"}
            </td>
            <td className="px-4 py-2">
              <span
                className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  t.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                {t.isActive ? "Active" : "Inactive"}
              </span>
            </td>
            <td className="px-4 py-2 text-right">
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => onEdit(t)}
                  className="text-xs text-indigo-600 hover:text-indigo-800"
                >
                  Edit
                </button>
                <button
                  onClick={async () => {
                    setDeleteState(`deleting-${t.id}`);
                    await onDelete(t.id);
                    setDeleteState("");
                  }}
                  disabled={deleteState === `deleting-${t.id}`}
                  className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                >
                  {deleteState === `deleting-${t.id}` ? "..." : "Delete"}
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function LeaveTypeModal({
  editing,
  onClose,
  onSave,
}: {
  editing: LeaveType | null;
  onClose: () => void;
  onSave: (payload: any) => Promise<void>;
}) {
  const [form, setForm] = useState({
    name: editing?.name || "",
    isPaid: editing?.isPaid ?? true,
    defaultDaysPerYear: editing?.defaultDaysPerYear ?? 20,
    maxCarryForwardDays: editing?.maxCarryForwardDays?.toString() || "",
    requiresApproval: editing?.requiresApproval ?? true,
    isActive: editing?.isActive ?? true,
  });
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      await onSave({
        name: form.name.trim(),
        isPaid: form.isPaid,
        defaultDaysPerYear: Number(form.defaultDaysPerYear) || 20,
        maxCarryForwardDays: form.maxCarryForwardDays
          ? Number(form.maxCarryForwardDays)
          : undefined,
        requiresApproval: form.requiresApproval,
        isActive: form.isActive,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {editing ? "Edit Leave Type" : "Add Leave Type"}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Name *</label>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. Annual Leave"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Default Days / Year
              </label>
              <input
                type="number"
                min="0"
                value={form.defaultDaysPerYear}
                onChange={(e) =>
                  setForm({
                    ...form,
                    defaultDaysPerYear: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Max Carry Forward
              </label>
              <input
                type="number"
                min="0"
                value={form.maxCarryForwardDays}
                onChange={(e) =>
                  setForm({ ...form, maxCarryForwardDays: e.target.value })
                }
                placeholder="Optional"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              />
            </div>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.isPaid}
                onChange={(e) => setForm({ ...form, isPaid: e.target.checked })}
                className="h-4 w-4"
              />{" "}
              Paid leave
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.requiresApproval}
                onChange={(e) =>
                  setForm({ ...form, requiresApproval: e.target.checked })
                }
                className="h-4 w-4"
              />{" "}
              Requires approval
            </label>
            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) =>
                  setForm({ ...form, isActive: e.target.checked })
                }
                className="h-4 w-4"
              />{" "}
              Active
            </label>
          </div>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md disabled:opacity-50"
            >
              {saving ? "Saving..." : editing ? "Update Type" : "Add Type"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function LeaveCalendarView({
  companyId,
  entries,
  types,
  onMonthChange,
}: {
  companyId: number;
  entries: LeaveCalendarEntry[];
  types: LeaveType[];
  onMonthChange: () => Promise<void>;
}) {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [editingEntry, setEditingEntry] = useState<LeaveCalendarEntry | null>(
    null,
  );

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => i);

  const monthLabel = viewDate.toLocaleString("default", { month: "long" });

  const shiftMonth = (delta: number) => {
    const next = new Date(year, month + delta, 1);
    setViewDate(next);
    onMonthChange();
  };

  const entriesForDay = (day: number) =>
    entries.filter((e) => {
      const start = new Date(e.startDate);
      const end = new Date(e.endDate);
      // Does the entry span the viewed month/day?
      const entryStartMonth = start.getFullYear() * 12 + start.getMonth();
      const entryEndMonth = end.getFullYear() * 12 + end.getMonth();
      const viewMonthIndex = year * 12 + month;
      if (viewMonthIndex < entryStartMonth || viewMonthIndex > entryEndMonth)
        return false;
      const startDay = start.getMonth() === month ? start.getDate() : 1;
      const endDay = end.getMonth() === month ? end.getDate() : daysInMonth;
      return day >= startDay && day <= endDay;
    });

  const saveEdit = async (dto: {
    leaveTypeId: number;
    startDate: string;
    endDate: string;
    isHalfDay?: boolean;
    reason?: string;
  }) => {
    await leaveService.updateRequest(companyId, editingEntry!.id, dto);
    setEditingEntry(null);
    await onMonthChange();
  };

  const cancelEntry = async (id: number) => {
    if (!confirm("Cancel this leave request?")) return;
    await leaveService.cancelRequest(companyId, id);
    await onMonthChange();
  };

  return (
    <div className="bg-white rounded-lg shadow border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Team Calendar — {monthLabel} {year}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => shiftMonth(-1)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Prev
          </button>
          <button
            onClick={() => {
              setViewDate(new Date());
              onMonthChange();
            }}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Today
          </button>
          <button
            onClick={() => shiftMonth(1)}
            className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1 text-xs">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1 text-center font-medium text-gray-500">
            {d}
          </div>
        ))}
        {blanks.map((i) => (
          <div key={`blank-${i}`} />
        ))}
        {days.map((day) => {
          const dayEntries = entriesForDay(day);
          return (
            <div
              key={day}
              className={`border rounded min-h-16 p-1 ${
                dayEntries.length > 0
                  ? "bg-indigo-50 border-indigo-200"
                  : "border-gray-100"
              }`}
            >
              <div className="font-medium text-gray-700">{day}</div>
              {dayEntries.map((e) => (
                <div
                  key={e.id}
                  className={`mt-1 px-1 py-0.5 rounded text-[10px] truncate relative group ${
                    e.isHalfDay
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-indigo-100 text-indigo-800"
                  }`}
                  title={`${e.employeeName} — ${e.leaveType}`}
                >
                  {e.employeeName} {e.isHalfDay ? "(½)" : ""}
                  <span className="hidden group-hover:inline absolute right-0.5 top-0.5 space-x-1 bg-white/80 rounded px-0.5">
                    <button
                      onClick={() => setEditingEntry(e)}
                      className="text-[9px] text-indigo-700 hover:underline"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => cancelEntry(e.id)}
                      className="text-[9px] text-red-700 hover:underline"
                    >
                      ✕
                    </button>
                  </span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {editingEntry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50">
          <LeaveRequestForm
            types={types}
            onCancel={() => setEditingEntry(null)}
            onSubmit={saveEdit}
            initial={{
              leaveTypeId:
                types.find((t) => t.name === editingEntry.leaveType)?.id || 0,
              startDate: editingEntry.startDate.split("T")[0],
              endDate: editingEntry.endDate.split("T")[0],
              isHalfDay: editingEntry.isHalfDay,
              reason: editingEntry.reason,
            }}
          />
        </div>
      )}
    </div>
  );
}

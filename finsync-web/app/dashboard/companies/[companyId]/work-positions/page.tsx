"use client";

import Loading from "@/components/Loading";
import api from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

interface WorkPosition {
  id: number;
  name: string;
  isActive: boolean;
  employeeCount?: number | string;
  allowanceCount?: number | string;
}

interface PositionAllowance {
  id: number;
  name: string;
  amount: string;
  isTaxable: boolean;
  effectiveFrom: string;
  effectiveTo?: string | null;
  isActive: boolean;
  positionId: number;
}

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
  position_id?: number | null;
}

export default function WorkPositionsPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = Number(params.companyId);

  const [loading, setLoading] = useState(true);
  const [positions, setPositions] = useState<WorkPosition[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [allowancesByPosition, setAllowancesByPosition] = useState<
    Record<number, PositionAllowance[]>
  >({});

  // Position modal
  const [positionModal, setPositionModal] = useState(false);
  const [editingPosition, setEditingPosition] = useState<WorkPosition | null>(
    null,
  );
  const [posForm, setPosForm] = useState({ name: "", isActive: true });
  const [allowanceDrafts, setAllowanceDrafts] = useState<
    Array<{
      name: string;
      amount: string;
      isTaxable: boolean;
      effectiveFrom: string;
      effectiveTo: string;
    }>
  >([]);

  // Allowance modal (position is chosen via dropdown — point 2)
  const [allowanceModal, setAllowanceModal] = useState(false);
  const [allowancePositionId, setAllowancePositionId] = useState<number | "">(
    "",
  );
  const [editingAllowance, setEditingAllowance] =
    useState<PositionAllowance | null>(null);
  const [allowForm, setAllowForm] = useState({
    name: "",
    amount: "",
    isTaxable: true,
    effectiveFrom: new Date().toISOString().split("T")[0],
    effectiveTo: "",
  });

  // Multi-row allowance options for the Add Position Allowance modal
  const [allowRows, setAllowRows] = useState<
    Array<{
      name: string;
      amount: string;
      isTaxable: boolean;
      effectiveFrom: string;
      effectiveTo: string;
    }>
  >([]);

  // Bulk-add allowances to an existing position
  const [bulkPositionId, setBulkPositionId] = useState<number | null>(null);
  const [bulkRows, setBulkRows] = useState<
    Array<{ name: string; amount: string; isTaxable: boolean }>
  >([]);

  const loadAll = async () => {
    try {
      const posRes = await api.get(`/companies/${companyId}/work-positions/with-allowances`);
      const empRes = await api.get(`/companies/${companyId}/employees`);
      const posList: WorkPosition[] = posRes.data || [];
      setPositions(posList);
      setEmployees(empRes.data || []);

      const byPosition: Record<number, PositionAllowance[]> = {};
      for (const p of posList) {
        byPosition[p.id] = (p as any).allowances || [];
      }
      setAllowancesByPosition(byPosition);
    } catch {
      toast.error("Failed to load work positions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!companyId) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const saveBulkAllowances = async () => {
    if (!bulkPositionId) return;
    const valid = bulkRows.filter((a) => a.name.trim() && a.amount);
    if (!valid.length) return;
    try {
      for (const a of valid) {
        await api.post(
          `/companies/${companyId}/work-positions/${bulkPositionId}/allowances`,
          {
            name: a.name.trim(),
            amount: parseFloat(a.amount),
            isTaxable: a.isTaxable,
            effectiveFrom: new Date().toISOString().split("T")[0],
          },
        );
      }
      toast.success(`Added ${valid.length} allowance(s)`);
      setBulkPositionId(null);
      setBulkRows([]);
      await loadAll();
    } catch {
      toast.error("Failed to add allowances");
    }
  };

  if (loading) return <Loading />;

  const coveredEmployees = (positionId: number) =>
    employees.filter((e) => e.position_id === positionId);

  const savePosition = async () => {
    if (!posForm.name.trim()) return;
    try {
      if (editingPosition) {
        await api.patch(
          `/companies/${companyId}/work-positions/${editingPosition.id}`,
          {
            name: posForm.name.trim(),
            isActive: posForm.isActive,
          },
        );
        toast.success("Work position updated");
      } else {
        await api.post(`/companies/${companyId}/work-positions`, {
          name: posForm.name.trim(),
          allowances: allowanceDrafts
            .filter((a) => a.name.trim() && a.amount)
            .map((a) => ({
              name: a.name.trim(),
              amount: parseFloat(a.amount),
              isTaxable: a.isTaxable,
              effectiveFrom:
                a.effectiveFrom || new Date().toISOString().split("T")[0],
              ...(a.effectiveTo && { effectiveTo: a.effectiveTo }),
            })),
        });
        toast.success("Work position created");
      }
      setPositionModal(false);
      setEditingPosition(null);
      setPosForm({ name: "", isActive: true });
      setAllowanceDrafts([]);
      await loadAll();
    } catch {
      toast.error("Failed to save work position");
    }
  };

  const removePosition = async (p: WorkPosition) => {
    if (
      !confirm(
        `Delete position "${p.name}"? Its allowances will be removed too.`,
      )
    )
      return;
    try {
      await api.delete(`/companies/${companyId}/work-positions/${p.id}`);
      toast.success("Work position deleted");
      await loadAll();
    } catch {
      toast.error("Failed to delete work position");
    }
  };

  const openAllowanceModal = (positionId?: number) => {
    setEditingAllowance(null);
    setAllowancePositionId(positionId ?? (positions[0]?.id || ""));
    setAllowRows([
      {
        name: "",
        amount: "",
        isTaxable: true,
        effectiveFrom: new Date().toISOString().split("T")[0],
        effectiveTo: "",
      },
    ]);
    setAllowanceModal(true);
  };

  const openEditAllowance = (a: PositionAllowance) => {
    setEditingAllowance(a);
    setAllowancePositionId(a.positionId);
    setAllowForm({
      name: a.name,
      amount: String(a.amount ?? ""),
      isTaxable: !!a.isTaxable,
      effectiveFrom: a.effectiveFrom
        ? String(a.effectiveFrom).split("T")[0]
        : new Date().toISOString().split("T")[0],
      effectiveTo: a.effectiveTo ? String(a.effectiveTo).split("T")[0] : "",
    });
    setAllowanceModal(true);
  };

  const saveAllowance = async () => {
    if (!allowancePositionId) return;
    try {
      if (editingAllowance) {
        await api.patch(
          `/companies/${companyId}/work-positions/allowances/${editingAllowance.id}`,
          {
            name: allowForm.name.trim(),
            amount: parseFloat(allowForm.amount),
            isTaxable: allowForm.isTaxable,
            effectiveFrom: allowForm.effectiveFrom,
            ...(allowForm.effectiveTo && { effectiveTo: allowForm.effectiveTo }),
          },
        );
        toast.success("Position allowance updated");
      } else {
        const valid = allowRows.filter((a) => a.name.trim() && a.amount);
        if (!valid.length) return;
        for (const a of valid) {
          await api.post(
            `/companies/${companyId}/work-positions/${allowancePositionId}/allowances`,
            {
              name: a.name.trim(),
              amount: parseFloat(a.amount),
              isTaxable: a.isTaxable,
              effectiveFrom: a.effectiveFrom,
              ...(a.effectiveTo && { effectiveTo: a.effectiveTo }),
            },
          );
        }
        toast.success(`Added ${valid.length} allowance(s)`);
      }
      setAllowanceModal(false);
      setEditingAllowance(null);
      await loadAll();
    } catch {
      toast.error("Failed to save position allowance");
    }
  };

  const removeAllowance = async (a: PositionAllowance) => {
    if (!confirm(`Delete allowance "${a.name}"?`)) return;
    try {
      await api.delete(
        `/companies/${companyId}/work-positions/allowances/${a.id}`,
      );
      toast.success("Position allowance deleted");
      await loadAll();
    } catch {
      toast.error("Failed to delete position allowance");
    }
  };

  const money = (n: number | string) =>
    `$${Number(n || 0).toLocaleString(undefined, {
      maximumFractionDigits: 2,
    })}`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Work Positions</h1>
          <p className="text-sm text-gray-500">
            Positions drive position-based allowances — every employee assigned
            to a position automatically receives its allowances during payroll.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/companies/${companyId}/personnel/payroll?tab=compensation`}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm"
          >
            Manage Allowances
          </Link>
          <button
            onClick={() => {
              setEditingPosition(null);
              setPosForm({ name: "", isActive: true });
              setAllowanceDrafts([]);
              setPositionModal(true);
            }}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
          >
            + Add Position
          </button>
        </div>
      </div>

      {positions.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          No work positions yet. Create one to start assigning position-based
          allowances.
        </div>
      ) : (
        <div className="space-y-4">
          {positions.map((p) => {
            const allowances = allowancesByPosition[p.id] || [];
            const covered = coveredEmployees(p.id);
            return (
              <div
                key={p.id}
                className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden"
              >
                {/* Position header */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-gray-800">{p.name}</h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${
                        p.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-500"
                      }`}
                    >
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Number(p.employeeCount || covered.length)} employee(s)
                    </span>
                    <span className="text-xs text-gray-500">
                      {Number(p.allowanceCount || allowances.length)}{" "}
                      allowance(s)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setBulkPositionId(p.id);
                        setBulkRows([{ name: "", amount: "", isTaxable: true }]);
                      }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-50"
                    >
                      Bulk Add
                    </button>
                    <button
                      onClick={() => openAllowanceModal(p.id)}
                      className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                    >
                      + Allowance
                    </button>
                    <button
                      onClick={() => {
                        setEditingPosition(p);
                        setPosForm({ name: p.name, isActive: !!p.isActive });
                        setPositionModal(true);
                      }}
                      className="px-3 py-1.5 border border-gray-300 text-gray-700 text-xs rounded-md hover:bg-gray-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => removePosition(p)}
                      className="px-3 py-1.5 border border-red-200 text-red-600 text-xs rounded-md hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {bulkPositionId === p.id && (
                  <div className="px-4 py-3 bg-indigo-50/40 border-b border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-medium text-gray-600">
                        Add multiple allowances to {p.name}
                      </p>
                      <button
                        onClick={() => setBulkPositionId(null)}
                        className="text-xs text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                    {bulkRows.map((a, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded p-2 space-y-1.5 bg-white"
                      >
                        <div className="flex items-end gap-2">
                          <div className="flex-1">
                            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
                              Allowance Name
                            </label>
                            <input
                              value={a.name}
                              onChange={(e) => {
                                const next = [...bulkRows];
                                next[i] = { ...next[i], name: e.target.value };
                                setBulkRows(next);
                              }}
                              placeholder="e.g. Transportation"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                            />
                          </div>
                          <div className="w-24">
                            <label className="block text-[10px] font-medium text-gray-500 mb-0.5">
                              Amount
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={a.amount}
                              onChange={(e) => {
                                const next = [...bulkRows];
                                next[i] = {
                                  ...next[i],
                                  amount: e.target.value,
                                };
                                setBulkRows(next);
                              }}
                              placeholder="0.00"
                              className="w-full px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                            />
                          </div>
                          <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap pb-1">
                            <input
                              type="checkbox"
                              checked={a.isTaxable}
                              onChange={(e) => {
                                const next = [...bulkRows];
                                next[i] = {
                                  ...next[i],
                                  isTaxable: e.target.checked,
                                };
                                setBulkRows(next);
                              }}
                              className="h-3.5 w-3.5"
                            />
                            Taxable
                          </label>
                          <button
                            onClick={() =>
                              setBulkRows(bulkRows.filter((_, j) => j !== i))
                            }
                            className="text-xs text-red-500 hover:text-red-700 pb-1"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          setBulkRows([
                            ...bulkRows,
                            { name: "", amount: "", isTaxable: true },
                          ])
                        }
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        + Add row
                      </button>
                      <button
                        onClick={saveBulkAllowances}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                      >
                        Save All
                      </button>
                    </div>
                  </div>
                )}

                {/* Allowances table with Linked Employees coverage */}
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-gray-500 text-xs uppercase border-b bg-gray-50/50">
                        <th className="text-left px-4 py-2">Allowance</th>
                        <th className="text-right px-4 py-2">Amount</th>
                        <th className="text-left px-4 py-2">Taxable</th>
                        <th className="text-left px-4 py-2">Effective</th>
                        <th className="text-left px-4 py-2">
                          Linked Employees
                        </th>
                        <th className="text-right px-4 py-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allowances.length === 0 ? (
                        <tr>
                          <td
                            colSpan={6}
                            className="px-4 py-4 text-center text-gray-400"
                          >
                            No allowances for this position yet.
                          </td>
                        </tr>
                      ) : (
                        allowances.map((a) => (
                          <tr key={a.id} className="border-b border-gray-100">
                            <td className="px-4 py-2 font-medium text-gray-800">
                              {a.name}
                            </td>
                            <td className="px-4 py-2 text-right text-gray-900">
                              {money(a.amount)}
                            </td>
                            <td className="px-4 py-2">
                              <span
                                className={`px-2 py-0.5 rounded-full text-xs ${
                                  a.isTaxable
                                    ? "bg-red-100 text-red-700"
                                    : "bg-green-100 text-green-700"
                                }`}
                              >
                                {a.isTaxable ? "Taxable" : "Non-taxable"}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-gray-900 whitespace-nowrap">
                              {new Date(a.effectiveFrom).toLocaleDateString()}
                              {a.effectiveTo
                                ? ` → ${new Date(
                                    a.effectiveTo,
                                  ).toLocaleDateString()}`
                                : ""}
                            </td>
                            <td className="px-4 py-2">
                              {covered.length === 0 ? (
                                <span className="text-gray-400 text-xs">
                                  No employees in this position
                                </span>
                              ) : (
                                <div className="flex flex-wrap gap-1">
                                  {covered.map((e) => (
                                    <span
                                      key={e.id}
                                      className="px-1.5 py-0.5 bg-blue-50 text-blue-700 text-xs rounded"
                                      title={e.employeeCode}
                                    >
                                      {e.firstName} {e.lastName}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-2 text-right whitespace-nowrap">
                              <button
                                onClick={() => openEditAllowance(a)}
                                className="text-xs text-indigo-600 hover:text-indigo-800 mr-2"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => removeAllowance(a)}
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
              </div>
            );
          })}
        </div>
      )}

      {/* Position modal */}
      {positionModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">
              {editingPosition ? "Edit Work Position" : "Add Work Position"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Position Name
                </label>
                <input
                  value={posForm.name}
                  onChange={(e) =>
                    setPosForm({ ...posForm, name: e.target.value })
                  }
                  placeholder="e.g. Foreman"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                />
              </div>
              {editingPosition && (
                <label className="flex items-center gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={posForm.isActive}
                    onChange={(e) =>
                      setPosForm({ ...posForm, isActive: e.target.checked })
                    }
                    className="h-4 w-4"
                  />
                  Active
                </label>
              )}
              {!editingPosition && (
                <div className="border-t border-gray-200 pt-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-600">
                      Allowance Options (optional)
                    </p>
                    <button
                      onClick={() =>
                        setAllowanceDrafts([
                          ...allowanceDrafts,
                          {
                            name: "",
                            amount: "",
                            isTaxable: true,
                            effectiveFrom: new Date()
                              .toISOString()
                              .split("T")[0],
                            effectiveTo: "",
                          },
                        ])
                      }
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      + Add Allowance
                    </button>
                  </div>
                  {allowanceDrafts.length === 0 ? (
                    <p className="text-xs text-gray-400">
                      Add allowance options (e.g. Housing, Transport, Site Hazard)
                      that will apply to this position automatically.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {allowanceDrafts.map((a, i) => (
                        <div
                          key={i}
                          className="space-y-1.5 bg-gray-50 rounded-md p-2"
                        >
                          <div className="flex items-center gap-2">
                            <input
                              value={a.name}
                              onChange={(e) => {
                                const next = [...allowanceDrafts];
                                next[i] = { ...next[i], name: e.target.value };
                                setAllowanceDrafts(next);
                              }}
                              placeholder="Allowance name"
                              className="flex-1 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                            />
                            <input
                              type="number"
                              step="0.01"
                              value={a.amount}
                              onChange={(e) => {
                                const next = [...allowanceDrafts];
                                next[i] = {
                                  ...next[i],
                                  amount: e.target.value,
                                };
                                setAllowanceDrafts(next);
                              }}
                              placeholder="Amount"
                              className="w-24 px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                            />
                            <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                              <input
                                type="checkbox"
                                checked={a.isTaxable}
                                onChange={(e) => {
                                  const next = [...allowanceDrafts];
                                  next[i] = {
                                    ...next[i],
                                    isTaxable: e.target.checked,
                                  };
                                  setAllowanceDrafts(next);
                                }}
                                className="h-3.5 w-3.5"
                              />
                              Taxable
                            </label>
                            <button
                              onClick={() =>
                                setAllowanceDrafts(
                                  allowanceDrafts.filter((_, j) => j !== i),
                                )
                              }
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="date"
                              value={a.effectiveFrom}
                              onChange={(e) => {
                                const next = [...allowanceDrafts];
                                next[i] = {
                                  ...next[i],
                                  effectiveFrom: e.target.value,
                                };
                                setAllowanceDrafts(next);
                              }}
                              title="Effective from"
                              className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                            />
                            <input
                              type="date"
                              value={a.effectiveTo}
                              onChange={(e) => {
                                const next = [...allowanceDrafts];
                                next[i] = {
                                  ...next[i],
                                  effectiveTo: e.target.value,
                                };
                                setAllowanceDrafts(next);
                              }}
                              title="Effective to (optional)"
                              className="px-2 py-1 border border-gray-300 rounded text-xs bg-white"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setPositionModal(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={savePosition}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Allowance modal (position dropdown — point 2) */}
      {allowanceModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl text-gray-900">
            <h2 className="text-xl font-bold mb-4">
              {editingAllowance
                ? "Edit Position Allowance"
                : "Add Position Allowance"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Position *
                </label>
                <select
                  value={allowancePositionId}
                  onChange={(e) =>
                    setAllowancePositionId(
                      e.target.value ? Number(e.target.value) : "",
                    )
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  <option value="">Select position...</option>
                  {positions.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              {editingAllowance ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Allowance Name *
                    </label>
                    <input
                      value={allowForm.name}
                      onChange={(e) =>
                        setAllowForm({ ...allowForm, name: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Amount (per month) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={allowForm.amount}
                      onChange={(e) =>
                        setAllowForm({ ...allowForm, amount: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Effective From
                      </label>
                      <input
                        type="date"
                        value={allowForm.effectiveFrom}
                        onChange={(e) =>
                          setAllowForm({
                            ...allowForm,
                            effectiveFrom: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Effective To
                      </label>
                      <input
                        type="date"
                        value={allowForm.effectiveTo}
                        onChange={(e) =>
                          setAllowForm({
                            ...allowForm,
                            effectiveTo: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                      />
                    </div>
                  </div>
                  <label className="flex items-center gap-2 text-sm text-gray-700">
                    <input
                      type="checkbox"
                      checked={allowForm.isTaxable}
                      onChange={(e) =>
                        setAllowForm({
                          ...allowForm,
                          isTaxable: e.target.checked,
                        })
                      }
                      className="h-4 w-4"
                    />
                    Taxable (adds to gross; taxed per salary-range rules)
                  </label>
                </>
              ) : (
                <div className="border-t border-gray-200 pt-3">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-xs font-medium text-gray-600">
                      Allowance Options
                    </p>
                    <button
                      onClick={() =>
                        setAllowRows([
                          ...allowRows,
                          {
                            name: "",
                            amount: "",
                            isTaxable: true,
                            effectiveFrom: new Date()
                              .toISOString()
                              .split("T")[0],
                            effectiveTo: "",
                          },
                        ])
                      }
                      className="text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      + Add another
                    </button>
                  </div>
                  <div className="space-y-2">
                    {allowRows.map((a, i) => (
                      <div
                        key={i}
                        className="border border-gray-200 rounded-md p-2 space-y-2"
                      >
                        <div className="flex items-center gap-2">
                          <input
                            value={a.name}
                            onChange={(e) => {
                              const next = [...allowRows];
                              next[i] = { ...next[i], name: e.target.value };
                              setAllowRows(next);
                            }}
                            placeholder="Allowance name"
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                          />
                          <input
                            type="number"
                            step="0.01"
                            value={a.amount}
                            onChange={(e) => {
                              const next = [...allowRows];
                              next[i] = { ...next[i], amount: e.target.value };
                              setAllowRows(next);
                            }}
                            placeholder="Amount"
                            className="w-24 px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                          />
                          <label className="flex items-center gap-1 text-xs text-gray-600 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={a.isTaxable}
                              onChange={(e) => {
                                const next = [...allowRows];
                                next[i] = {
                                  ...next[i],
                                  isTaxable: e.target.checked,
                                };
                                setAllowRows(next);
                              }}
                              className="h-4 w-4"
                            />
                            Taxable
                          </label>
                          {allowRows.length > 1 && (
                            <button
                              onClick={() =>
                                setAllowRows(
                                  allowRows.filter((_, j) => j !== i),
                                )
                              }
                              className="text-xs text-red-500 hover:text-red-700"
                            >
                              ✕
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="date"
                            value={a.effectiveFrom}
                            onChange={(e) => {
                              const next = [...allowRows];
                              next[i] = {
                                ...next[i],
                                effectiveFrom: e.target.value,
                              };
                              setAllowRows(next);
                            }}
                            title="Effective from"
                            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                          />
                          <input
                            type="date"
                            value={a.effectiveTo}
                            onChange={(e) => {
                              const next = [...allowRows];
                              next[i] = {
                                ...next[i],
                                effectiveTo: e.target.value,
                              };
                              setAllowRows(next);
                            }}
                            title="Effective to (optional)"
                            className="px-2 py-1 border border-gray-300 rounded text-sm bg-white"
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setAllowanceModal(false)}
                  className="px-4 py-2 text-sm text-gray-600"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAllowance}
                  className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

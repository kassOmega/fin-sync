"use client";

import api from "@/lib/api";
import type {
  PayrollAllowance,
  PayrollBonus,
  PayrollWithholding,
} from "@/lib/services/compensation";
import { compensationService } from "@/lib/services/compensation";
import type { OvertimeEntry, OvertimeRate } from "@/lib/services/overtime";
import { overtimeService } from "@/lib/services/overtime";
import { payrollService } from "@/lib/services/payroll";
import type {
  Payroll,
  PayrollItem,
  PayrollSourceType,
  Payslip,
} from "@/lib/services/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

type TabType = "runs" | "overtime" | "compensation" | "audit" | "settings";

interface AuditRow {
  id: number;
  title: string;
  startDate: string;
  endDate: string;
  status: string;
  projectId: number | null;
  projectName: string | null;
  expenseId: number | null;
  expenseAmount: number | null;
  expenseNote: string | null;
  ledgerStatus: string;
  journalEntry: string | null;
  journalSource: string | null;
}

interface RegistryRow {
  employeeId: number;
  firstName: string;
  lastName: string;
  employeeCode: string;
  payrollCount: number;
  totalBase: number;
  totalOvertime: number;
  totalAllowances: number;
  totalBonuses: number;
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
}

export default function PayrollPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = Number(params.companyId);
  const [tab, setTab] = useState<TabType>("runs");
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [selectedPayroll, setSelectedPayroll] = useState<Payroll | null>(null);
  const [items, setItems] = useState<PayrollItem[]>([]);
  const [payslip, setPayslip] = useState<Payslip | null>(null);
  const [loading, setLoading] = useState(true);
  const [showGenerate, setShowGenerate] = useState(false);

  const [rates, setRates] = useState<OvertimeRate[]>([]);
  const [otEntries, setOtEntries] = useState<OvertimeEntry[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);

  const [allowances, setAllowances] = useState<PayrollAllowance[]>([]);
  const [bonuses, setBonuses] = useState<PayrollBonus[]>([]);
  const [withholdings, setWithholdings] = useState<PayrollWithholding[]>([]);

  // Audit & Registry
  const [auditRows, setAuditRows] = useState<AuditRow[]>([]);
  const [registryRows, setRegistryRows] = useState<RegistryRow[]>([]);
  const [auditProjectFilter, setAuditProjectFilter] = useState("");
  const [registryLoading, setRegistryLoading] = useState(false);

  const loadAudit = async () => {
    try {
      const res = await api.get(
        `/companies/${companyId}/payroll/audit${
          auditProjectFilter ? `?projectId=${auditProjectFilter}` : ""
        }`,
      );
      setAuditRows(res.data || []);
    } catch {
      setAuditRows([]);
    }
  };

  const loadRegistry = async () => {
    setRegistryLoading(true);
    try {
      const res = await api.get(`/companies/${companyId}/payroll/registry`);
      setRegistryRows(res.data || []);
    } catch {
      setRegistryRows([]);
    } finally {
      setRegistryLoading(false);
    }
  };

  // Government / Statutory deduction rules (from payroll_deductions)
  const [govDeductions, setGovDeductions] = useState<
    Array<{
      id: number;
      name: string;
      type: string;
      value: string;
      isActive: boolean;
    }>
  >([]);
  const [showGovForm, setShowGovForm] = useState(false);
  const [editingGovId, setEditingGovId] = useState<number | null>(null);
  const [govForm, setGovForm] = useState({
    name: "",
    type: "FIXED",
    value: "",
  });
  const [savingGov, setSavingGov] = useState(false);

  const loadGovDeductions = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/payroll/deductions`);
      setGovDeductions(res.data || []);
    } catch {
      setGovDeductions([]);
    }
  };

  // Payroll Settings — versioned tax/pension config
  const [config, setConfig] = useState<Record<string, any> | null>(null);
  const [configHistory, setConfigHistory] = useState<
    Array<Record<string, any>>
  >([]);
  const [showTaxModal, setShowTaxModal] = useState(false);
  const [openHistory, setOpenHistory] = useState(false);

  const loadConfigHistory = async () => {
    try {
      const res = await api.get(
        `/companies/${companyId}/payroll/config/history`,
      );
      setConfigHistory(res.data || []);
    } catch {
      setConfigHistory([]);
    }
  };
  const [bracketDraft, setBracketDraft] = useState<
    Array<{ upTo: string; rate: string; deduct: string }>
  >([]);
  const [pensionDraft, setPensionDraft] = useState("7");
  const [employerPensionDraft, setEmployerPensionDraft] = useState("11");
  const [otDraft, setOtDraft] = useState("1.5");
  const [effectiveFromDraft, setEffectiveFromDraft] = useState(
    new Date().toISOString().split("T")[0],
  );

  const loadSettings = async () => {
    try {
      const res = await api.get(`/companies/${companyId}/payroll/config`);
      const c = res.data;
      setConfig(c);
      const brackets =
        typeof c?.tax_brackets === "string"
          ? JSON.parse(c.tax_brackets)
          : c?.tax_brackets || [];
      setBracketDraft(
        brackets.map((b: any) => ({
          upTo: b.upTo === null ? "" : String(b.upTo),
          rate: String(b.rate),
          deduct: String(b.deduct),
        })),
      );
      setPensionDraft(String(c?.employee_pension_rate ?? 7));
      setEmployerPensionDraft(String(c?.employer_pension_rate ?? 11));
      setOtDraft(String(c?.ot_multiplier ?? 1.5));
      setEffectiveFromDraft(
        c?.effective_from
          ? String(c.effective_from).split("T")[0]
          : new Date().toISOString().split("T")[0],
      );
    } catch {
      setConfig(null);
    }
  };

  const saveSettings = async () => {
    const parsed = bracketDraft.map((b) => ({
      upTo: b.upTo === "" ? null : parseFloat(b.upTo),
      rate: parseFloat(b.rate) || 0,
      deduct: parseFloat(b.deduct) || 0,
    }));
    try {
      const res = await api.post(`/companies/${companyId}/payroll/config`, {
        effectiveFrom: effectiveFromDraft,
        taxBrackets: parsed,
        employeePensionRate: parseFloat(pensionDraft) || 7,
        employerPensionRate: parseFloat(employerPensionDraft) || 11,
        standardAllowanceAmount: 0,
        otMultiplier: parseFloat(otDraft) || 1.5,
        defaultPayFrequency: "MONTHLY",
      });
      setConfig(res.data);
      toast.success(
        "Payroll config version created (effective " + effectiveFromDraft + ")",
      );
    } catch {
      toast.error("Failed to save payroll config");
    }
  };

  // Payroll Runs filters
  const [payrollStatus, setPayrollStatus] = useState("");
  const [payrollStart, setPayrollStart] = useState("");
  const [payrollEnd, setPayrollEnd] = useState("");

  const loadPayrolls = async () => {
    setPayrolls(
      await payrollService.list(companyId, {
        ...(payrollStatus && { status: payrollStatus }),
        ...(payrollStart && { startDate: payrollStart }),
        ...(payrollEnd && { endDate: payrollEnd }),
      }),
    );
  };

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    Promise.all([
      payrollService
        .list(companyId, {
          ...(payrollStatus && { status: payrollStatus }),
          ...(payrollStart && { startDate: payrollStart }),
          ...(payrollEnd && { endDate: payrollEnd }),
        })
        .then(setPayrolls),
      overtimeService.getRates(companyId).then(setRates),
      overtimeService.getEntries(companyId).then(setOtEntries),
      compensationService.getAllowances(companyId).then(setAllowances),
      compensationService.getBonuses(companyId).then(setBonuses),
      compensationService.getWithholdings(companyId).then(setWithholdings),
    ])
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, payrollStatus, payrollStart, payrollEnd]);

  const loadItems = async (payroll: Payroll) => {
    setSelectedPayroll(payroll);
    const data = await payrollService.items(companyId, payroll.id);
    setItems(data);
    setPayslip(null);
  };

  const loadPayslip = async (itemId: number) => {
    if (!selectedPayroll) return;
    const data = await payrollService.payslip(
      companyId,
      selectedPayroll.id,
      itemId,
    );
    setPayslip(data);
  };

  const handleApprove = async (id: number) => {
    await payrollService.approve(companyId, id);
    await loadPayrolls();
  };

  const handleGenerate = async (dto: {
    title: string;
    startDate: string;
    endDate: string;
    sourceType?: PayrollSourceType;
  }) => {
    await payrollService.generate(companyId, dto);
    setShowGenerate(false);
    await loadPayrolls();
  };

  const money = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const sourceBadge = (s?: PayrollSourceType) => {
    const map: Record<string, string> = {
      ATTENDANCE: "bg-blue-100 text-blue-700",
      TIMESHEETS: "bg-purple-100 text-purple-700",
      ALL: "bg-emerald-100 text-emerald-700",
    };
    const label = s || "ALL";
    return (
      <span
        className={`px-2 py-0.5 rounded-full text-xs font-medium ${map[label] || ""}`}
      >
        {label}
      </span>
    );
  };

  if (loading)
    return <div className="p-8 text-gray-500">Loading payroll...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payroll</h1>
        <button
          onClick={() => setShowGenerate(true)}
          className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
        >
          + Generate Payroll
        </button>
      </div>

      <div className="flex gap-2 mb-6 bg-gray-100 rounded-lg p-1 max-w-fit">
        {(
          [
            ["runs", "Payroll Runs"],
            ["overtime", "Overtime"],
            ["compensation", "Compensation"],
            ["audit", "Audit & Registry"],
            ["settings", "Deductions & Tax"],
          ] as [TabType, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            onClick={() => {
              setTab(key);
              if (key === "audit") {
                loadAudit();
                loadRegistry();
              }
              if (key === "settings") {
                loadSettings();
                loadGovDeductions();
                loadConfigHistory();
              }
            }}
            className={`px-4 py-2 rounded-md text-sm font-medium ${tab === key ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "runs" && (
        <>
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <select
              value={payrollStatus}
              onChange={(e) => setPayrollStatus(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            >
              <option value="">All Status</option>
              <option value="DRAFT">DRAFT</option>
              <option value="APPROVED">APPROVED</option>
            </select>
            <input
              type="date"
              value={payrollStart}
              onChange={(e) => setPayrollStart(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
            <input
              type="date"
              value={payrollEnd}
              onChange={(e) => setPayrollEnd(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          </div>
          <PayrollRunsTab
            payrolls={payrolls}
            selectedPayroll={selectedPayroll}
            items={items}
            payslip={payslip}
            money={money}
            sourceBadge={sourceBadge}
            onSelect={loadItems}
            onViewPayslip={loadPayslip}
            onBackPayslip={() => setPayslip(null)}
            onApprove={handleApprove}
          />
        </>
      )}
      {tab === "overtime" && (
        <OvertimeTab
          companyId={companyId}
          rates={rates}
          entries={otEntries}
          employees={employees}
          setRates={setRates}
          setEntries={setOtEntries}
          money={money}
        />
      )}
      {tab === "compensation" && (
        <CompensationTab
          companyId={companyId}
          allowances={allowances}
          bonuses={bonuses}
          withholdings={withholdings}
          employees={employees}
          setAllowances={setAllowances}
          setBonuses={setBonuses}
          setWithholdings={setWithholdings}
          money={money}
        />
      )}
      {tab === "audit" && (
        <div className="space-y-6">
          {/* Compensation Registry — duplicate-payment cross-check */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h3 className="font-semibold text-gray-900">
                Compensation Registry
              </h3>
              <p className="text-xs text-gray-500">
                Per-employee totals across ALL non-voided payroll runs (any
                project scope) — verify no double-dipping.
              </p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b">
                    <th className="text-left px-4 py-2">Employee</th>
                    <th className="text-right px-4 py-2">Runs</th>
                    <th className="text-right px-4 py-2">Base</th>
                    <th className="text-right px-4 py-2">OT</th>
                    <th className="text-right px-4 py-2">Allow.</th>
                    <th className="text-right px-4 py-2">Bonus</th>
                    <th className="text-right px-4 py-2">Gross</th>
                    <th className="text-right px-4 py-2">Deduct.</th>
                    <th className="text-right px-4 py-2">Net</th>
                  </tr>
                </thead>
                <tbody>
                  {registryLoading ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        Loading registry...
                      </td>
                    </tr>
                  ) : registryRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={9}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        No payroll items recorded yet.
                      </td>
                    </tr>
                  ) : (
                    registryRows.map((r) => (
                      <tr
                        key={r.employeeId}
                        className="border-b border-gray-100"
                      >
                        <td className="px-4 py-2 font-medium text-gray-800">
                          {r.firstName} {r.lastName}{" "}
                          <span className="text-gray-400 font-normal">
                            ({r.employeeCode})
                          </span>
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {r.payrollCount}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {money(r.totalBase)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {money(r.totalOvertime)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {money(r.totalAllowances)}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {money(r.totalBonuses)}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          {money(r.totalGross)}
                        </td>
                        <td className="px-4 py-2 text-right text-red-600">
                          {money(r.totalDeductions)}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-green-700">
                          {money(r.totalNet)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Payroll Audit — project ↔ expense ↔ ledger cross-reference */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between flex-wrap gap-2">
              <div>
                <h3 className="font-semibold text-gray-900">Payroll Audit</h3>
                <p className="text-xs text-gray-500">
                  Cross-references each run to its project scope, linked company
                  expense, and ledger journal.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  placeholder="Project ID filter"
                  value={auditProjectFilter}
                  onChange={(e) => setAuditProjectFilter(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") loadAudit();
                  }}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md w-40"
                />
                <button
                  onClick={loadAudit}
                  className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                >
                  Apply
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b">
                    <th className="text-left px-4 py-2">Run</th>
                    <th className="text-left px-4 py-2">Period</th>
                    <th className="text-left px-4 py-2">Status</th>
                    <th className="text-left px-4 py-2">Project</th>
                    <th className="text-left px-4 py-2">Expense</th>
                    <th className="text-left px-4 py-2">Ledger</th>
                    <th className="text-left px-4 py-2">Journal</th>
                  </tr>
                </thead>
                <tbody>
                  {auditRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-4 py-6 text-center text-gray-500"
                      >
                        No payroll runs to audit.
                      </td>
                    </tr>
                  ) : (
                    auditRows.map((a) => (
                      <tr key={a.id} className="border-b border-gray-100">
                        <td className="px-4 py-2 font-medium text-gray-800">
                          {a.title}
                        </td>
                        <td className="px-4 py-2 text-gray-900 whitespace-nowrap">
                          {new Date(a.startDate).toLocaleDateString()} →{" "}
                          {new Date(a.endDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              a.status === "PAID"
                                ? "bg-green-100 text-green-700"
                                : a.status === "APPROVED"
                                  ? "bg-blue-100 text-blue-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {a.status}
                          </span>
                        </td>
                        <td className="px-4 py-2 text-gray-900">
                          {a.projectName || (
                            <span className="text-gray-400">Company-wide</span>
                          )}
                        </td>
                        <td className="px-4 py-2 text-gray-900">
                          {a.expenseId ? (
                            <>
                              $
                              {Number(a.expenseAmount || 0).toLocaleString(
                                undefined,
                                { maximumFractionDigits: 2 },
                              )}
                              <span className="text-gray-400 block text-xs">
                                Exp #{a.expenseId}
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-400">—</span>
                          )}
                        </td>
                        <td className="px-4 py-2">
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              a.ledgerStatus === "POSTED"
                                ? "bg-green-100 text-green-700"
                                : "bg-red-100 text-red-700"
                            }`}
                          >
                            {a.ledgerStatus}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-gray-600">
                          {a.journalEntry || "—"}
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

      {tab === "settings" && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900">
                  Payroll Settings — Tax & Pension
                </h3>
                <p className="text-xs text-gray-500">
                  Editing creates a NEW version effective from the selected
                  date. Past payroll runs keep their historical brackets.
                </p>
              </div>
              {config?.id && (
                <span className="text-xs text-gray-500">
                  Current version #{config.id} (effective{" "}
                  {config.effective_from
                    ? new Date(config.effective_from).toLocaleDateString()
                    : "—"}
                  )
                </span>
              )}
            </div>
            <div className="p-4 space-y-4">
              {/* Active rules — clean read-only card */}
              <div className="border border-gray-200 rounded-md p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">
                    Active Tax Rules
                    <span className="ml-2 text-xs font-normal text-gray-500">
                      v{config?.id ?? "—"} · effective{" "}
                      {config?.effective_from
                        ? new Date(config.effective_from).toLocaleDateString()
                        : "—"}
                    </span>
                  </h4>
                  <button
                    onClick={() => {
                      loadSettings();
                      setShowTaxModal(true);
                    }}
                    className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
                  >
                    Update Tax Rules
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase border-b">
                      <th className="text-left px-2 py-1">Salary Up To</th>
                      <th className="text-left px-2 py-1">Tax Rate</th>
                      <th className="text-left px-2 py-1">Deduct</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(config?.tax_brackets
                      ? typeof config.tax_brackets === "string"
                        ? JSON.parse(config.tax_brackets)
                        : config.tax_brackets
                      : []
                    ).map((b: any, i: number) => (
                      <tr key={i} className="border-b border-gray-50">
                        <td className="px-2 py-1 text-gray-900">
                          {b.upTo === null
                            ? "∞"
                            : `${Number(b.upTo).toLocaleString()} ETB`}
                        </td>
                        <td className="px-2 py-1 text-gray-900">
                          {Number(b.rate) * 100}%
                        </td>
                        <td className="px-2 py-1 text-gray-900">
                          {Number(b.deduct).toLocaleString()} ETB
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="mt-4 grid grid-cols-2 gap-3 border-t border-gray-100 pt-3">
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Employee Pension
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {Number(config?.employee_pension_rate ?? 0)}%
                    </p>
                    <p className="text-xs text-gray-400">
                      deducted from each employee's gross pay
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">
                      Employer Pension
                    </p>
                    <p className="text-lg font-semibold text-gray-900">
                      {Number(config?.employer_pension_rate ?? 0)}%
                    </p>
                    <p className="text-xs text-gray-400">
                      contributed on top by the company
                    </p>
                  </div>
                </div>
                <div className="mt-2 text-sm text-gray-600">
                  <strong>OT Multiplier:</strong>{" "}
                  {Number(config?.ot_multiplier ?? 0)}×
                </div>
              </div>

              {/* Version History — accordion (audit only) */}
              <div className="border border-gray-200 rounded-md">
                <button
                  onClick={() => {
                    setOpenHistory(!openHistory);
                    if (!openHistory) loadConfigHistory();
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Version History
                  <span className="text-gray-400">
                    {openHistory ? "▾" : "▸"}
                  </span>
                </button>
                {openHistory && (
                  <div className="border-t border-gray-200 px-4 py-3">
                    {configHistory.length === 0 ? (
                      <p className="text-sm text-gray-500">
                        No past versions recorded.
                      </p>
                    ) : (
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-gray-500 text-xs uppercase border-b">
                            <th className="text-left px-2 py-1">Version</th>
                            <th className="text-left px-2 py-1">
                              Effective From
                            </th>
                            <th className="text-left px-2 py-1">
                              Superseded At
                            </th>
                            <th className="text-right px-2 py-1">
                              Emp Pension
                            </th>
                            <th className="text-right px-2 py-1">OT Mult</th>
                          </tr>
                        </thead>
                        <tbody>
                          {configHistory.map((h) => (
                            <tr key={h.id} className="border-b border-gray-50">
                              <td className="px-2 py-1 text-gray-900">
                                v{h.id}
                              </td>
                              <td className="px-2 py-1 text-gray-900">
                                {new Date(
                                  h.effective_from,
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-2 py-1 text-gray-500">
                                {h.superseded_at
                                  ? new Date(
                                      h.superseded_at,
                                    ).toLocaleDateString()
                                  : "Active"}
                              </td>
                              <td className="px-2 py-1 text-right text-gray-900">
                                {Number(h.employee_pension_rate)}%
                              </td>
                              <td className="px-2 py-1 text-right text-gray-900">
                                {Number(h.ot_multiplier)}×
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>

              {/* Update Tax Rules — clean modal (saves a NEW version behind the scenes) */}
              {showTaxModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50 p-4">
                  <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        Update Tax Rules
                      </h2>
                      <button
                        onClick={() => setShowTaxModal(false)}
                        className="text-gray-500 hover:text-gray-700"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Effective From
                          <InfoTag text="Runs starting this date use the new rules. Runs BEFORE this date keep the previous brackets (versioning — past payroll is never recalculated)." />
                        </label>
                        <input
                          type="date"
                          value={effectiveFromDraft}
                          onChange={(e) =>
                            setEffectiveFromDraft(e.target.value)
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">
                          Tax Brackets
                          <InfoTag text="Ethiopian shortcut: tax = salary × rate − deduct for the bracket containing the salary." />
                        </label>
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-gray-500 text-xs uppercase border-b">
                              <th className="text-left px-2 py-1">
                                Salary Up To
                              </th>
                              <th className="text-left px-2 py-1">
                                Tax Rate (%)
                              </th>
                              <th className="text-left px-2 py-1">Deduct</th>
                              <th className="w-10"></th>
                            </tr>
                          </thead>
                          <tbody>
                            {bracketDraft.map((b, i) => (
                              <tr key={i} className="border-b border-gray-50">
                                <td className="px-2 py-1">
                                  <input
                                    type="text"
                                    placeholder="∞ (blank)"
                                    value={b.upTo}
                                    onChange={(e) => {
                                      const next = [...bracketDraft];
                                      next[i] = {
                                        ...next[i],
                                        upTo: e.target.value,
                                      };
                                      setBracketDraft(next);
                                    }}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={b.rate}
                                    onChange={(e) => {
                                      const next = [...bracketDraft];
                                      next[i] = {
                                        ...next[i],
                                        rate: e.target.value,
                                      };
                                      setBracketDraft(next);
                                    }}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-2 py-1">
                                  <input
                                    type="number"
                                    step="0.01"
                                    value={b.deduct}
                                    onChange={(e) => {
                                      const next = [...bracketDraft];
                                      next[i] = {
                                        ...next[i],
                                        deduct: e.target.value,
                                      };
                                      setBracketDraft(next);
                                    }}
                                    className="w-24 px-2 py-1 border border-gray-300 rounded"
                                  />
                                </td>
                                <td className="px-2 py-1 text-right">
                                  <button
                                    onClick={() =>
                                      setBracketDraft(
                                        bracketDraft.filter((_, j) => j !== i),
                                      )
                                    }
                                    className="text-xs text-red-500 hover:text-red-700"
                                  >
                                    ✕
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        <button
                          onClick={() =>
                            setBracketDraft([
                              ...bracketDraft,
                              { upTo: "", rate: "", deduct: "" },
                            ])
                          }
                          className="mt-2 text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          + Add bracket
                        </button>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                          Pension
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Employee Pension (%)
                              <InfoTag text="% deducted from each employee's gross pay (statutory 7% default)." />
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={pensionDraft}
                              onChange={(e) => setPensionDraft(e.target.value)}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Employer Pension (%)
                              <InfoTag text="% the company contributes on top of pay (statutory 11% default)." />
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              value={employerPensionDraft}
                              onChange={(e) =>
                                setEmployerPensionDraft(e.target.value)
                              }
                              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                            />
                          </div>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">
                          Overtime
                        </p>
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">
                            OT Multiplier
                            <InfoTag text="Multiplier applied to hours beyond normal for overtime pay (default 1.5×)." />
                          </label>
                          <input
                            type="number"
                            step="0.25"
                            value={otDraft}
                            onChange={(e) => setOtDraft(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-3 pt-2">
                        <button
                          onClick={() => setShowTaxModal(false)}
                          className="px-4 py-2 text-sm text-gray-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={async () => {
                            await saveSettings();
                            setShowTaxModal(false);
                            await loadConfigHistory();
                          }}
                          className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700"
                        >
                          Save Tax Rules
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Government / Statutory Deductions */}
              <div className="border-t border-gray-200 pt-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">
                    Government / Statutory Deductions
                    <InfoTag text="Future-proof: register any new government tax/levy (flat amount or % of gross). It is applied automatically in future payroll runs." />
                  </h4>
                  <button
                    onClick={() => setShowGovForm(!showGovForm)}
                    className="text-sm text-indigo-600 hover:text-indigo-800"
                  >
                    {showGovForm ? "Cancel" : "+ Add Government Deduction"}
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-gray-500 text-xs uppercase border-b">
                      <th className="text-left px-2 py-1">Name</th>
                      <th className="text-left px-2 py-1">Type</th>
                      <th className="text-right px-2 py-1">Value</th>
                      <th className="text-left px-2 py-1">Status</th>
                      <th className="text-right px-2 py-1">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {govDeductions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-2 py-4 text-center text-gray-500"
                        >
                          No government deductions configured.
                        </td>
                      </tr>
                    ) : (
                      govDeductions.map((d) => (
                        <tr key={d.id} className="border-b border-gray-50">
                          <td className="px-2 py-1 font-medium text-gray-800">
                            {d.name}
                          </td>
                          <td className="px-2 py-1 text-gray-600">
                            {d.type === "PERCENTAGE"
                              ? "Percent (%)"
                              : d.type === "FIXED"
                                ? "Amount"
                                : d.type}
                          </td>
                          <td className="px-2 py-1 text-right text-gray-900">
                            {d.type === "PERCENTAGE"
                              ? `${Number(d.value)}%`
                              : money(Number(d.value))}
                          </td>
                          <td className="px-2 py-1">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${d.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                            >
                              {d.isActive ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-2 py-1 text-right whitespace-nowrap">
                            <button
                              onClick={() => {
                                setEditingGovId(d.id);
                                setGovForm({
                                  name: d.name,
                                  type:
                                    d.type === "PERCENTAGE"
                                      ? "PERCENTAGE"
                                      : "FIXED",
                                  value: String(d.value),
                                });
                                setShowGovForm(true);
                              }}
                              className="text-xs text-indigo-600 hover:text-indigo-800 mr-2"
                            >
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (
                                  !confirm(
                                    `Delete government deduction "${d.name}"?`,
                                  )
                                )
                                  return;
                                try {
                                  await api.delete(
                                    `/companies/${companyId}/payroll/deductions/${d.id}`,
                                  );
                                  toast.success("Government deduction deleted");
                                  await loadGovDeductions();
                                } catch {
                                  toast.error(
                                    "Failed to delete government deduction",
                                  );
                                }
                              }}
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
                {showGovForm && (
                  <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-md grid grid-cols-4 gap-3 items-end">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Deduction Name
                        <InfoTag text="Free text — e.g. COVID Levy, New Tax 2027" />
                      </label>
                      <input
                        value={govForm.name}
                        onChange={(e) =>
                          setGovForm({ ...govForm, name: e.target.value })
                        }
                        placeholder="e.g. COVID Levy"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        Type
                        <InfoTag text="Amount = flat ETB deduction. Percent = % of employee gross pay." />
                      </label>
                      <select
                        value={govForm.type}
                        onChange={(e) => {
                          const type = e.target.value;
                          setGovForm({
                            ...govForm,
                            type,
                            value:
                              type === "PERCENTAGE"
                                ? govForm.value || "0"
                                : govForm.value,
                          });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                      >
                        <option value="FIXED">Amount</option>
                        <option value="PERCENTAGE">Percent (%)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        {govForm.type === "PERCENTAGE"
                          ? "Percent (%)"
                          : "Amount"}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={govForm.value}
                        onChange={(e) =>
                          setGovForm({ ...govForm, value: e.target.value })
                        }
                        placeholder={
                          govForm.type === "PERCENTAGE" ? "e.g. 3.5" : "0.00"
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                      />
                    </div>
                    <button
                      disabled={
                        savingGov || !govForm.name.trim() || !govForm.value
                      }
                      onClick={async () => {
                        setSavingGov(true);
                        try {
                          if (editingGovId) {
                            await api.patch(
                              `/companies/${companyId}/payroll/deductions/${editingGovId}`,
                              {
                                name: govForm.name.trim(),
                                type: govForm.type,
                                value: parseFloat(govForm.value) || 0,
                              },
                            );
                            toast.success("Government deduction updated");
                          } else {
                            await api.post(
                              `/companies/${companyId}/payroll/deductions`,
                              {
                                name: govForm.name.trim(),
                                type: govForm.type,
                                value: parseFloat(govForm.value) || 0,
                              },
                            );
                            toast.success(
                              "Government deduction added — applies to future payroll runs",
                            );
                          }
                          setGovForm({ name: "", type: "FIXED", value: "" });
                          setShowGovForm(false);
                          setEditingGovId(null);
                          await loadGovDeductions();
                        } catch {
                          toast.error(
                            editingGovId
                              ? "Failed to update government deduction"
                              : "Failed to add government deduction",
                          );
                        } finally {
                          setSavingGov(false);
                        }
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50"
                    >
                      {savingGov
                        ? "Saving..."
                        : editingGovId
                          ? "Update"
                          : "Add"}
                    </button>
                  </div>
                )}
              </div>

              {/* Employee Withholdings (loans, union dues, etc.) */}
              <div className="border-t border-gray-200 pt-4">
                <WithholdingsSection
                  companyId={companyId}
                  withholdings={withholdings}
                  setWithholdings={setWithholdings}
                  employees={employees}
                  money={money}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenerate && (
        <GeneratePayrollModal
          onCancel={() => setShowGenerate(false)}
          onSubmit={handleGenerate}
        />
      )}
    </div>
  );
}

function PayrollRunsTab({
  payrolls,
  selectedPayroll,
  items,
  payslip,
  money,
  sourceBadge,
  onSelect,
  onViewPayslip,
  onBackPayslip,
  onApprove,
}: {
  payrolls: Payroll[];
  selectedPayroll: Payroll | null;
  items: PayrollItem[];
  payslip: Payslip | null;
  money: (n: number) => string;
  sourceBadge: (s?: PayrollSourceType) => React.ReactNode;
  onSelect: (p: Payroll) => Promise<void>;
  onViewPayslip: (id: number) => Promise<void>;
  onBackPayslip: () => void;
  onApprove: (id: number) => Promise<void>;
}) {
  const [expandedItem, setExpandedItem] = useState<number | null>(null);
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className={selectedPayroll ? "lg:col-span-1" : "lg:col-span-3"}>
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-gray-500 text-xs uppercase border-b">
                <th className="text-left px-4 py-2">Title</th>
                <th className="text-left px-4 py-2">Period</th>
                <th className="text-left px-4 py-2">Source</th>
                <th className="text-right px-4 py-2">Total</th>
                <th className="text-left px-4 py-2">Status</th>
                <th className="text-right px-4 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.map((p) => (
                <tr
                  key={p.id}
                  className={`border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${selectedPayroll?.id === p.id ? "bg-indigo-50" : ""}`}
                  onClick={() => onSelect(p)}
                >
                  <td className="px-4 py-2 font-medium text-gray-800">
                    {p.title}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {new Date(p.startDate).toLocaleDateString()} →{" "}
                    {new Date(p.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2">{sourceBadge(p.sourceType)}</td>
                  <td className="px-4 py-2 text-right font-medium text-gray-900">
                    {money(Number(p.totalAmount))}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${p.status === "APPROVED" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {p.status === "DRAFT" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onApprove(p.id);
                        }}
                        className="text-xs text-green-600 hover:text-green-800"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {selectedPayroll && (
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="font-semibold text-gray-900">
                {selectedPayroll.title}
              </h2>
              <p className="text-xs text-gray-500">
                {new Date(selectedPayroll.startDate).toLocaleDateString()} →{" "}
                {new Date(selectedPayroll.endDate).toLocaleDateString()} ·{" "}
                {sourceBadge(selectedPayroll.sourceType)}
              </p>
            </div>
            {payslip ? (
              <PayslipView
                payslip={payslip}
                onBack={onBackPayslip}
                money={money}
              />
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-gray-500 text-xs uppercase border-b">
                    <th className="text-left px-4 py-2">Employee</th>
                    <th className="text-right px-4 py-2">Base</th>
                    <th className="text-right px-4 py-2">OT</th>
                    <th className="text-right px-4 py-2">Allow.</th>
                    <th className="text-right px-4 py-2">Bonus</th>
                    <th className="text-right px-4 py-2">Gross</th>
                    <th className="text-right px-4 py-2">Deduct.</th>
                    <th className="text-right px-4 py-2">Net</th>
                    <th className="text-right px-4 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <Fragment key={item.id}>
                      <tr className="border-b border-gray-100">
                        <td className="px-4 py-2 font-medium text-gray-800">
                          {item.employee?.firstName} {item.employee?.lastName}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {money(Number(item.basePay))}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {money(
                            Number(item.overtimeEarnings || item.overtimePay),
                          )}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {money(Number(item.allowanceTotal || 0))}
                        </td>
                        <td className="px-4 py-2 text-right text-gray-900">
                          {money(Number(item.bonusTotal || 0))}
                        </td>
                        <td className="px-4 py-2 text-right font-medium text-gray-900">
                          {money(Number(item.grossPay))}
                        </td>
                        <td className="px-4 py-2 text-right text-red-600">
                          {money(Number(item.totalDeductions))}
                        </td>
                        <td className="px-4 py-2 text-right font-bold text-green-700">
                          {money(Number(item.netPay))}
                        </td>
                        <td className="px-4 py-2 text-right">
                          <button
                            onClick={() =>
                              setExpandedItem(
                                expandedItem === item.id ? null : item.id,
                              )
                            }
                            className="text-xs text-indigo-600 hover:text-indigo-800 mr-2"
                          >
                            {expandedItem === item.id ? "Hide" : "Details"}
                          </button>
                          <button
                            onClick={() => onViewPayslip(item.id)}
                            className="text-xs text-indigo-600 hover:text-indigo-800"
                          >
                            Payslip
                          </button>
                        </td>
                      </tr>
                      {expandedItem === item.id && (
                        <tr className="bg-gray-50">
                          <td colSpan={9} className="px-6 py-4">
                            <div className="grid grid-cols-2 gap-6 text-sm">
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  Earnings
                                </h4>
                                <Space>
                                  <Label>Base Pay</Label>
                                  <Value>{money(Number(item.basePay))}</Value>
                                </Space>
                                <Space>
                                  <Label>Overtime</Label>
                                  <Value>
                                    {money(
                                      Number(
                                        item.overtimeEarnings ||
                                          item.overtimePay,
                                      ),
                                    )}
                                  </Value>
                                </Space>
                                <Space>
                                  <Label>Allowances</Label>
                                  <Value>
                                    {money(Number(item.allowanceTotal || 0))}
                                  </Value>
                                </Space>
                                <Space>
                                  <Label>Bonuses</Label>
                                  <Value>
                                    {money(Number(item.bonusTotal || 0))}
                                  </Value>
                                </Space>
                                <Space>
                                  <Label strong>Gross Pay</Label>
                                  <Value strong>
                                    {money(Number(item.grossPay))}
                                  </Value>
                                </Space>
                              </div>
                              <div>
                                <h4 className="font-semibold text-gray-800 mb-2">
                                  Deductions
                                </h4>
                                <Space>
                                  <Label>Income Tax</Label>
                                  <Value>{money(Number(item.taxAmount))}</Value>
                                </Space>
                                <Space>
                                  <Label>Withholdings</Label>
                                  <Value>
                                    {money(Number(item.withholdingTotal || 0))}
                                  </Value>
                                </Space>
                                <Space>
                                  <Label red strong>
                                    Total Deductions
                                  </Label>
                                  <Value red strong>
                                    {money(Number(item.totalDeductions))}
                                  </Value>
                                </Space>
                                <Space>
                                  <Label green strong>
                                    Net Pay
                                  </Label>
                                  <Value green strong>
                                    {money(Number(item.netPay))}
                                  </Value>
                                </Space>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Space({ children }: { children: React.ReactNode }) {
  return <div className="flex justify-between py-0.5">{children}</div>;
}
function Label({
  children,
  strong,
  red,
  green,
}: {
  children: React.ReactNode;
  strong?: boolean;
  red?: boolean;
  green?: boolean;
}) {
  return (
    <span className={`text-gray-600 ${strong ? "font-semibold" : ""}`}>
      {children}
    </span>
  );
}
function Value({
  children,
  strong,
  red,
  green,
}: {
  children: React.ReactNode;
  strong?: boolean;
  red?: boolean;
  green?: boolean;
}) {
  return (
    <span
      className={`${strong ? "font-semibold" : ""} ${red ? "text-red-600" : green ? "text-green-700" : "text-gray-900"}`}
    >
      {children}
    </span>
  );
}

import { Fragment } from "react";

function PayslipView({
  payslip,
  onBack,
  money,
}: {
  payslip: Payslip;
  onBack: () => void;
  money: (n: number) => string;
}) {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBack}
          className="text-xs text-indigo-600 hover:text-indigo-800"
        >
          ← Back
        </button>
        <button
          onClick={() => window.print()}
          className="px-3 py-1.5 text-xs bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
        >
          Print
        </button>
      </div>
      <div className="border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              {payslip.company.name}
            </h3>
            <p className="text-sm text-gray-500">{payslip.payroll.title}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-gray-800">
              {payslip.employee.firstName} {payslip.employee.lastName}
            </p>
            <p className="text-xs text-gray-500">
              {payslip.employee.employeeCode} · {payslip.employee.designation}
            </p>
          </div>
        </div>
        <div className="space-y-1 text-sm">
          <Space>
            <Label>Base Pay</Label>
            <Value>{money(payslip.earnings.basePay)}</Value>
          </Space>
          <Space>
            <Label>Overtime</Label>
            <Value>
              {money(
                payslip.earnings.overtimeEarnings ||
                  payslip.earnings.overtimePay,
              )}
            </Value>
          </Space>
          <Space>
            <Label>Allowances</Label>
            <Value>{money(payslip.earnings.allowanceTotal || 0)}</Value>
          </Space>
          <Space>
            <Label>Bonuses</Label>
            <Value>{money(payslip.earnings.bonusTotal || 0)}</Value>
          </Space>
          <Space>
            <Label strong>Gross</Label>
            <Value strong>{money(payslip.earnings.grossPay)}</Value>
          </Space>
        </div>
        <div className="border-t border-gray-200 mt-3 pt-3 space-y-1">
          {payslip.deductions.map((d, i) => (
            <Space key={i}>
              <Label>{d.name}</Label>
              <Value>{money(d.amount)}</Value>
            </Space>
          ))}
          <Space>
            <Label red strong>
              Total Deductions
            </Label>
            <Value red strong>
              {money(payslip.summary.totalDeductions)}
            </Value>
          </Space>
          <Space>
            <Label green strong>
              Net Pay
            </Label>
            <Value green strong>
              {money(payslip.summary.netPay)}
            </Value>
          </Space>
        </div>
      </div>
    </div>
  );
}

function OvertimeTab({
  companyId,
  rates,
  entries,
  employees,
  setRates,
  setEntries,
  money,
}: {
  companyId: number;
  rates: OvertimeRate[];
  entries: OvertimeEntry[];
  employees: any[];
  setRates: (r: OvertimeRate[]) => void;
  setEntries: (e: OvertimeEntry[]) => void;
  money: (n: number) => string;
}) {
  const [showRate, setShowRate] = useState(false);
  const [showEntry, setShowEntry] = useState(false);
  const [name, setName] = useState("");
  const [multiplier, setMultiplier] = useState("1.5");
  const [empId, setEmpId] = useState("");
  const [date, setDate] = useState("");
  const [hours, setHours] = useState("1");
  const [rateId, setRateId] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [reason, setReason] = useState("");

  const saveRate = async () => {
    await overtimeService.createRate(companyId, {
      name,
      multiplier: Number(multiplier),
    });
    setShowRate(false);
    setName("");
    setRates(await overtimeService.getRates(companyId));
  };
  const saveEntry = async () => {
    await overtimeService.createEntry(companyId, {
      employeeId: Number(empId),
      date,
      hours: Number(hours),
      overtimeRateId: rateId ? Number(rateId) : undefined,
      hourlyRate: hourlyRate ? Number(hourlyRate) : undefined,
      reason: reason || undefined,
    });
    setShowEntry(false);
    setEntries(await overtimeService.getEntries(companyId));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Overtime Rates</h3>
          <button
            onClick={() => setShowRate(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
          >
            + Rate
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b">
              <th className="text-left px-4 py-2">Name</th>
              <th className="text-right px-4 py-2">Multiplier</th>
              <th className="text-left px-4 py-2">Status</th>
            </tr>
          </thead>
          <tbody>
            {rates.map((r) => (
              <tr key={r.id} className="border-b border-gray-100">
                <td className="px-4 py-2 font-medium text-gray-800">
                  {r.name}
                </td>
                <td className="px-4 py-2 text-right text-gray-900">
                  {r.multiplier}×
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${r.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}
                  >
                    {r.isActive ? "Active" : "Inactive"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showRate && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Rate Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Weekend OT"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Multiplier
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  value={multiplier}
                  onChange={(e) => setMultiplier(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveRate}
                className="px-3 py-2 bg-indigo-600 text-white text-xs rounded-md"
              >
                Save
              </button>
              <button
                onClick={() => setShowRate(false)}
                className="px-3 py-2 text-xs text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Overtime Entries</h3>
          <button
            onClick={() => setShowEntry(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
          >
            + Entry
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b">
              <th className="text-left px-4 py-2">Employee</th>
              <th className="text-left px-4 py-2">Date</th>
              <th className="text-right px-4 py-2">Hours</th>
              <th className="text-right px-4 py-2">Rate</th>
              <th className="text-right px-4 py-2">Mult</th>
              <th className="text-right px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Status</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-b border-gray-100">
                <td className="px-4 py-2 font-medium text-gray-800">
                  {e.employee?.firstName} {e.employee?.lastName}
                </td>
                <td className="px-4 py-2 text-gray-900">
                  {new Date(e.date).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-right text-gray-900">
                  {e.hours}
                </td>
                <td className="px-4 py-2 text-right text-gray-900">
                  ${Number(e.hourlyRate).toFixed(2)}
                </td>
                <td className="px-4 py-2 text-right text-gray-900">
                  {e.multiplier}×
                </td>
                <td className="px-4 py-2 text-right font-medium text-gray-900">
                  {money(Number(e.amount))}
                </td>
                <td className="px-4 py-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs ${e.status === "APPROVED" ? "bg-green-100 text-green-700" : e.status === "REJECTED" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}
                  >
                    {e.status}
                  </span>
                </td>
                <td className="px-4 py-2 text-right">
                  {e.status === "DRAFT" && (
                    <>
                      <button
                        onClick={async () => {
                          await overtimeService.approveEntry(companyId, e.id);
                          setEntries(
                            await overtimeService.getEntries(companyId),
                          );
                        }}
                        className="text-xs text-green-600 hover:text-green-800 mr-2"
                      >
                        Approve
                      </button>
                      <button
                        onClick={async () => {
                          await overtimeService.rejectEntry(companyId, e.id);
                          setEntries(
                            await overtimeService.getEntries(companyId),
                          );
                        }}
                        className="text-xs text-red-600 hover:text-red-800"
                      >
                        Reject
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {showEntry && (
          <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Employee
                </label>
                <select
                  value={empId}
                  onChange={(e) => setEmpId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  <option value="">Select employee...</option>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName}
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
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
                  value={hours}
                  onChange={(e) => setHours(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="e.g. 2.5"
                />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  OT Rate
                </label>
                <select
                  value={rateId}
                  onChange={(e) => setRateId(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                >
                  <option value="">Default (1.5×)</option>
                  {rates.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.multiplier}×)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Hourly Rate
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={hourlyRate}
                  onChange={(e) => setHourlyRate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="Uses employee rate if empty"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  Reason
                </label>
                <input
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                  placeholder="Optional reason"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={saveEntry}
                className="px-4 py-2 bg-indigo-600 text-white text-xs rounded-md"
              >
                Save Entry
              </button>
              <button
                onClick={() => setShowEntry(false)}
                className="px-4 py-2 text-xs text-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompensationTab({
  companyId,
  allowances,
  bonuses,
  withholdings,
  employees,
  setAllowances,
  setBonuses,
  setWithholdings,
  money,
}: {
  companyId: number;
  allowances: PayrollAllowance[];
  bonuses: PayrollBonus[];
  withholdings: PayrollWithholding[];
  employees: any[];
  setAllowances: (a: PayrollAllowance[]) => void;
  setBonuses: (b: PayrollBonus[]) => void;
  setWithholdings: (w: PayrollWithholding[]) => void;
  money: (n: number) => string;
}) {
  const [showAllow, setShowAllow] = useState(false);
  const [showBonus, setShowBonus] = useState(false);
  const [showWith, setShowWith] = useState(false);
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    type: "",
    amount: "",
    isTaxable: true,
    isGlobal: false,
    calcType: "FIXED" as "FIXED" | "PERCENTAGE",
    reason: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
  });

  const refresh = async () => {
    setAllowances(await compensationService.getAllowances(companyId));
    setBonuses(await compensationService.getBonuses(companyId));
    setWithholdings(await compensationService.getWithholdings(companyId));
  };

  const saveAllowance = async () => {
    await compensationService.createAllowance(companyId, {
      employeeId: Number(form.employeeId),
      type: form.type,
      amount: Number(form.amount),
      isTaxable: form.isTaxable,
      reason: form.reason || undefined,
      effectiveDate: form.effectiveDate,
      ...(form.expiryDate && { expiryDate: form.expiryDate }),
    });
    setShowAllow(false);
    setForm({
      ...form,
      employeeId: "",
      type: "",
      amount: "",
      isTaxable: true,
      reason: "",
      effectiveDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
    });
    await refresh();
  };
  const saveBonus = async () => {
    await compensationService.createBonus(companyId, {
      employeeId: Number(form.employeeId),
      type: form.type,
      amount: Number(form.amount),
      reason: form.reason || undefined,
      effectiveDate: form.effectiveDate,
      ...(form.expiryDate && { expiryDate: form.expiryDate }),
    });
    setShowBonus(false);
    setForm({
      ...form,
      employeeId: "",
      type: "",
      amount: "",
      isTaxable: true,
      reason: "",
      effectiveDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
    });
    await refresh();
  };
  const saveWithholding = async () => {
    await compensationService.createWithholding(companyId, {
      employeeId: form.isGlobal ? undefined : Number(form.employeeId),
      name: form.name || "Withholding",
      type: form.type,
      amount: Number(form.amount),
      calcType: form.calcType,
      isGlobal: form.isGlobal,
      reason: form.reason,
      effectiveDate: form.effectiveDate,
      ...(form.expiryDate && { expiryDate: form.expiryDate }),
    });
    setShowWith(false);
    setForm({
      ...form,
      employeeId: "",
      name: "",
      type: "",
      amount: "",
      isTaxable: true,
      isGlobal: false,
      calcType: "FIXED",
      reason: "",
      effectiveDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
    });
    await refresh();
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Allowances</h3>
          <button
            onClick={() => setShowAllow(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
          >
            + Allowance
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b">
              <th className="text-left px-4 py-2">Employee</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-right px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Taxable</th>
              <th className="text-left px-4 py-2">Effective</th>
              <th className="text-left px-4 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {allowances
              .filter((a) => a.isActive)
              .map((a) => (
                <tr key={a.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-800">
                    Emp #{a.employeeId}
                  </td>
                  <td className="px-4 py-2 text-gray-900">{a.type}</td>
                  <td className="px-4 py-2 text-right text-gray-900">
                    {money(Number(a.amount))}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs ${a.isTaxable ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"}`}
                    >
                      {a.isTaxable ? "Taxable" : "Non-taxable"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {new Date(a.effectiveDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-gray-500">{a.reason}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Bonuses</h3>
          <button
            onClick={() => setShowBonus(true)}
            className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded-md hover:bg-indigo-700"
          >
            + Bonus
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b">
              <th className="text-left px-4 py-2">Employee</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-right px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Effective</th>
              <th className="text-left px-4 py-2">Reason</th>
            </tr>
          </thead>
          <tbody>
            {bonuses
              .filter((b) => b.isActive)
              .map((b) => (
                <tr key={b.id} className="border-b border-gray-100">
                  <td className="px-4 py-2 font-medium text-gray-800">
                    Emp #{b.employeeId}
                  </td>
                  <td className="px-4 py-2 text-gray-900">{b.type}</td>
                  <td className="px-4 py-2 text-right text-gray-900">
                    {money(Number(b.amount))}
                  </td>
                  <td className="px-4 py-2 text-gray-900">
                    {new Date(b.effectiveDate).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-gray-500">{b.reason}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showAllow && (
        <CompensForm
          title="Add Allowance"
          types={["HOUSING", "TRANSPORT", "HARDSHIP", "COMMUNICATION"]}
          showTaxable
          employees={employees}
          form={form}
          setForm={setForm}
          onClose={() => setShowAllow(false)}
          onSave={saveAllowance}
        />
      )}
      {showBonus && (
        <CompensForm
          title="Add Bonus"
          types={["PERFORMANCE", "13TH_MONTH"]}
          employees={employees}
          form={form}
          setForm={setForm}
          onClose={() => setShowBonus(false)}
          onSave={saveBonus}
        />
      )}
      {showWith && (
        <CompensForm
          title="Add Withholding"
          types={["LOAN", "INSURANCE", "ADVANCE", "FINE", "OTHER"]}
          requireReason
          showName
          showGlobal
          showCalcType
          employees={employees}
          form={form}
          setForm={setForm}
          onClose={() => setShowWith(false)}
          onSave={saveWithholding}
        />
      )}
    </div>
  );
}

function WithholdingsSection({
  companyId,
  withholdings,
  setWithholdings,
  employees,
  money,
}: {
  companyId: number;
  withholdings: PayrollWithholding[];
  setWithholdings: (w: PayrollWithholding[]) => void;
  employees: any[];
  money: (n: number) => string;
}) {
  const [showWith, setShowWith] = useState(false);
  const [editingWithId, setEditingWithId] = useState<number | null>(null);
  const [form, setForm] = useState({
    employeeId: "",
    name: "",
    type: "",
    amount: "",
    isTaxable: true,
    isGlobal: false,
    calcType: "FIXED" as "FIXED" | "PERCENTAGE",
    reason: "",
    effectiveDate: new Date().toISOString().split("T")[0],
    expiryDate: "",
  });

  const saveWithholding = async () => {
    const payload: Record<string, unknown> = {
      employeeId: form.isGlobal ? undefined : Number(form.employeeId),
      name: form.name || "Withholding",
      type: form.type,
      amount: Number(form.amount),
      calcType: form.calcType,
      isGlobal: form.isGlobal,
      reason: form.reason,
      effectiveDate: form.effectiveDate,
      ...(form.expiryDate && { expiryDate: form.expiryDate }),
    };
    if (editingWithId) {
      await compensationService.updateWithholding(
        companyId,
        editingWithId,
        payload,
      );
    } else {
      await compensationService.createWithholding(companyId, payload as any);
    }
    setShowWith(false);
    setEditingWithId(null);
    setForm({
      ...form,
      employeeId: "",
      name: "",
      type: "",
      amount: "",
      isTaxable: true,
      isGlobal: false,
      calcType: "FIXED",
      reason: "",
      effectiveDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
    });
    setWithholdings(await compensationService.getWithholdings(companyId));
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold text-gray-900">
          Employee Withholdings
          <InfoTag text="Per-employee or company-global deductions (loans, union dues, insurance). Percent (%) is computed as % of gross pay — displayed as 35% not $35." />
        </h4>
        <button
          onClick={() => setShowWith(!showWith)}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          {showWith ? "Cancel" : "+ Add Withholding"}
        </button>
      </div>
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 text-xs uppercase border-b">
              <th className="text-left px-4 py-2">Employee</th>
              <th className="text-left px-4 py-2">Type</th>
              <th className="text-right px-4 py-2">Amount</th>
              <th className="text-left px-4 py-2">Reason</th>
              <th className="text-left px-4 py-2">Effective</th>
              <th className="text-right px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {withholdings.filter((w) => w.isActive).length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-4 text-center text-gray-500">
                  No withholdings configured.
                </td>
              </tr>
            ) : (
              withholdings
                .filter((w) => w.isActive)
                .map((w) => (
                  <tr key={w.id} className="border-b border-gray-100">
                    <td className="px-4 py-2 font-medium text-gray-800">
                      Emp #{w.employeeId}
                    </td>
                    <td className="px-4 py-2 text-gray-900">{w.type}</td>
                    <td className="px-4 py-2 text-right text-red-600">
                      {w.calcType === "PERCENTAGE"
                        ? `${Number(w.amount)}%`
                        : money(Number(w.amount))}
                    </td>
                    <td className="px-4 py-2 text-gray-500 italic">
                      "{w.reason}"
                    </td>
                    <td className="px-4 py-2 text-gray-900">
                      {new Date(w.effectiveDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-2 text-right whitespace-nowrap">
                      <button
                        onClick={() => {
                          setEditingWithId(w.id);
                          setForm({
                            employeeId: w.isGlobal
                              ? ""
                              : w.employeeId
                                ? String(w.employeeId)
                                : "",
                            name: w.name || "",
                            type: w.type || "",
                            amount: String(w.amount ?? ""),
                            isTaxable: true,
                            isGlobal: w.isGlobal || false,
                            calcType:
                              w.calcType === "PERCENTAGE"
                                ? "PERCENTAGE"
                                : "FIXED",
                            reason: w.reason || "",
                            effectiveDate: w.effectiveDate
                              ? String(w.effectiveDate).split("T")[0]
                              : new Date().toISOString().split("T")[0],
                            expiryDate: w.expiryDate
                              ? String(w.expiryDate).split("T")[0]
                              : "",
                          });
                          setShowWith(true);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 mr-2"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm("Delete this withholding?")) return;
                          try {
                            await compensationService.deleteWithholding(
                              companyId,
                              w.id,
                            );
                            toast.success("Withholding deleted");
                            setWithholdings(
                              await compensationService.getWithholdings(
                                companyId,
                              ),
                            );
                          } catch {
                            toast.error("Failed to delete withholding");
                          }
                        }}
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
      {showWith && (
        <CompensForm
          title={editingWithId ? "Edit Withholding" : "Add Withholding"}
          types={["LOAN", "INSURANCE", "ADVANCE", "FINE", "OTHER"]}
          requireReason
          showName
          showGlobal
          showCalcType
          employees={employees}
          form={form}
          setForm={setForm}
          onClose={() => {
            setShowWith(false);
            setEditingWithId(null);
          }}
          onSave={saveWithholding}
        />
      )}
    </div>
  );
}

function CompensForm({
  title,
  types,
  showTaxable,
  requireReason,
  showName,
  showGlobal,
  showCalcType,
  employees,
  form,
  setForm,
  onClose,
  onSave,
}: {
  title: string;
  types: string[];
  showTaxable?: boolean;
  requireReason?: boolean;
  showName?: boolean;
  showGlobal?: boolean;
  showCalcType?: boolean;
  employees: any[];
  form: any;
  setForm: (f: any) => void;
  onClose: () => void;
  onSave: () => Promise<void>;
}) {
  const [saving, setSaving] = useState(false);
  const submit = async () => {
    if (requireReason && !form.reason.trim()) return;
    setSaving(true);
    try {
      await onSave();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        <div className="space-y-4">
          {showGlobal && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">Scope</label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.isGlobal}
                  onChange={(e) =>
                    setForm({ ...form, isGlobal: e.target.checked })
                  }
                  className="h-4 w-4"
                />{" "}
                Apply to all employees (company-wide)
              </label>
            </div>
          )}
          {!showGlobal && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Employee
              </label>
              <select
                value={form.employeeId}
                onChange={(e) =>
                  setForm({ ...form, employeeId: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              >
                <option value="">Select employee...</option>
                {employees.map((emp) => (
                  <option key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </option>
                ))}
              </select>
            </div>
          )}
          {showGlobal && form.isGlobal && (
            <p className="text-xs text-gray-500 -mt-2">
              Global withholdings apply automatically to all employees in the
              payroll run.
            </p>
          )}
          {showName && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Name / Label
              </label>
              <input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Union Dues, Equipment Advance, Special Loan"
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              />
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            >
              <option value="">Select type...</option>
              {types.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
          {showCalcType && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Calculation Type
                <InfoTag text="Fixed Amount = flat deduction (e.g. $50). Percentage (%) = % of the employee's gross pay (e.g. 35% → $35 for every $100 of gross)." />
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    ["FIXED", "Fixed Amount"],
                    ["PERCENTAGE", "Percentage (%)"],
                  ] as const
                ).map(([v, l]) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setForm({ ...form, calcType: v })}
                    className={`px-3 py-2 text-sm font-medium rounded-md border ${
                      form.calcType === v
                        ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                        : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              {form.calcType === "PERCENTAGE" && (
                <p className="text-xs text-gray-500 mt-1">
                  Computed as percentage of employee's gross pay during payroll
                  generation.
                </p>
              )}
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              {showCalcType && form.calcType === "PERCENTAGE"
                ? "Percentage (%)"
                : "Amount"}
              {showCalcType && (
                <InfoTag
                  text={
                    form.calcType === "PERCENTAGE"
                      ? "Number is a percentage of gross pay — NOT a dollar amount. E.g. 35 = 35%."
                      : "Flat dollar amount deducted each run."
                  }
                />
              )}
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              placeholder={form.calcType === "PERCENTAGE" ? "e.g. 3.5" : "0.00"}
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            />
          </div>
          {showTaxable && (
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Tax Treatment
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={form.isTaxable}
                  onChange={(e) =>
                    setForm({ ...form, isTaxable: e.target.checked })
                  }
                  className="h-4 w-4"
                />{" "}
                Taxable
              </label>
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Reason {requireReason && <span className="text-red-500">*</span>}
            </label>
            <input
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              placeholder={
                requireReason
                  ? "Required reason (e.g. loan repayment)"
                  : "Optional reason"
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Effective Date
              </label>
              <input
                type="date"
                value={form.effectiveDate}
                onChange={(e) =>
                  setForm({ ...form, effectiveDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Expiry Date
              </label>
              <input
                type="date"
                value={form.expiryDate}
                onChange={(e) =>
                  setForm({ ...form, expiryDate: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600"
            >
              Cancel
            </button>
            <button
              onClick={submit}
              disabled={saving || (requireReason && !form.reason.trim())}
              className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTag({ text }: { text: string }) {
  return (
    <span
      title={text}
      className="ml-1 inline-flex items-center justify-center h-4 w-4 rounded-full bg-gray-200 text-gray-500 text-[10px] font-bold cursor-help select-none"
      aria-label={text}
    >
      i
    </span>
  );
}

function GeneratePayrollModal({
  onCancel,
  onSubmit,
}: {
  onCancel: () => void;
  onSubmit: (dto: {
    title: string;
    startDate: string;
    endDate: string;
    sourceType?: PayrollSourceType;
  }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sourceType, setSourceType] = useState<PayrollSourceType>("ALL");
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate || !endDate) return;
    setSaving(true);
    try {
      await onSubmit({ title, startDate, endDate, sourceType });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Generate Payroll
        </h2>
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. July 2026 Payroll"
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
            />
          </div>
          <div className="grid grid-cols-3 gap-2">
            {(
              [
                ["ATTENDANCE", "Attendance"],
                ["TIMESHEETS", "Timesheets"],
                ["ALL", "Both"],
              ] as [PayrollSourceType, string][]
            ).map(([v, l]) => (
              <button
                key={v}
                type="button"
                onClick={() => setSourceType(v)}
                className={`px-3 py-2 text-sm font-medium rounded-md border ${sourceType === v ? "bg-indigo-50 border-indigo-500 text-indigo-700" : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50"}`}
              >
                {l}
              </button>
            ))}
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
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                required
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white text-gray-900"
                required
              />
            </div>
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
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md disabled:opacity-50"
            >
              {saving ? "Generating..." : "Generate Payroll"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

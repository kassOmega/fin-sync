"use client";

import { ledgerService } from "@/lib/services/ledger";
import type {
  BalanceSheet,
  IncomeStatement,
  TrialBalance,
} from "@/lib/services/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

type TabType = "trial" | "balance" | "income";

export default function FinancialStatementsPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = Number(params.companyId);
  const [tab, setTab] = useState<TabType>("trial");
  const [asOfDate, setAsOfDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [startDate, setStartDate] = useState(
    new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [trial, setTrial] = useState<TrialBalance | null>(null);
  const [balanceSheet, setBalanceSheet] = useState<BalanceSheet | null>(null);
  const [income, setIncome] = useState<IncomeStatement | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    const load =
      tab === "trial"
        ? ledgerService.trialBalance(companyId, asOfDate).then(setTrial)
        : tab === "balance"
          ? ledgerService
              .balanceSheet(companyId, asOfDate)
              .then(setBalanceSheet)
          : ledgerService
              .incomeStatement(companyId, startDate, endDate)
              .then(setIncome);
    load.finally(() => setLoading(false));
  }, [companyId, tab, asOfDate, startDate, endDate]);

  const money = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  if (loading)
    return <div className="p-8 text-gray-500">Loading financials...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-gray-900">
          Financial Statements
        </h1>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {(
              [
                ["trial", "Trial Balance"],
                ["balance", "Balance Sheet"],
                ["income", "Income Statement"],
              ] as [TabType, string][]
            ).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === key ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {(tab === "trial" || tab === "balance") && (
            <input
              type="date"
              value={asOfDate}
              onChange={(e) => setAsOfDate(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-300 rounded-md"
            />
          )}
          {tab === "income" && (
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md"
              />
              <span className="text-gray-500">→</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-300 rounded-md"
              />
            </div>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        {tab === "trial" && trial && (
          <div>
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
              <span>As of {trial.asOfDate}</span>
              <span
                className={
                  trial.totals.difference === 0
                    ? "text-green-600"
                    : "text-red-600"
                }
              >
                {trial.totals.difference === 0
                  ? "✓ In Balance"
                  : `✗ Difference: ${money(trial.totals.difference)}`}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase border-b">
                  <th className="text-left px-4 py-2 w-20">Code</th>
                  <th className="text-left px-4 py-2">Account</th>
                  <th className="text-right px-4 py-2 w-32">Debit</th>
                  <th className="text-right px-4 py-2 w-32">Credit</th>
                  <th className="text-right px-4 py-2 w-32">Balance</th>
                </tr>
              </thead>
              <tbody>
                {trial.accounts.map((acc) => (
                  <tr
                    key={acc.id}
                    className="border-b border-gray-100 hover:bg-gray-50"
                  >
                    <td className="px-4 py-2 font-mono text-gray-600">
                      {acc.code}
                    </td>
                    <td className="px-4 py-2 text-gray-800">{acc.name}</td>
                    <td className="px-4 py-2 text-right text-green-700">
                      {acc.totalDebit > 0 ? money(acc.totalDebit) : ""}
                    </td>
                    <td className="px-4 py-2 text-right text-red-700">
                      {acc.totalCredit > 0 ? money(acc.totalCredit) : ""}
                    </td>
                    <td className="px-4 py-2 text-right font-medium text-gray-900">
                      {money(acc.balance)}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 font-semibold text-gray-900">
                  <td colSpan={2} className="px-4 py-3 text-right">
                    Totals
                  </td>
                  <td className="px-4 py-3 text-right text-green-700">
                    {money(trial.totals.totalDebit)}
                  </td>
                  <td className="px-4 py-3 text-right text-red-700">
                    {money(trial.totals.totalCredit)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {money(trial.totals.difference)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}

        {tab === "balance" && balanceSheet && (
          <div>
            <div className="flex items-center justify-between py-3 px-4 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
              <span>As of {balanceSheet.asOfDate}</span>
              <span
                className={
                  balanceSheet.balanced ? "text-green-600" : "text-red-600"
                }
              >
                {balanceSheet.balanced
                  ? "✓ Assets = Liabilities + Equity"
                  : "✗ Not Balanced"}
              </span>
            </div>
            <div className="grid grid-cols-3 divide-x divide-gray-200">
              {(["assets", "liabilities", "equity"] as const).map((section) => (
                <div key={section}>
                  <div className="px-4 py-3 border-b border-gray-200 font-semibold text-gray-800 capitalize">
                    {section}
                  </div>
                  {balanceSheet[section].accounts.map((acc) => (
                    <div
                      key={acc.id}
                      className="flex justify-between px-4 py-2 text-sm border-b border-gray-100"
                    >
                      <span className="text-gray-600">{acc.name}</span>
                      <span className="font-medium text-gray-900">
                        {money(acc.balance)}
                      </span>
                    </div>
                  ))}
                  <div className="flex justify-between px-4 py-3 font-semibold text-gray-900 bg-gray-50">
                    <span>Total {section}</span>
                    <span>{money(balanceSheet[section].total)}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between px-4 py-3 bg-gray-50 border-t font-semibold text-gray-900">
              <span>Total Liabilities + Equity</span>
              <span>{money(balanceSheet.totalLiabilitiesAndEquity)}</span>
            </div>
          </div>
        )}

        {tab === "income" && income && (
          <div>
            <div className="py-3 px-4 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase">
              Period: {income.period.startDate} → {income.period.endDate}
            </div>
            <div className="grid grid-cols-2 divide-x divide-gray-200">
              <div>
                <div className="px-4 py-3 border-b border-gray-200 font-semibold text-green-700">
                  Income / Revenue
                </div>
                {income.income.accounts.map((row) => (
                  <div
                    key={row.id}
                    className="flex justify-between px-4 py-2 text-sm border-b border-gray-100"
                  >
                    <span className="text-gray-600">{row.name}</span>
                    <span className="font-medium text-green-700">
                      {money(row.balance)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 font-semibold text-green-700 bg-green-50">
                  <span>Total Income</span>
                  <span>{money(income.income.total)}</span>
                </div>
              </div>
              <div>
                <div className="px-4 py-3 border-b border-gray-200 font-semibold text-red-700">
                  Expenses
                </div>
                {income.expenses.accounts.map((row) => (
                  <div
                    key={row.id}
                    className="flex justify-between px-4 py-2 text-sm border-b border-gray-100"
                  >
                    <span className="text-gray-600">{row.name}</span>
                    <span className="font-medium text-red-700">
                      {money(row.balance)}
                    </span>
                  </div>
                ))}
                <div className="flex justify-between px-4 py-3 font-semibold text-red-700 bg-red-50">
                  <span>Total Expenses</span>
                  <span>{money(income.expenses.total)}</span>
                </div>
              </div>
            </div>
            <div
              className={`flex justify-between px-4 py-4 font-bold text-lg ${
                income.netIncome >= 0
                  ? "bg-green-50 text-green-700"
                  : "bg-red-50 text-red-700"
              }`}
            >
              <span>Net Income (P&L)</span>
              <span>{money(income.netIncome)}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

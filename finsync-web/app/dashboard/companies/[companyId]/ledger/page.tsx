"use client";

import { accountsService } from "@/lib/services/accounts";
import { ledgerService } from "@/lib/services/ledger";
import type { Account, JournalEntry } from "@/lib/services/types";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

const STATUS_COLORS: Record<string, string> = {
  DRAFT: "bg-yellow-100 text-yellow-800",
  POSTED: "bg-green-100 text-green-800",
  VOIDED: "bg-gray-100 text-gray-500",
};

export default function LedgerPage() {
  const params = useParams<{ companyId: string }>();
  const companyId = Number(params.companyId);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [searchFilter, setSearchFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [expandedEntry, setExpandedEntry] = useState<number | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const listParams = {
    ...(statusFilter && { status: statusFilter }),
    ...(searchFilter && { search: searchFilter }),
    ...(startDate && { startDate }),
    ...(endDate && { endDate }),
  };

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    Promise.all([
      ledgerService.list(companyId, listParams),
      accountsService.list(companyId),
    ])
      .then(([entriesData, accountsData]) => {
        setEntries(entriesData);
        setAccounts(accountsData);
      })
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId, statusFilter, searchFilter, startDate, endDate]);

  const handlePost = async (id: number) => {
    await ledgerService.post(companyId, id);
    setEntries(
      await ledgerService.list(
        companyId,
        statusFilter ? { status: statusFilter } : {},
      ),
    );
  };

  const handleVoid = async (id: number) => {
    await ledgerService.void(companyId, id);
    setEntries(
      await ledgerService.list(
        companyId,
        statusFilter ? { status: statusFilter } : {},
      ),
    );
  };

  if (loading)
    return <div className="p-8 text-gray-500">Loading ledger...</div>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="text-2xl font-bold text-gray-900">General Ledger</h1>
        <div className="flex items-center gap-3 flex-wrap">
          <input
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Search description..."
            className="px-3 py-2 text-sm border border-gray-300 rounded-md w-48"
          />
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-300 rounded-md"
          >
            <option value="">All Status</option>
            <option value="DRAFT">DRAFT</option>
            <option value="POSTED">POSTED</option>
            <option value="VOIDED">VOIDED</option>
          </select>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            + New Journal Entry
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="flex items-center py-3 px-4 bg-gray-50 border-b border-gray-200 text-xs font-medium text-gray-500 uppercase tracking-wide">
          <span className="w-32">Entry #</span>
          <span className="w-28">Date</span>
          <span className="flex-1">Description</span>
          <span className="w-24">Status</span>
          <span className="w-40 text-right">Actions</span>
        </div>
        <div className="divide-y divide-gray-100">
          {entries.length === 0 ? (
            <div className="py-12 text-center text-gray-500">
              No journal entries found.
            </div>
          ) : (
            entries.map((entry) => (
              <div key={entry.id}>
                <div
                  className="flex items-center py-3 px-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    setExpandedEntry(
                      expandedEntry === entry.id ? null : entry.id,
                    )
                  }
                >
                  <span className="w-32 font-mono text-sm text-gray-600">
                    {entry.entryNumber}
                  </span>
                  <span className="w-28 text-sm text-gray-600">
                    {new Date(entry.date).toLocaleDateString()}
                  </span>
                  <span className="flex-1 text-sm text-gray-800">
                    {entry.description}
                  </span>
                  <span
                    className={`w-24 text-xs font-medium px-2 py-0.5 rounded-full ${STATUS_COLORS[entry.status] || "bg-gray-100"}`}
                  >
                    {entry.status}
                  </span>
                  <span className="w-40 flex justify-end gap-2">
                    {entry.status === "DRAFT" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePost(entry.id);
                        }}
                        className="text-xs text-green-600 hover:text-green-800 font-medium"
                      >
                        Post
                      </button>
                    )}
                    {entry.status === "POSTED" && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleVoid(entry.id);
                        }}
                        className="text-xs text-red-600 hover:text-red-800 font-medium"
                      >
                        Void
                      </button>
                    )}
                  </span>
                </div>

                {expandedEntry === entry.id && (
                  <div className="bg-gray-50 px-6 py-4">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-gray-500 text-xs uppercase">
                          <th className="text-left py-1">Account</th>
                          <th className="text-left py-1">Description</th>
                          <th className="text-right py-1">Debit</th>
                          <th className="text-right py-1">Credit</th>
                        </tr>
                      </thead>
                      <tbody>
                        {entry.lines.map((line) => (
                          <tr
                            key={line.id}
                            className="border-t border-gray-200"
                          >
                            <td className="py-1">
                              <span className="font-mono text-gray-500 mr-2">
                                {line.account.code}
                              </span>
                              {line.account.name}
                            </td>
                            <td className="py-1 text-gray-600">
                              {line.description}
                            </td>
                            <td className="py-1 text-right font-medium text-green-700">
                              {line.debit > 0
                                ? `$${line.debit.toFixed(2)}`
                                : ""}
                            </td>
                            <td className="py-1 text-right font-medium text-red-700">
                              {line.credit > 0
                                ? `$${line.credit.toFixed(2)}`
                                : ""}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {entry.postedBy && (
                      <p className="text-xs text-gray-500 mt-2">
                        Posted by {entry.postedBy.name}
                        {entry.postedAt
                          ? ` at ${new Date(entry.postedAt).toLocaleString()}`
                          : ""}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {showCreateModal && (
        <JournalEntryModal
          companyId={companyId}
          accounts={accounts}
          onClose={() => setShowCreateModal(false)}
          onSaved={async () => {
            setShowCreateModal(false);
            setEntries(
              await ledgerService.list(
                companyId,
                statusFilter ? { status: statusFilter } : {},
              ),
            );
          }}
        />
      )}
    </div>
  );
}

function JournalEntryModal({
  companyId,
  accounts,
  onClose,
  onSaved,
}: {
  companyId: number;
  accounts: Account[];
  onClose: () => void;
  onSaved: () => Promise<void>;
}) {
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [lines, setLines] = useState([
    { accountId: 0, description: "", debit: 0, credit: 0 },
    { accountId: 0, description: "", debit: 0, credit: 0 },
  ]);
  const [saving, setSaving] = useState(false);

  const totalDebit = lines.reduce((s, l) => s + Number(l.debit || 0), 0);
  const totalCredit = lines.reduce((s, l) => s + Number(l.credit || 0), 0);
  const balanced = Math.abs(totalDebit - totalCredit) < 0.01;

  const addLine = () =>
    setLines([
      ...lines,
      { accountId: 0, description: "", debit: 0, credit: 0 },
    ]);

  const updateLine = (
    index: number,
    field: keyof (typeof lines)[0],
    value: number | string,
  ) => {
    const updated = [...lines];
    (updated[index] as any)[field] = value;
    setLines(updated);
  };

  const handleSave = async () => {
    if (!description.trim() || !balanced) return;
    setSaving(true);
    try {
      await ledgerService.create(companyId, { description, date, lines });
      await onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-900/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            New Journal Entry
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Description
              </label>
              <input
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Entry description"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-700">Lines</h3>
              <button
                onClick={addLine}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + Add Line
              </button>
            </div>

            <table className="w-full text-sm">
              <thead>
                <tr className="text-gray-500 text-xs uppercase">
                  <th className="text-left py-1">Account</th>
                  <th className="text-left py-1">Description</th>
                  <th className="w-28 text-right py-1">Debit</th>
                  <th className="w-28 text-right py-1">Credit</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {lines.map((line, index) => (
                  <tr key={index} className="border-t border-gray-100">
                    <td className="py-1">
                      <select
                        value={line.accountId}
                        onChange={(e) =>
                          updateLine(index, "accountId", Number(e.target.value))
                        }
                        className="w-52 px-2 py-1 border border-gray-200 rounded"
                      >
                        <option value={0}>Select account...</option>
                        {accounts.map((a) => (
                          <option key={a.id} value={a.id}>
                            {a.code} — {a.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1">
                      <input
                        value={line.description}
                        onChange={(e) =>
                          updateLine(index, "description", e.target.value)
                        }
                        className="w-full px-2 py-1 border border-gray-200 rounded"
                        placeholder="Line description"
                      />
                    </td>
                    <td className="py-1">
                      <input
                        type="number"
                        step="0.01"
                        value={line.debit || ""}
                        onChange={(e) =>
                          updateLine(index, "debit", Number(e.target.value))
                        }
                        className="w-full px-2 py-1 border border-gray-200 rounded text-right"
                      />
                    </td>
                    <td className="py-1">
                      <input
                        type="number"
                        step="0.01"
                        value={line.credit || ""}
                        onChange={(e) =>
                          updateLine(index, "credit", Number(e.target.value))
                        }
                        className="w-full px-2 py-1 border border-gray-200 rounded text-right"
                      />
                    </td>
                    <td className="py-1">
                      <button
                        onClick={() =>
                          setLines(lines.filter((_, i) => i !== index))
                        }
                        disabled={lines.length <= 2}
                        className="text-gray-400 hover:text-red-500 disabled:opacity-30"
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-3 flex justify-end gap-6 text-sm font-medium">
              <span className="text-green-700">
                Debit: ${totalDebit.toFixed(2)}
              </span>
              <span className="text-red-700">
                Credit: ${totalCredit.toFixed(2)}
              </span>
              <span className={balanced ? "text-green-600" : "text-red-600"}>
                {balanced
                  ? "✓ Balanced"
                  : `✗ Diff: $${Math.abs(totalDebit - totalCredit).toFixed(2)}`}
              </span>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!description.trim() || !balanced || saving}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? "Saving..." : "Create Entry (DRAFT)"}
          </button>
        </div>
      </div>
    </div>
  );
}

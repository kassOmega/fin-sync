"use client";

/**
 * Company Finance nested pages no longer render their own sub-navigation —
 * the parent company layout provides the Finance sub-nav (Incomes, Expenses,
 * Purchases, Sales, Accounts, Ledger, Reports). This layout only wraps content.
 */
export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <div className="space-y-6">{children}</div>;
}

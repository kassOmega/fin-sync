"use client";

import SegmentedTabs from "@/components/SegmentedTabs";
import { SystemRole } from "@/lib/types";
import { useParams } from "next/navigation";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const companyId = params.companyId as string;

  const basePath = `/dashboard/companies/${companyId}/finance`;

  const tabs = [
    {
      name: "Incomes",
      href: "/incomes",
      roles: [SystemRole.Owner, SystemRole.Cashier, SystemRole.Sales],
    },
    {
      name: "Expenses",
      href: "/expenses",
      roles: [SystemRole.Owner, SystemRole.Cashier],
    },
    {
      name: "Purchases",
      href: "/purchases",
      roles: [SystemRole.Owner, SystemRole.Cashier, SystemRole.Storekeeper],
    },
    {
      name: "Sales",
      href: "/sales",
      roles: [SystemRole.Owner, SystemRole.Cashier, SystemRole.Sales],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Compact pill segmented control — no second underline tab bar */}
      <SegmentedTabs basePath={basePath} tabs={tabs} />
      {children}
    </div>
  );
}

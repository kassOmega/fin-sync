"use client";

import SegmentedTabs from "@/components/SegmentedTabs";
import { useParams } from "next/navigation";

export default function ProjectFinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;

  const base = `/dashboard/companies/${companyId}/projects/${projectId}/finance`;
  const tabs = [
    { name: "Incomes", href: "/incomes" },
    { name: "Expenses", href: "/expenses" },
    { name: "Purchases", href: "/purchases" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-xl font-bold text-gray-800">Project Finance</h2>
        <SegmentedTabs basePath={base} tabs={tabs} />
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border">{children}</div>
    </div>
  );
}

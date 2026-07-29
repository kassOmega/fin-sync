"use client";

import { ShoppingCart, TrendingDown, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function ProjectFinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const pathname = usePathname();

  const base = `/dashboard/companies/${companyId}/projects/${projectId}/finance`;
  const tabs = [
    { name: "Incomes", href: "/incomes", icon: TrendingUp },
    { name: "Expenses", href: "/expenses", icon: TrendingDown },
    { name: "Purchases", href: "/purchases", icon: ShoppingCart },
  ];

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-gray-800">Project Finance</h2>
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1">
          {tabs.map((tab) => {
            const href = `${base}${tab.href}`;
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <Link
                key={tab.name}
                href={href}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors flex items-center gap-1.5 ${isActive ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border">{children}</div>
    </div>
  );
}

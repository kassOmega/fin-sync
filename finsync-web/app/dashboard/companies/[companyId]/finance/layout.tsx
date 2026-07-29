"use client";

import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";

export default function FinanceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const companyId = params.companyId as string;
  const { hasRole } = useAuthStore();

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

  const visibleTabs = tabs.filter((tab) => hasRole(tab.roles));

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="flex space-x-1">
          {visibleTabs.map((tab) => {
            const href = `${basePath}${tab.href}`;
            const isActive = pathname === href;
            return (
              <Link
                key={tab.name}
                href={href}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  isActive
                    ? "border-indigo-600 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.name}
              </Link>
            );
          })}
        </nav>
      </div>
      {children}
    </div>
  );
}

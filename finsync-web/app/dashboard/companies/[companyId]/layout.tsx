"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const companyId = params.companyId as string;
  const { user, hasRole } = useAuthStore();
  const [company, setCompany] = useState<{
    name: string;
    industry?: string;
  } | null>(null);

  useEffect(() => {
    if (companyId) {
      api.get(`/companies/${companyId}`).then((res) => setCompany(res.data));
      useAuthStore.getState().setActiveCompany(Number(companyId));
    }
  }, [companyId]);

  const navItems = [
    {
      name: "Overview",
      href: ``,
      roles: [
        SystemRole.Owner,
        SystemRole.Cashier,
        SystemRole.Sales,
        SystemRole.Storekeeper,
        SystemRole.OperatorDriver,
        SystemRole.ProjectManager,
        SystemRole.Foreman,
      ],
    },
    {
      name: "Finance",
      href: `/finance/incomes`,
      roles: [SystemRole.Owner, SystemRole.Cashier, SystemRole.Sales],
    },
    { name: "Staff", href: `/staff`, roles: [SystemRole.Owner] },
    {
      name: "Employees",
      href: `/employees`,
      roles: [SystemRole.Owner, SystemRole.ProjectManager],
    },
    {
      name: "Projects",
      href: `/projects`,
      roles: [SystemRole.Owner, SystemRole.ProjectManager, SystemRole.Foreman],
    },
    {
      name: "Machineries",
      href: `/machineries`,
      roles: [
        SystemRole.Owner,
        SystemRole.OperatorDriver,
        SystemRole.ProjectManager,
      ],
    },
    {
      name: "Store",
      href: `/store`,
      roles: [SystemRole.Owner, SystemRole.Storekeeper],
    },
    { name: "Roles", href: `/roles`, roles: [SystemRole.Owner] },
    { name: "Reports", href: `/reports`, roles: [SystemRole.Owner] },
  ];

  const filteredNavItems = navItems.filter((item) => hasRole(item.roles));

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-8 gap-8">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 lg:px-8 py-4 flex items-center space-x-4">
          <Link
            href="/dashboard/companies"
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              {company?.name || "Loading..."}
            </h1>
            {company?.industry && (
              <p className="text-xs text-gray-500">{company.industry}</p>
            )}
          </div>
        </div>
        <nav className="flex overflow-x-auto px-4 lg:px-8 border-t border-gray-100">
          {filteredNavItems.map((item) => {
            const href = `/dashboard/companies/${companyId}${item.href}`;
            const isActive =
              item.href === "" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={item.name}
                href={href}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${isActive ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
              >
                {item.name}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}

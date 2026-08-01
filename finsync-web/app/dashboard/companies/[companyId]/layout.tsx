"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useEffect, useState } from "react";

interface NavItem {
  name: string;
  href: string;
  roles: SystemRole[];
}

interface NavGroup {
  name: string;
  href: string; // Main category href — points at its first child by default
  roles: SystemRole[];
  items: NavItem[];
}

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const companyId = params.companyId as string;
  const { hasRole } = useAuthStore();
  const isProjectPage = pathname.includes("/projects/");
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

  const allRoles = [
    SystemRole.Owner,
    SystemRole.Cashier,
    SystemRole.Sales,
    SystemRole.Storekeeper,
    SystemRole.OperatorDriver,
    SystemRole.ProjectManager,
    SystemRole.Foreman,
  ];

  const adminRoles = [SystemRole.Owner];

  const navGroups: NavGroup[] = [
    {
      name: "Overview",
      href: "",
      roles: allRoles,
      items: [],
    },
    {
      name: "Finance",
      href: "/finance/incomes",
      roles: [SystemRole.Owner, SystemRole.Cashier, SystemRole.Sales],
      items: [
        {
          name: "Incomes",
          href: "/finance/incomes",
          roles: [SystemRole.Owner, SystemRole.Cashier, SystemRole.Sales],
        },
        {
          name: "Expenses",
          href: "/finance/expenses",
          roles: [SystemRole.Owner, SystemRole.Cashier],
        },
        {
          name: "Purchases",
          href: "/finance/purchases",
          roles: [SystemRole.Owner, SystemRole.Cashier, SystemRole.Storekeeper],
        },
        {
          name: "Sales",
          href: "/finance/sales",
          roles: [SystemRole.Owner, SystemRole.Cashier, SystemRole.Sales],
        },
        {
          name: "Accounts",
          href: "/accounts",
          roles: [
            SystemRole.Owner,
            SystemRole.Cashier,
            SystemRole.ProjectManager,
          ],
        },
        {
          name: "Ledger",
          href: "/ledger",
          roles: [
            SystemRole.Owner,
            SystemRole.Cashier,
            SystemRole.ProjectManager,
          ],
        },
        {
          name: "Reports",
          href: "/reports",
          roles: [SystemRole.Owner],
        },
      ],
    },
    {
      name: "HR / Personnel",
      href: "/personnel/staff",
      roles: [SystemRole.Owner],
      items: [
        { name: "Staff", href: "/personnel/staff", roles: adminRoles },
        {
          name: "Employees",
          href: "/personnel/employees",
          roles: [SystemRole.Owner, SystemRole.ProjectManager],
        },
        {
          name: "Attendance",
          href: "/personnel/attendance",
          roles: [SystemRole.Owner, SystemRole.ProjectManager],
        },
        {
          name: "Timesheets",
          href: "/timesheets",
          roles: [
            SystemRole.Owner,
            SystemRole.ProjectManager,
            SystemRole.Foreman,
            SystemRole.OperatorDriver,
          ],
        },
        { name: "Payroll", href: "/personnel/payroll", roles: adminRoles },
      ],
    },
    {
      name: "Operations",
      href: "/projects",
      roles: [
        SystemRole.Owner,
        SystemRole.ProjectManager,
        SystemRole.Foreman,
        SystemRole.OperatorDriver,
        SystemRole.Storekeeper,
      ],
      items: [
        {
          name: "Projects",
          href: "/projects",
          roles: [
            SystemRole.Owner,
            SystemRole.ProjectManager,
            SystemRole.Foreman,
          ],
        },
        {
          name: "Machineries",
          href: "/machineries",
          roles: [
            SystemRole.Owner,
            SystemRole.OperatorDriver,
            SystemRole.ProjectManager,
          ],
        },
        {
          name: "Store",
          href: "/store",
          roles: [SystemRole.Owner, SystemRole.Storekeeper],
        },
      ],
    },
    {
      name: "Admin",
      href: "/roles",
      roles: adminRoles,
      items: [{ name: "Roles", href: "/roles", roles: adminRoles }],
    },
  ];

  // Filter out groups the user can't see
  const visibleGroups = navGroups.filter(
    (g) => g.roles.length === 0 || hasRole(g.roles),
  );

  // Determine which group is active based on current pathname
  const findActiveGroup = (): NavGroup | null => {
    for (const group of visibleGroups) {
      const base = `/dashboard/companies/${companyId}`;
      if (group.items.length === 0) {
        if (pathname === base) return group;
      } else {
        for (const item of group.items) {
          if (!hasRole(item.roles)) continue;
          const href = `${base}${item.href}`;
          if (pathname === href || pathname.startsWith(`${href}/`)) {
            return group;
          }
        }
      }
    }
    return visibleGroups.length > 0 ? visibleGroups[0] : null;
  };

  const activeGroup = findActiveGroup();

  // The sub-items to render under the active group (visible per role)
  const activeSubItems = activeGroup
    ? activeGroup.items.filter((item) => hasRole(item.roles))
    : [];

  // Choose the primary navigation href for each group:
  // first visible child if it has items, otherwise its own href
  const groupHref = (group: NavGroup): string => {
    const base = `/dashboard/companies/${companyId}`;
    if (group.items.length === 0) return base;
    const firstVisible = group.items.find((item) => hasRole(item.roles));
    return `${base}${(firstVisible || group).href}`;
  };

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-8 gap-8">
      {!isProjectPage && (
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
          {/* Top row: back button + company name */}
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

          {/* Primary navigation — main categories only */}
          <nav className="flex overflow-x-auto px-4 lg:px-8 border-t border-gray-100 items-stretch">
            {visibleGroups.map((group) => {
              const href = groupHref(group);
              const isActive =
                group === activeGroup ||
                (group.items.length === 0 && pathname === href);
              return (
                <Link
                  key={group.name}
                  href={href}
                  className={`px-5 py-3 text-sm font-semibold border-b-2 whitespace-nowrap flex items-center ${
                    isActive
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                      : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                  }`}
                >
                  {group.name}
                </Link>
              );
            })}
          </nav>

          {/* Secondary navigation — sub-items of the active group */}
          {activeGroup && activeSubItems.length > 0 && (
            <nav className="flex items-center px-4 lg:px-8 py-2 bg-gray-50 border-t border-gray-100 overflow-x-auto">
              <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mr-4 whitespace-nowrap">
                {activeGroup.name}
              </span>
              <div className="flex items-center gap-1">
                {activeSubItems.map((item) => {
                  const href = `/dashboard/companies/${companyId}${item.href}`;
                  const isActive =
                    pathname === href || pathname.startsWith(`${href}/`);
                  return (
                    <Link
                      key={item.name}
                      href={href}
                      className={`px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${
                        isActive
                          ? "bg-white text-indigo-600 shadow-sm"
                          : "text-gray-500 hover:text-gray-800 hover:bg-white/60"
                      }`}
                    >
                      {item.name}
                    </Link>
                  );
                })}
              </div>
            </nav>
          )}
        </header>
      )}
      <main
        className={`flex-1 overflow-y-auto p-4 lg:p-8 ${isProjectPage ? "bg-gray-50 pt-0" : "bg-gray-50"}`}
      >
        {children}
      </main>
    </div>
  );
}

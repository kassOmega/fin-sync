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

  const navGroups: {
    label?: string;
    items: {
      name: string;
      href: string;
      roles: SystemRole[];
    }[];
  }[] = [
    {
      items: [
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
      ],
    },
    {
      label: "Finance",
      items: [
        {
          name: "Finance",
          href: `/finance/incomes`,
          roles: [SystemRole.Owner, SystemRole.Cashier, SystemRole.Sales],
        },
        {
          name: "Accounts",
          href: `/accounts`,
          roles: [
            SystemRole.Owner,
            SystemRole.Cashier,
            SystemRole.ProjectManager,
          ],
        },
        {
          name: "Ledger",
          href: `/ledger`,
          roles: [
            SystemRole.Owner,
            SystemRole.Cashier,
            SystemRole.ProjectManager,
          ],
        },
        { name: "Reports", href: `/reports`, roles: [SystemRole.Owner] },
      ],
    },
    {
      label: "HR / Personnel",
      items: [
        { name: "Staff", href: `/personnel/staff`, roles: [SystemRole.Owner] },
        {
          name: "Employees",
          href: `/personnel/employees`,
          roles: [SystemRole.Owner, SystemRole.ProjectManager],
        },
        {
          name: "Attendance",
          href: `/personnel/attendance`,
          roles: [SystemRole.Owner, SystemRole.ProjectManager],
        },
        {
          name: "Timesheets",
          href: `/timesheets`,
          roles: [
            SystemRole.Owner,
            SystemRole.ProjectManager,
            SystemRole.Foreman,
            SystemRole.OperatorDriver,
          ],
        },
        {
          name: "Payroll",
          href: `/personnel/payroll`,
          roles: [SystemRole.Owner],
        },
      ],
    },
    {
      label: "Operations",
      items: [
        {
          name: "Projects",
          href: `/projects`,
          roles: [
            SystemRole.Owner,
            SystemRole.ProjectManager,
            SystemRole.Foreman,
          ],
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
      ],
    },
    {
      label: "Admin",
      items: [{ name: "Roles", href: `/roles`, roles: [SystemRole.Owner] }],
    },
  ];

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-8 gap-8">
      {!isProjectPage && (
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
          <nav className="flex overflow-x-auto px-4 lg:px-8 border-t border-gray-100 items-stretch">
            {navGroups.map((group) => {
              // Skip empty groups
              const groupItems = group.items;
              if (groupItems.length === 0) return null;
              return (
                <div
                  key={group.label || "overview"}
                  className="flex items-stretch"
                >
                  {group.label && (
                    <span className="px-3 py-3 text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center border-b-2 border-transparent">
                      {group.label}
                    </span>
                  )}
                  {groupItems.map((item) => {
                    if (!hasRole(item.roles)) return null;
                    const href = `/dashboard/companies/${companyId}${item.href}`;
                    const isActive =
                      item.href === ""
                        ? pathname === href
                        : pathname.startsWith(href);
                    return (
                      <Link
                        key={item.name}
                        href={href}
                        className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap flex items-center ${
                          isActive
                            ? "border-indigo-600 text-indigo-600"
                            : "border-transparent text-gray-500 hover:text-gray-800"
                        }`}
                      >
                        {item.name}
                      </Link>
                    );
                  })}
                  {group.label && (
                    <span className="mx-1 my-2 w-px bg-gray-200" />
                  )}
                </div>
              );
            })}
          </nav>
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

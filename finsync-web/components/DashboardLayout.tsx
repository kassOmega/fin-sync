"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { useLangStore } from "@/store/langStore";
import {
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  ClipboardList,
  Globe,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  ReceiptText,
  Store,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user, logout, hasRole, activeCompanyId } = useAuthStore();
  const { lang, setLang, t } = useLangStore();
  const pathname = usePathname();

  useEffect(() => {
    if (!user) return;
    const fetchUnread = () => {
      api
        .get("/notifications/unread-count")
        .then((res) => setUnreadCount(res.data))
        .catch(() => {});
    };
    fetchUnread();
    // Poll every 60 seconds
    const interval = setInterval(fetchUnread, 60000);
    return () => clearInterval(interval);
  }, [user]);

  if (!user) return null;

  const navItems = [
    {
      name: t("nav.dashboard"),
      href: "/dashboard",
      icon: LayoutDashboard,
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
      name: t("nav.personal"),
      href: "/dashboard/personal",
      icon: Wallet,
      roles: [SystemRole.Owner],
    },
    {
      name: t("nav.companies"),
      href: "/dashboard/companies",
      icon: Building2,
      roles: [SystemRole.Owner],
    },
    {
      name: t("nav.requisitions"),
      href: "/dashboard/requisitions",
      icon: ClipboardList,
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
      name: t("nav.projects"),
      href: activeCompanyId
        ? `/dashboard/companies/${activeCompanyId}/projects`
        : "/dashboard",
      icon: Package,
      roles: [SystemRole.ProjectManager, SystemRole.Foreman],
    },
    ...(activeCompanyId
      ? [
          {
            name: "Accounting",
            href: `/dashboard/companies/${activeCompanyId}/accounts`,
            icon: BookOpen,
            roles: [
              SystemRole.Owner,
              SystemRole.Cashier,
              SystemRole.ProjectManager,
            ],
          },
          {
            name: "Leave",
            href: `/dashboard/companies/${activeCompanyId}/personnel/leaves`,
            icon: CalendarDays,
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
            name: "Payroll",
            href: `/dashboard/companies/${activeCompanyId}/personnel/payroll`,
            icon: ReceiptText,
            roles: [SystemRole.Owner, SystemRole.Cashier],
          },
          {
            name: "Store",
            href: `/dashboard/companies/${activeCompanyId}/store`,
            icon: Store,
            roles: [
              SystemRole.Owner,
              SystemRole.Storekeeper,
              SystemRole.Sales,
              SystemRole.ProjectManager,
            ],
          },
        ]
      : []),
    {
      name: t("nav.machinery"),
      href: activeCompanyId
        ? `/dashboard/companies/${activeCompanyId}/machineries`
        : "/dashboard",
      icon: Wrench,
      roles: [SystemRole.OperatorDriver],
    },
    {
      name: t("nav.notifications"),
      href: "/dashboard/notifications",
      icon: Bell,
      badge: unreadCount,
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
  ];

  const filteredNavItems = navItems.filter((item) => hasRole(item.roles));

  return (
    <div className="h-screen flex overflow-hidden bg-gray-100">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={`fixed lg:relative lg:translate-x-0 z-50 w-64 h-full bg-gray-900 text-white transition-transform duration-300 ease-in-out ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-gray-800">
          <span className="text-xl font-bold">FinSync</span>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="mt-4 flex-1 px-2 space-y-1 overflow-y-auto">
          {filteredNavItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
              >
                <span className="relative mr-3">
                  <item.icon className="h-5 w-5" />
                  {(item as { badge?: number }).badge != null &&
                    (item as { badge?: number }).badge! > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                        {(item as { badge?: number }).badge! > 9
                          ? "9+"
                          : (item as { badge?: number }).badge}
                      </span>
                    )}
                </span>
                {item.name}
              </Link>
            );
          })}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={logout}
            className="flex items-center w-full px-2 py-2 text-sm font-medium text-gray-300 rounded-md hover:bg-gray-700 hover:text-white"
          >
            <LogOut className="mr-3 h-5 w-5" />
            {t("nav.logout")}
          </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-500"
          >
            <Menu className="h-6 w-6" />
          </button>
          <div className="flex-1 lg:flex hidden">
            <h1 className="text-lg font-semibold text-gray-800">
              {t("header.welcome")}, {user.name}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setLang(lang === "en" ? "am" : "en")}
              className="flex items-center px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50"
            >
              <Globe className="h-4 w-4 mr-1" />
              {lang === "en" ? "EN" : "አማ"}
            </button>

            <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
              {user.role}
            </span>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}

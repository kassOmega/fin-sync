"use client";

import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import {
  Bell,
  Building2,
  Forklift,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Users,
  Wallet,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout, hasRole } = useAuthStore();
  const pathname = usePathname();

  if (!user) return null;

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: LayoutDashboard,
      roles: [
        SystemRole.Owner,
        SystemRole.Cashier,
        SystemRole.Storekeeper,
        SystemRole.OperatorDriver,
        SystemRole.ProjectManager,
      ],
    },
    {
      name: "Personal Finance",
      href: "/dashboard/personal",
      icon: Wallet,
      roles: [SystemRole.Owner],
    },
    {
      name: "Companies",
      href: "/dashboard/companies",
      icon: Building2,
      roles: [SystemRole.Owner],
    },
    {
      name: "My Company",
      href: "/dashboard/company",
      icon: Building2,
      roles: [
        SystemRole.Cashier,
        SystemRole.Storekeeper,
        SystemRole.OperatorDriver,
        SystemRole.ProjectManager,
      ],
    },
    {
      name: "Staff",
      href: "/dashboard/staff",
      icon: Users,
      roles: [SystemRole.Owner],
    },
    {
      name: "Machineries",
      href: "/dashboard/machineries",
      icon: Forklift,
      roles: [SystemRole.Owner, SystemRole.OperatorDriver],
    },
    {
      name: "Store",
      href: "/dashboard/store",
      icon: Package,
      roles: [SystemRole.Owner, SystemRole.Storekeeper],
    },
    {
      name: "Notifications",
      href: "/dashboard/notifications",
      icon: Bell,
      roles: [
        SystemRole.Owner,
        SystemRole.Cashier,
        SystemRole.Storekeeper,
        SystemRole.OperatorDriver,
        SystemRole.ProjectManager,
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
                className={`flex items-center px-2 py-2 text-sm font-medium rounded-md ${isActive ? "bg-gray-800 text-white" : "text-gray-300 hover:bg-gray-700 hover:text-white"}`}
              >
                <item.icon className="mr-3 h-5 w-5" />
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
            Sign Out
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
              Welcome, {user.name}
            </h1>
          </div>
          <div className="flex items-center">
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

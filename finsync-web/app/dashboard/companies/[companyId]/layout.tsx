"use client";

import api from "@/lib/api";
import {
  ArrowLeft,
  BarChart3,
  Building2,
  Forklift,
  Package,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function CompanyLayout({ children, params }) {
  const pathname = usePathname();
  const companyId = params.companyId;
  const [company, setCompany] = useState(null);

  useEffect(() => {
    api.get(`/companies/${companyId}`).then((res) => setCompany(res.data));
  }, [companyId]);

  const navItems = [
    {
      name: "Overview",
      href: `/dashboard/companies/${companyId}`,
      icon: Building2,
    },
    {
      name: "Incomes",
      href: `/dashboard/companies/${companyId}/incomes`,
      icon: Wallet,
    },
    {
      name: "Expenses",
      href: `/dashboard/companies/${companyId}/expenses`,
      icon: Wallet,
    },
    {
      name: "Staff",
      href: `/dashboard/companies/${companyId}/staff`,
      icon: Users,
    },
    {
      name: "Machineries",
      href: `/dashboard/companies/${companyId}/machineries`,
      icon: Forklift,
    },
    {
      name: "Store",
      href: `/dashboard/companies/${companyId}/store`,
      icon: Package,
    },
    {
      name: "Reports",
      href: `/dashboard/companies/${companyId}/reports`,
      icon: BarChart3,
    },
  ];

  return (
    <div className="flex h-full -m-4 lg:-m-8">
      {/* Company Sub-Sidebar */}
      <aside className="w-64 bg-gray-800 text-white flex-col hidden md:flex">
        <div className="p-4 border-b border-gray-700">
          <Link
            href="/dashboard/companies"
            className="flex items-center text-gray-400 hover:text-white text-sm mb-2"
          >
            <ArrowLeft className="h-4 w-4 mr-1" /> Back to Companies
          </Link>
          <h2 className="font-bold text-lg truncate">
            {company?.name || "Company"}
          </h2>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center px-2 py-2 text-sm rounded-md ${isActive ? "bg-gray-900 text-white" : "text-gray-300 hover:bg-gray-700"}`}
              >
                <item.icon className="h-5 w-5 mr-3" /> {item.name}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content for Company */}
      <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gray-50">
        {children}
      </main>
    </div>
  );
}

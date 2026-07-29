"use client";

import {
  ArrowLeft,
  BarChart3,
  Briefcase,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";

export default function ProjectLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams();
  const companyId = params.companyId as string;
  const projectId = params.projectId as string;
  const router = useRouter();

  if (!companyId || !projectId) {
    router.push("/dashboard/companies");
    return null;
  }

  const base = `/dashboard/companies/${companyId}/projects/${projectId}`;
  const tabs = [
    { name: "Overview", href: "", icon: Briefcase },
    { name: "Finance", href: "/finance/incomes", icon: TrendingUp },
    { name: "Personnel", href: "/personnel", icon: Users },
    { name: "Timesheets", href: "/timesheets", icon: Clock },
    { name: "Store", href: "/store", icon: Package },
    { name: "Machinery", href: "/machinery", icon: Wrench },
    { name: "Reports", href: "/reports", icon: BarChart3 },
    { name: "Payroll", href: "/payroll", icon: DollarSign },
  ];

  return (
    <div className="flex flex-col h-full -m-4 lg:-m-8 gap-6">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="px-4 lg:px-8 py-4 flex items-center space-x-4">
          <Link
            href={`/dashboard/companies/${companyId}/projects`}
            className="p-2 hover:bg-gray-100 rounded-md"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </Link>
          <h1 className="text-xl font-bold text-gray-800">Project Details</h1>
        </div>
        <nav className="flex overflow-x-auto px-4 lg:px-8 border-t border-gray-100">
          {tabs.map((tab) => {
            const href = `${base}${tab.href}`;
            const isActive =
              tab.href === "" ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={tab.name}
                href={href}
                className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap flex items-center gap-1.5 ${isActive ? "border-indigo-600 text-indigo-600" : "border-transparent text-gray-500 hover:text-gray-800"}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.name}
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

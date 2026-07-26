"use client";

import api from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation"; // Import useParams
import { useEffect, useState } from "react";

export default function CompanyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const params = useParams(); // Use the hook
  const companyId = params.companyId as string; // Extract companyId safely
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    if (companyId) {
      api.get(`/companies/${companyId}`).then((res) => setCompany(res.data));
    }
  }, [companyId]);

  const navItems = [
    { name: "Overview", href: `` },
    { name: "Incomes", href: `/incomes` },
    { name: "Expenses", href: `/expenses` },
    { name: "Staff", href: `/staff` },
    { name: "Employees", href: `/employees` }, // <-- ADD THIS LINE
    { name: "Projects", href: `/projects` },
    { name: "Machineries", href: `/machineries` },
    { name: "Store", href: `/store` },
    { name: "Reports", href: `/reports` },
  ];

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
        {/* Horizontal Navbar */}
        <nav className="flex overflow-x-auto px-4 lg:px-8 border-t border-gray-100">
          {navItems.map((item) => {
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

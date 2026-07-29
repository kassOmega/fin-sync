"use client";

import api from "@/lib/api";
import {
  BarChart3,
  Flag,
  Forklift,
  Package,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

interface Company {
  id: number;
  name: string;
  industry?: string;
}

export default function CompanyOverview() {
  const params = useParams();
  const companyId = params.companyId as string;
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    api.get(`/companies/${companyId}`).then((res) => setCompany(res.data));
  }, [companyId]);

  if (!company) return <div>Loading company...</div>;

  const cards = [
    { name: "Incomes", href: "incomes", icon: Wallet },
    { name: "Expenses", href: "expenses", icon: Wallet },
    { name: "Staff", href: "staff", icon: Users },
    { name: "Projects", href: "projects", icon: Flag }, // <-- Added Projects Link here
    { name: "Machineries", href: "machineries", icon: Forklift },
    { name: "Store", href: "store", icon: Package },
    { name: "Reports", href: "reports", icon: BarChart3 },
  ];

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.name}
            href={`/dashboard/companies/${companyId}/${card.href}`}
            className="bg-white p-6 rounded-lg shadow-sm border border-gray-200 hover:border-indigo-500 flex flex-col items-center justify-center text-center transition-all hover:shadow-md"
          >
            <card.icon className="h-10 w-10 text-indigo-600 mb-2" />
            <span className="font-medium text-gray-800">{card.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

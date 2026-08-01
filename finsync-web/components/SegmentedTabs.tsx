"use client";

import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import Link from "next/link";
import { usePathname } from "next/navigation";

export interface SegmentedTab {
  name: string;
  href: string;
  roles?: SystemRole[];
}

/**
 * Clean pill / segmented control for secondary sub-navigation.
 * Renders a subtle rounded container with an active white pill card —
 * used INSTEAD of a second underline tab bar (prevents double-stacked tabs).
 */
export default function SegmentedTabs({
  basePath,
  tabs,
  className = "",
}: {
  basePath: string;
  tabs: SegmentedTab[];
  className?: string;
}) {
  const pathname = usePathname();
  const { hasRole } = useAuthStore();

  const visibleTabs = tabs.filter(
    (tab) => !tab.roles || tab.roles.length === 0 || hasRole(tab.roles),
  );

  return (
    <div
      className={`inline-flex items-center gap-1 bg-gray-100 rounded-lg p-1 ${className}`}
    >
      {visibleTabs.map((tab) => {
        const href = `${basePath}${tab.href}`;
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={tab.name}
            href={href}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${
              isActive
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700 hover:bg-white/50"
            }`}
          >
            {tab.name}
          </Link>
        );
      })}
    </div>
  );
}

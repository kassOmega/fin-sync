"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, hasHydrated } = useAuthStore();

  useEffect(() => {
    // Wait for hydration. If hydrated and no token, redirect.
    if (hasHydrated && !token) {
      router.push("/login");
    }
  }, [hasHydrated, token, router]);

  // Show loading spinner while store is hydrating or if token exists but user isn't fetched yet
  if (!hasHydrated || (token && !user)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!token || !user) {
    // This will briefly show before the redirect effect runs
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

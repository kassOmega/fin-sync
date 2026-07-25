"use client";

import DashboardLayout from "@/components/DashboardLayout";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { token, user, hasHydrated } = useAuthStore();

  // 🔍 Add debug logging here
  console.log("ProtectedLayout State:", {
    hasHydrated,
    token: !!token,
    user: !!user,
  });

  useEffect(() => {
    if (hasHydrated && !token) {
      console.log("Redirecting to /login...");
      router.push("/login");
    }
  }, [hasHydrated, token, router]);

  if (!hasHydrated || (token && !user)) {
    console.log("Rendering Loading Spinner...");
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!token || !user) {
    console.log("Rendering Null (Blank DOM)...");
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

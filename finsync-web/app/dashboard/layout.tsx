"use client";

import DashboardLayout from "@/components/DashboardLayout";
import Loading from "@/components/Loading";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, hasHydrated } = useAuthStore();

  useEffect(() => {
    // If hydrated, but token or user is missing -> go to login
    if (hasHydrated && (!token || !user)) {
      router.push("/login");
    }
  }, [hasHydrated, token, user, router]);

  // Show loading spinner while hydrating
  if (!hasHydrated) {
    return <Loading fullScreen />;
  }

  // If token or user is missing, render null while redirect happens
  if (!token || !user) {
    return null;
  }

  return <DashboardLayout>{children}</DashboardLayout>;
}

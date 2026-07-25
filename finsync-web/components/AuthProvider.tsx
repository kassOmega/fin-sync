"use client";

import api from "@/lib/api";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { token, setAuth, logout, hasHydrated, setHasHydrated } =
    useAuthStore();

  useEffect(() => {
    // Only run this check once the store has hydrated from localStorage
    if (hasHydrated && token) {
      api
        .get("/users/me")
        .then((res) => setAuth(res.data, token))
        .catch(() => logout());
    } else if (hasHydrated && !token) {
      // If hydrated and no token, ensure we don't block UI if on a public route
    }
  }, [hasHydrated]);

  return <>{children}</>;
}

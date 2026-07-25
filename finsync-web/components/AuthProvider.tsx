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
    // 1. Tell the app we have mounted on the client and read localStorage
    if (!hasHydrated) {
      setHasHydrated(true);
    }

    // 2. If we have a token, verify it and fetch the user profile
    if (token) {
      api
        .get("/users/me", {
          headers: {
            // Explicitly attach the token to avoid interceptor race conditions
            Authorization: `Bearer ${token}`,
          },
        })
        .then((res) => setAuth(res.data, token))
        .catch(() => logout());
    }
  }, []); // Run exactly once on mount

  return <>{children}</>;
}

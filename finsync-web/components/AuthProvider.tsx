"use client";

import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { hasHydrated, setHasHydrated } = useAuthStore();

  useEffect(() => {
    // Tell the app we have mounted on the client and read localStorage
    if (!hasHydrated) {
      setHasHydrated(true);
    }
  }, [hasHydrated, setHasHydrated]);

  return <>{children}</>;
}

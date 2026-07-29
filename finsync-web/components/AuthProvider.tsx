"use client";

import api from "@/lib/api";
import { SystemRole } from "@/lib/types";
import { useAuthStore } from "@/store/authStore";
import { useEffect } from "react";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const {
    hasHydrated,
    setHasHydrated,
    user,
    activeCompanyId,
    setActiveCompany,
  } = useAuthStore();

  useEffect(() => {
    // Tell the app we have mounted on the client and read localStorage
    if (!hasHydrated) {
      setHasHydrated(true);
    }
  }, [hasHydrated, setHasHydrated]);

  useEffect(() => {
    // For non-Owner users, auto-fetch their assigned company
    if (
      hasHydrated &&
      user &&
      user.role !== SystemRole.Owner &&
      activeCompanyId === null
    ) {
      api
        .get("/users/me/company")
        .then((res) => {
          if (res.data?.company?.id) {
            setActiveCompany(res.data.company.id);
          }
        })
        .catch(() => {
          // User may not be assigned to a company yet — ignore
        });
    }
  }, [hasHydrated, user, activeCompanyId, setActiveCompany]);

  return <>{children}</>;
}

import { SystemRole, User } from "@/lib/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  token: string | null;
  hasHydrated: boolean;
  activeCompanyId: number | null;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
  setActiveCompany: (companyId: number | null) => void;
  hasRole: (roles: SystemRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hasHydrated: false,
      activeCompanyId: null,
      setAuth: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null, activeCompanyId: null }),
      setHasHydrated: (state) => set({ hasHydrated: state }),
      setActiveCompany: (companyId) => set({ activeCompanyId: companyId }),
      hasRole: (roles) => {
        const user = get().user;
        if (!user) return false;
        return roles.includes(user.role as SystemRole);
      },
    }),
    {
      name: "finsync-auth-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) =>
        ({
          user: state.user,
          token: state.token,
          activeCompanyId: state.activeCompanyId,
        }) as AuthState,
    },
  ),
);

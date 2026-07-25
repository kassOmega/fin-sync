import { SystemRole, User } from "@/lib/types";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

interface AuthState {
  user: User | null;
  token: string | null;
  hasHydrated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
  hasRole: (roles: SystemRole[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      hasHydrated: false,
      setAuth: (user, token) => {
        set({ user, token });
        localStorage.setItem("finsync_token", token);
      },
      logout: () => {
        set({ user: null, token: null });
        localStorage.removeItem("finsync_token");
      },
      setHasHydrated: (state) => set({ hasHydrated: state }),
      hasRole: (roles) => {
        const user = get().user;
        if (!user) return false;
        return roles.includes(user.role as SystemRole);
      },
    }),
    {
      name: "finsync-auth-storage", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // use localStorage
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
        // Sync token to the key that api.ts interceptor expects
        if (state?.token) {
          localStorage.setItem("finsync_token", state.token);
        }
      },
    },
  ),
);

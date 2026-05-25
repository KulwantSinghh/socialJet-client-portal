'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface AuthState {
  access_token: string | null;
  role: string | null;
  _hasHydrated: boolean;
  setAuth: (token: string, role: string) => void;
  clearAuth: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access_token: null,
      role: null,
      _hasHydrated: false,
      setAuth: (token, role) => set({ access_token: token, role }),
      clearAuth: () => set({ access_token: null, role: null }),
      setHasHydrated: (state) => set({ _hasHydrated: state }),
    }),
    {
      name: 'sj-client-auth',
      storage: createJSONStorage(() => sessionStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

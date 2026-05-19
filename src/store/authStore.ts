'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  access_token: string | null;
  role: string | null;
  setAuth: (token: string, role: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access_token: null,
      role: null,
      setAuth: (token, role) => set({ access_token: token, role }),
      clearAuth: () => set({ access_token: null, role: null }),
    }),
    {
      name: 'sj-client-auth',
    }
  )
);

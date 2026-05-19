'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { requestOtp, verifyOtp } from '@/services/api/auth.service';
import { useAuthStore } from '@/store/authStore';

export function useRequestOtp() {
  return useMutation({
    mutationFn: (email: string) => requestOtp(email),
  });
}

export function useVerifyOtp() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const router = useRouter();

  return useMutation({
    mutationFn: ({ email, otp }: { email: string; otp: string }) =>
      verifyOtp(email, otp),
    onSuccess: (data) => {
      setAuth(data.access_token, data.role);
      router.replace('/campaigns');
    },
  });
}

export function useAuth() {
  const token = useAuthStore((s) => s.access_token);
  const role = useAuthStore((s) => s.role);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  return { token, role, clearAuth, isAuthenticated: Boolean(token) };
}

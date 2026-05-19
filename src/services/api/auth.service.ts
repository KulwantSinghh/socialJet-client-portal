import apiClient from './axios';
import { ENDPOINTS } from './endpoints';
import type { AuthResponse } from '@/types';

export async function requestOtp(email: string): Promise<{ message: string }> {
  const { data } = await apiClient.post<{ message: string }>(
    ENDPOINTS.AUTH_OTP_REQUEST,
    { email }
  );
  return data;
}

export async function verifyOtp(email: string, otp: string): Promise<AuthResponse> {
  const { data } = await apiClient.post<AuthResponse>(
    ENDPOINTS.AUTH_OTP_VERIFY,
    { email, otp }
  );
  return data;
}

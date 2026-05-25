'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import styles from './AuthGuard.module.css';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const token = useAuthStore((s) => s.access_token);
  const hasHydrated = useAuthStore((s) => s._hasHydrated);
  const router = useRouter();

  useEffect(() => {
    if (hasHydrated && !token) {
      router.replace('/login');
    }
  }, [token, hasHydrated, router]);

  if (!hasHydrated || !token) {
    return (
      <div className={styles.loading}>
        <span className={styles.spinner} />
      </div>
    );
  }

  return <>{children}</>;
}

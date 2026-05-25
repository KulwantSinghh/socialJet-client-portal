'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import styles from './Navbar.module.css';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  function handleLogout() {
    clearAuth();
    router.replace('/login');
  }

  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <Link href="/dashboard" className={styles.brand}>
          <span className={styles.brandMark}>SJ</span>
          <span className={styles.brandName}>Client Portal</span>
        </Link>

        <ul className={styles.links}>
          <li>
            <Link
              href="/dashboard"
              className={`${styles.link} ${pathname === '/dashboard' ? styles.linkActive : ''}`}
            >
              Dashboard
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/proposals"
              className={`${styles.link} ${pathname.startsWith('/dashboard/proposals') ? styles.linkActive : ''}`}
            >
              Proposals
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/onboarding"
              className={`${styles.link} ${pathname.startsWith('/dashboard/onboarding') ? styles.linkActive : ''}`}
            >
              Onboarding
            </Link>
          </li>
          <li>
            <Link
              href="/dashboard/influencers"
              className={`${styles.link} ${pathname.startsWith('/dashboard/influencers') ? styles.linkActive : ''}`}
            >
              Influencers
            </Link>
          </li>
          <li>
            <Link
              href="/campaigns"
              className={`${styles.link} ${pathname.startsWith('/campaigns') ? styles.linkActive : ''}`}
            >
              Campaigns
            </Link>
          </li>
        </ul>

        <button className={styles.logoutBtn} onClick={handleLogout} type="button">
          Sign out
        </button>
      </nav>
    </header>
  );
}

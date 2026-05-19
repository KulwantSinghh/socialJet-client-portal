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
        <Link href="/campaigns" className={styles.brand}>
          <span className={styles.brandMark}>SJ</span>
          <span className={styles.brandName}>Client Portal</span>
        </Link>

        <ul className={styles.links}>
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

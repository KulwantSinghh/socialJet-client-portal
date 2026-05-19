'use client';

import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { CampaignCard } from '@/components/CampaignCard';
import { useCampaigns } from '@/hooks/useCampaigns';
import styles from './campaigns.module.css';

export default function CampaignsPage() {
  return (
    <AuthGuard>
      <Navbar />
      <CampaignsList />
    </AuthGuard>
  );
}

function CampaignsList() {
  const { data, isLoading, isError, error } = useCampaigns();

  if (isLoading) {
    return (
      <main className={styles.main}>
        <div className={styles.loadingGrid}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={styles.skeleton} />
          ))}
        </div>
      </main>
    );
  }

  if (isError) {
    return (
      <main className={styles.main}>
        <div className={styles.errorState}>
          <p className={styles.errorText}>
            Failed to load campaigns.{' '}
            {error instanceof Error ? error.message : 'Please try again.'}
          </p>
        </div>
      </main>
    );
  }

  const campaigns = data?.campaigns ?? [];

  return (
    <main className={styles.main}>
      <div className={styles.header}>
        <h1 className={styles.heading}>Campaigns</h1>
        <p className={styles.subheading}>
          {campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}
        </p>
      </div>

      {campaigns.length === 0 ? (
        <div className={styles.emptyState}>
          <p className={styles.emptyText}>No campaigns found.</p>
        </div>
      ) : (
        <div className={styles.grid}>
          {campaigns.map((campaign) => (
            <CampaignCard key={campaign.id} campaign={campaign} />
          ))}
        </div>
      )}
    </main>
  );
}

import Link from 'next/link';
import type { Campaign } from '@/types';
import styles from './CampaignCard.module.css';

interface CampaignCardProps {
  campaign: Campaign;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function CampaignCard({ campaign }: CampaignCardProps) {
  const statusClass =
    campaign.status === 'active'
      ? styles.statusActive
      : campaign.status === 'completed'
      ? styles.statusCompleted
      : styles.statusDraft;

  return (
    <Link href={`/campaigns/${campaign.id}`} className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.name}>{campaign.name}</h3>
        <span className={`${styles.status} ${statusClass}`}>{campaign.status}</span>
      </div>

      <p className={styles.brand}>{campaign.brand}</p>

      {campaign.description && (
        <p className={styles.description}>{campaign.description}</p>
      )}

      <div className={styles.meta}>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Dates</span>
          <span className={styles.metaValue}>
            {formatDate(campaign.start_date)} &mdash; {formatDate(campaign.end_date)}
          </span>
        </div>
        <div className={styles.metaItem}>
          <span className={styles.metaLabel}>Budget</span>
          <span className={styles.metaValue}>
            {campaign.currency} {campaign.budget.toLocaleString()}
          </span>
        </div>
      </div>
    </Link>
  );
}

'use client';

import Image from 'next/image';
import type { Creator } from '@/types';
import styles from './CreatorCard.module.css';

interface CreatorCardProps {
  creator: Creator;
  onApprove: (creatorId: string) => void;
  onReject: (creatorId: string) => void;
  isLoading?: boolean;
}

const STATUS_LABELS: Record<Creator['status'], string> = {
  cm_approved: 'CM Approved',
  client_approved: 'Approved',
  client_rejected: 'Rejected',
  assigned: 'Pending Review',
};

export function CreatorCard({
  creator,
  onApprove,
  onReject,
  isLoading = false,
}: CreatorCardProps) {
  const isPending =
    creator.status === 'cm_approved' || creator.status === 'assigned';
  const isApproved = creator.status === 'client_approved';
  const isRejected = creator.status === 'client_rejected';

  const statusClass = isApproved
    ? styles.statusApproved
    : isRejected
    ? styles.statusRejected
    : styles.statusPending;

  return (
    <div className={styles.card}>
      <div className={styles.profile}>
        {creator.profile_image_url ? (
          <Image
            src={creator.profile_image_url}
            alt={creator.name}
            width={56}
            height={56}
            className={styles.avatar}
          />
        ) : (
          <div className={styles.avatarFallback}>
            {creator.name.charAt(0).toUpperCase()}
          </div>
        )}
        <div className={styles.info}>
          <h4 className={styles.name}>{creator.name}</h4>
          <p className={styles.handle}>
            @{creator.handle} &middot; {creator.platform}
          </p>
        </div>
        <span className={`${styles.status} ${statusClass}`}>
          {STATUS_LABELS[creator.status]}
        </span>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {creator.followers >= 1_000_000
              ? `${(creator.followers / 1_000_000).toFixed(1)}M`
              : creator.followers >= 1_000
              ? `${(creator.followers / 1_000).toFixed(0)}K`
              : creator.followers.toString()}
          </span>
          <span className={styles.statLabel}>Followers</span>
        </div>
        <div className={styles.stat}>
          <span className={styles.statValue}>
            {creator.engagement_rate.toFixed(2)}%
          </span>
          <span className={styles.statLabel}>Engagement</span>
        </div>
        {creator.niche.length > 0 && (
          <div className={styles.niches}>
            {creator.niche.slice(0, 3).map((n) => (
              <span key={n} className={styles.niche}>
                {n}
              </span>
            ))}
          </div>
        )}
      </div>

      {isPending && (
        <div className={styles.actions}>
          <button
            className={styles.rejectBtn}
            onClick={() => onReject(creator.id)}
            disabled={isLoading}
            type="button"
          >
            Reject
          </button>
          <button
            className={styles.approveBtn}
            onClick={() => onApprove(creator.id)}
            disabled={isLoading}
            type="button"
          >
            Approve
          </button>
        </div>
      )}
    </div>
  );
}

'use client';

import Image from 'next/image';
import type { Content } from '@/types';
import styles from './ContentCard.module.css';

interface ContentCardProps {
  content: Content;
  onApprove: (contentId: string) => void;
  onReject: (contentId: string) => void;
  isLoading?: boolean;
}

const STATUS_LABELS: Record<Content['status'], string> = {
  cm_approved: 'CM Approved',
  client_approved: 'Approved',
  client_rejected: 'Rejected',
  scheduled: 'Scheduled',
};

export function ContentCard({
  content,
  onApprove,
  onReject,
  isLoading = false,
}: ContentCardProps) {
  const isPending =
    content.status === 'cm_approved';
  const isApproved = content.status === 'client_approved';
  const isRejected = content.status === 'client_rejected';
  const isScheduled = content.status === 'scheduled';

  const statusClass = isApproved || isScheduled
    ? styles.statusApproved
    : isRejected
    ? styles.statusRejected
    : styles.statusPending;

  return (
    <div className={styles.card}>
      {content.thumbnail_url && (
        <div className={styles.thumbnail}>
          <Image
            src={content.thumbnail_url}
            alt="Content preview"
            fill
            sizes="(max-width: 768px) 100vw, 300px"
            className={styles.thumbnailImg}
          />
        </div>
      )}

      <div className={styles.body}>
        <div className={styles.topRow}>
          <div className={styles.meta}>
            <span className={styles.creator}>{content.creator_name}</span>
            <span className={styles.platform}>{content.platform} &middot; {content.type}</span>
          </div>
          <span className={`${styles.status} ${statusClass}`}>
            {STATUS_LABELS[content.status]}
          </span>
        </div>

        {content.caption && (
          <p className={styles.caption}>{content.caption}</p>
        )}

        {content.media_url && (
          <a
            href={content.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.mediaLink}
          >
            View content
          </a>
        )}

        {isPending && (
          <div className={styles.actions}>
            <button
              className={styles.rejectBtn}
              onClick={() => onReject(content.id)}
              disabled={isLoading}
              type="button"
            >
              Reject
            </button>
            <button
              className={styles.approveBtn}
              onClick={() => onApprove(content.id)}
              disabled={isLoading}
              type="button"
            >
              Approve
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

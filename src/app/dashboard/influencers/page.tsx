'use client';

import { useEffect, useState, useCallback } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { fetchInfluencers, approveInfluencer, rejectInfluencer, fetchSelectedCreators } from '@/services/api/overview.service';
import type { InfluencerItem } from '@/types/overview.types';
import styles from './influencers.module.css';

// ── Utilities ──────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatFollowers(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

// ── Status helpers ─────────────────────────────────────────────────────────

function isPendingReview(status: string) {
  return status === 'accepted' || status === 'cm_approved';
}

function statusLabel(status: string): string {
  if (isPendingReview(status)) return 'Pending Your Review';
  if (status === 'client_approved' || status === 'approved') return 'Approved';
  if (status === 'client_rejected' || status === 'rejected') return 'Rejected';
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

function statusBadgeClass(status: string): string {
  if (isPendingReview(status)) return styles.badgePending;
  if (status === 'client_approved' || status === 'approved') return styles.badgeApproved;
  if (status === 'client_rejected' || status === 'rejected') return styles.badgeRejected;
  return styles.badgeGray;
}

// ── Platform icons ─────────────────────────────────────────────────────────

const InstagramIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.01a8.16 8.16 0 0 0 4.77 1.52V7.1a4.85 4.85 0 0 1-1-.41z" />
  </svg>
);

// ── InfluencerCard ─────────────────────────────────────────────────────────

function InfluencerCard({
  item,
  isSelected,
  onApprove,
  onReject,
  onRemove,
}: {
  item: InfluencerItem;
  isSelected: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onRemove: (id: string) => void;
}) {
  const { profile } = item;
  const [status, setStatus] = useState(item.status);
  const [pending, setPending] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = useCallback(async () => {
    setPending('approve');
    try {
      await onApprove(item.creator_id);
      setStatus('client_approved');
    } catch {
      // keep current status on error
    } finally {
      setPending(null);
    }
  }, [item.creator_id, onApprove]);

  const handleReject = useCallback(async () => {
    setPending('reject');
    try {
      await onReject(item.creator_id);
      onRemove(item.creator_id);
    } catch {
      setPending(null);
    }
  }, [item.creator_id, onReject, onRemove]);

  const showIG = !!(profile.instagram_handle);
  const showTT = !!(profile.tiktok_handle);
  const score = item.recommendation_score;

  return (
    <div className={`${styles.card} ${isSelected ? styles.cardSelected : isPendingReview(status) ? styles.cardPending : ''}`}>
      {/* Selected checkmark badge */}
      {isSelected && (
        <div className={styles.creatorCheckmark}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
      )}

      {/* Score badge */}
      {!isSelected && score != null && (
        <div className={styles.scoreBadge}>
          <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          {score}% match
        </div>
      )}

      {/* Profile header */}
      <div className={styles.profileHeader}>
        {profile.profile_image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.profile_image} alt={profile.name} className={styles.avatar} />
        ) : (
          <div className={isSelected ? styles.avatarInitialsGreen : styles.avatarInitials}>
            {getInitials(profile.name)}
          </div>
        )}
        <div className={styles.profileInfo}>
          <div className={styles.name}>{profile.name}</div>
          {profile.niche && (
            <div className={isSelected ? styles.nichePillGreen : styles.nichePill} title={profile.niche}>
              {profile.niche}
            </div>
          )}
          {profile.location && (
            <div className={styles.location}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {profile.location}
            </div>
          )}
        </div>
      </div>

      {/* AI selection reason — only for non-selected (pending review) */}
      {!isSelected && item.selection_reason && (
        <div className={styles.selectionReason}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 1 }}>
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <p>{item.selection_reason}</p>
        </div>
      )}

      {/* Platform handles */}
      {(showIG || showTT) && (
        <div className={styles.platforms}>
          {showIG && (
            <div className={styles.platformRow}>
              <span className={styles.platformIconWrap} style={{ color: '#e1306c' }}><InstagramIcon /></span>
              <span className={styles.platformHandle}>@{profile.instagram_handle}</span>
              {profile.instagram_followers != null && profile.instagram_followers > 0 && (
                <span className={styles.platformStat}>{formatFollowers(profile.instagram_followers)} followers</span>
              )}
            </div>
          )}
          {showTT && (
            <div className={styles.platformRow}>
              <span className={styles.platformIconWrap} style={{ color: '#010101' }}><TikTokIcon /></span>
              <span className={styles.platformHandle}>@{profile.tiktok_handle}</span>
              {profile.tiktok_followers != null && profile.tiktok_followers > 0 && (
                <span className={styles.platformStat}>{formatFollowers(profile.tiktok_followers)} followers</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Rate + status */}
      <div className={styles.statusRow}>
        {profile.rate && <span className={styles.rateBadge}>{profile.rate}</span>}
        <span className={`${styles.badge} ${isSelected ? styles.badgeApproved : statusBadgeClass(status)}`}>
          {isSelected ? 'Selected' : statusLabel(status)}
        </span>
      </div>

      {/* Accept / Reject — only when pending review and not already selected */}
      {!isSelected && isPendingReview(status) && (
        <div className={styles.actionRow}>
          <button className={styles.btnAccept} onClick={handleApprove} disabled={pending !== null} aria-label="Accept">
            {pending === 'approve' ? <span className={styles.btnSpinner} /> : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            Accept
          </button>
          <button className={styles.btnReject} onClick={handleReject} disabled={pending !== null} aria-label="Reject">
            {pending === 'reject' ? <span className={styles.btnSpinner} /> : (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            Reject
          </button>
        </div>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function InfluencersPage() {
  const [influencers, setInfluencers] = useState<InfluencerItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [infRes, creatorRes] = await Promise.all([
        fetchInfluencers(),
        fetchSelectedCreators().catch(() => ({ creators: [] })),
      ]);
      setInfluencers(infRes.influencers);
      setSelectedIds(new Set(creatorRes.creators.map((c) => c.creator_id)));
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = useCallback(async (creatorId: string) => {
    await approveInfluencer(creatorId);
    await loadData();
  }, [loadData]);

  const handleReject = useCallback(async (creatorId: string) => {
    await rejectInfluencer(creatorId);
    await loadData();
  }, [loadData]);

  const handleRemove = useCallback((_creatorId: string) => {}, []);

  const pendingCount = influencers.filter((i) => isPendingReview(i.status) && !selectedIds.has(i.creator_id)).length;

  return (
    <AuthGuard>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              Influencers
              {!loading && influencers.length > 0 && (
                <span className={styles.totalBadge}>{influencers.length}</span>
              )}
            </h1>
            <p className={styles.pageSub}>
              {pendingCount > 0
                ? `${pendingCount} influencer${pendingCount > 1 ? 's' : ''} awaiting your review`
                : 'Influencers selected by the SocialJet team for your campaign'}
            </p>
          </div>
        </div>

        {loading && (
          <div className={styles.centerState}>
            <span className={styles.spinner} />
            <p>Loading influencers…</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorState}>
            <p>Failed to load influencers. Please refresh.</p>
          </div>
        )}

        {!loading && !error && influencers.length === 0 && (
          <div className={styles.emptyState}>
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <p>No influencers yet. The SocialJet team will share recommendations soon.</p>
          </div>
        )}

        {!loading && !error && influencers.length > 0 && (
          <div className={styles.grid}>
            {influencers.map((inf, idx) => (
              <InfluencerCard
                key={`${inf.assignment_id}-${idx}`}
                item={inf}
                isSelected={selectedIds.has(inf.creator_id)}
                onApprove={handleApprove}
                onReject={handleReject}
                onRemove={handleRemove}
              />
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}

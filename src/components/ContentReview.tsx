'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  fetchLeadId,
  fetchSelectedCreators,
  fetchClientContentLinks,
  reviewContentLink,
} from '@/services/api/overview.service';
import type {
  ClientContentLink,
  ClientContentLinksResponse,
  ClientReviewStatus,
} from '@/types/overview.types';
import styles from './ContentReview.module.css';

// ── Helpers ────────────────────────────────────────────────────────────────

function proxied(url: string): string {
  return `/api/media-proxy?url=${encodeURIComponent(url)}`;
}

function formatDateTime(value: string): string {
  const d = new Date(value);
  if (isNaN(d.getTime())) return value; // e.g. "2026-06-20 13:46" on Safari
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit',
  });
}

function titleCase(s: string): string {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isClientReviewed(status?: string): boolean {
  return status === 'client_approved' || status === 'client_rejected';
}

function statusLabel(status: string): string {
  if (status === 'client_approved') return 'Approved';
  if (status === 'client_rejected') return 'Rejected';
  if (status === 'cm_approved') return 'Pending Your Review';
  return titleCase(status);
}

function statusBadgeClass(status: string): string {
  if (status === 'client_approved') return styles.badgeApproved;
  if (status === 'client_rejected') return styles.badgeRejected;
  if (status === 'cm_approved') return styles.badgePending;
  if (status === 'scheduled') return styles.badgeScheduled;
  return styles.badgeGray;
}

/** Resolve any submitted content URL to something playable inside the CRM. */
function resolveMedia(url: string): { kind: 'video' | 'iframe'; src: string } {
  try {
    const u = new URL(url);
    const host = u.hostname;
    if (/(\.cdninstagram\.com|\.fbcdn\.net)$/.test(host)) return { kind: 'video', src: proxied(url) };
    if (/\.(mp4|webm|mov)(\?|$)/i.test(u.pathname)) return { kind: 'video', src: url };
    if (host.endsWith('instagram.com')) {
      const path = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`;
      return { kind: 'iframe', src: `https://www.instagram.com${path}embed/` };
    }
    if (host.endsWith('tiktok.com')) {
      const m = u.pathname.match(/\/video\/(\d+)/);
      if (m) return { kind: 'iframe', src: `https://www.tiktok.com/embed/v2/${m[1]}` };
    }
    if (host.endsWith('youtube.com') || host === 'youtu.be') {
      const shorts = u.pathname.match(/\/shorts\/([^/?]+)/);
      const id = shorts?.[1] ?? (host === 'youtu.be' ? u.pathname.slice(1) : u.searchParams.get('v'));
      if (id) return { kind: 'iframe', src: `https://www.youtube.com/embed/${id}` };
    }
    if (host === 'drive.google.com') {
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (m) return { kind: 'iframe', src: `https://drive.google.com/file/d/${m[1]}/preview` };
    }
    return { kind: 'iframe', src: url };
  } catch {
    return { kind: 'iframe', src: url };
  }
}

// ── Icons ──────────────────────────────────────────────────────────────────

const InstagramIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.01a8.16 8.16 0 0 0 4.77 1.52V7.1a4.85 4.85 0 0 1-1-.41z" />
  </svg>
);

const YouTubeIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.2 31.2 0 0 0 0 12a31.2 31.2 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.2 31.2 0 0 0 24 12a31.2 31.2 0 0 0-.5-5.8zM9.6 15.6V8.4L15.8 12l-6.2 3.6z" />
  </svg>
);

const PlayIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const CalendarIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const XIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

function PlatformChip({ platform }: { platform: string }) {
  const icon =
    platform === 'instagram' ? <InstagramIcon /> :
    platform === 'tiktok' ? <TikTokIcon /> :
    platform === 'youtube' ? <YouTubeIcon /> :
    <PlayIcon size={12} />;
  return (
    <span className={styles.platformChip} data-platform={platform}>
      {icon}
      {titleCase(platform)}
    </span>
  );
}

// ── Content tile (inline player + details + review actions) ────────────────

function ContentTile({
  link,
  leadId,
  onReviewed,
}: {
  link: ClientContentLink;
  leadId: string;
  onReviewed: (contentId: string, status: ClientReviewStatus) => void;
}) {
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState<ClientReviewStatus | null>(null);
  const [error, setError] = useState(false);
  const media = resolveMedia(link.content_url);
  // The backend stamps client_approved_at on any client review (approve OR
  // reject), so status is the source of truth for which decision was made.
  const clientRejected = link.status === 'client_rejected';
  const clientApproved = link.status === 'client_approved' || (!clientRejected && link.client_approved_at != null);
  const pending = !clientApproved && !clientRejected;

  const submit = async (status: ClientReviewStatus) => {
    setSubmitting(status);
    setError(false);
    try {
      await reviewContentLink(leadId, link.content_id, status, note);
      onReviewed(link.content_id, status);
    } catch {
      setError(true);
    } finally {
      setSubmitting(null);
    }
  };

  return (
    <div className={`${styles.contentTile} ${clientApproved ? styles.tileApproved : clientRejected ? styles.tileRejected : ''}`}>
      {clientApproved && (
        <div className={styles.tileSelectedBadge}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Selected
        </div>
      )}
      {clientRejected && (
        <div className={styles.tileRejectedBadge}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          Rejected
        </div>
      )}

      {/* Inline player — Instagram portrait (9:16) aspect ratio */}
      <div className={styles.contentMedia}>
        {media.kind === 'video' ? (
          <video src={media.src} controls playsInline className={styles.contentPlayer} />
        ) : (
          <iframe
            src={media.src}
            className={styles.contentPlayer}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>

      <div className={styles.contentInfo}>
        <div className={styles.contentInfoTop}>
          <PlatformChip platform={link.platform} />
          {!isClientReviewed(link.status) && (
            <span className={`${styles.badge} ${statusBadgeClass(link.status)}`}>{statusLabel(link.status)}</span>
          )}
        </div>

        {link.caption && <p className={styles.contentCaption}>{link.caption}</p>}

        <div className={`${styles.scheduledRow} ${link.scheduled_at ? '' : styles.scheduledEmpty}`}>
          <CalendarIcon />
          {link.scheduled_at ? (
            <span>Scheduled for <strong>{formatDateTime(link.scheduled_at)}</strong></span>
          ) : (
            <span>Not scheduled yet</span>
          )}
        </div>

        <div className={styles.contentMeta}>
          {link.submitted_at && (
            <div className={styles.contentMetaRow}><span>Submitted</span><strong>{formatDateTime(link.submitted_at)}</strong></div>
          )}
          {link.cm_approved_at && (
            <div className={styles.contentMetaRow}><span>CM Approved</span><strong>{formatDateTime(link.cm_approved_at)}</strong></div>
          )}
          {link.cm_note && (
            <div className={styles.contentMetaRow}><span>CM Note</span><strong>{link.cm_note}</strong></div>
          )}
          {link.client_approved_at && (
            <div className={styles.contentMetaRow}><span>You Approved</span><strong>{formatDateTime(link.client_approved_at)}</strong></div>
          )}
          {link.client_note && (
            <div className={styles.contentMetaRow}><span>Your Note</span><strong>{link.client_note}</strong></div>
          )}
        </div>

        {pending && (
          <div className={styles.reviewBlock}>
            <textarea
              className={styles.reviewNote}
              placeholder="Add a note for the influencer (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
            />
            {error && <p className={styles.reviewError}>Something went wrong. Please try again.</p>}
            <div className={styles.contentActions}>
              <button
                type="button"
                className={styles.contentBtnAccept}
                onClick={() => submit('client_approved')}
                disabled={submitting !== null}
              >
                {submitting === 'client_approved' ? <span className={styles.btnSpinner} /> : <CheckIcon />}
                Accept
              </button>
              <button
                type="button"
                className={styles.contentBtnReject}
                onClick={() => submit('client_rejected')}
                disabled={submitting !== null}
              >
                {submitting === 'client_rejected' ? <span className={styles.btnSpinner} /> : <XIcon />}
                Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Minimal creator identity (from /client/creators) ───────────────────────

interface CreatorSummary {
  creator_id: string;
  name: string;
  avatar: string;
  instagram_handle: string;
  instagram_followers: number | null;
}

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

function CreatorAvatar({ src, name }: { src: string; name: string }) {
  const [broken, setBroken] = useState(false);
  if (!src || broken) {
    return <div className={styles.creatorAvatarInitials}>{getInitials(name)}</div>;
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={name}
      className={styles.creatorAvatar}
      referrerPolicy="no-referrer"
      onError={() => setBroken(true)}
    />
  );
}

// ── Per-creator group: minimal header + their submitted links ──────────────

function CreatorContentGroup({ leadId, creator }: { leadId: string; creator: CreatorSummary }) {
  const [data, setData] = useState<ClientContentLinksResponse | null>(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchClientContentLinks(leadId, creator.creator_id)
      .then((res) => { if (!cancelled) setData(res); })
      .catch(() => { /* no content yet */ });
    return () => { cancelled = true; };
  }, [leadId, creator.creator_id]);

  const handleReviewed = useCallback((contentId: string, status: ClientReviewStatus) => {
    setData((prev) => prev && ({
      ...prev,
      content: prev.content.map((l) => (l.content_id === contentId
        ? {
            ...l,
            status,
            client_approved_at: status === 'client_approved' ? new Date().toISOString() : l.client_approved_at,
          }
        : l)),
    }));
  }, []);

  const links = data?.content ?? [];
  const pendingCount = links.filter((l) => !isClientReviewed(l.status) && l.client_approved_at == null).length;

  return (
    <div className={styles.contentSection}>
      {/* Creator card — click to reveal submitted links */}
      <button
        type="button"
        className={styles.creatorHeader}
        onClick={() => setExpanded((e) => !e)}
        aria-expanded={expanded}
      >
        <CreatorAvatar src={creator.avatar} name={creator.name} />
        <div className={styles.creatorHeaderInfo}>
          <span className={styles.creatorName}>{creator.name}</span>
          {creator.instagram_handle && (
            <span className={styles.creatorHandle}>
              @{creator.instagram_handle}
              {creator.instagram_followers != null && creator.instagram_followers > 0 &&
                ` · ${formatFollowers(creator.instagram_followers)} followers`}
            </span>
          )}
        </div>
        {pendingCount > 0 ? (
          <span className={styles.contentPendingChip}>{pendingCount} to review</span>
        ) : links.length > 0 ? (
          <span className={styles.contentCountChip}>{links.length} link{links.length > 1 ? 's' : ''}</span>
        ) : null}
        <span className={`${styles.chevron} ${expanded ? styles.chevronOpen : ''}`}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>

      {expanded && (
        links.length > 0 ? (
          <div className={styles.tileGrid}>
            {links.map((link) => (
              <ContentTile key={link.content_id} link={link} leadId={leadId} onReviewed={handleReviewed} />
            ))}
          </div>
        ) : (
          <p className={styles.emptyNote}>No content submitted for your review yet.</p>
        )
      )}
    </div>
  );
}

// ── Self-contained board (fetches lead + creators itself) ──────────────────

export function ContentReviewBoard() {
  const [leadId, setLeadId] = useState<string | null>(null);
  const [creators, setCreators] = useState<CreatorSummary[]>([]);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      fetchLeadId().catch(() => null),
      fetchSelectedCreators().catch(() => ({ creators: [], total: 0 })),
    ]).then(([lead, res]) => {
      if (cancelled) return;
      setLeadId(lead);
      setCreators(res.creators.map((c) => ({
        creator_id: c.creator_id,
        name: c.profile.name,
        avatar: c.profile.searchapi_data?.instagram?.profile?.avatar_hd || c.profile.profile_image,
        instagram_handle: c.profile.instagram_handle,
        instagram_followers: c.profile.instagram_followers,
      })));
    });
    return () => { cancelled = true; };
  }, []);

  if (!leadId || !creators.length) return null;

  return (
    <div className={styles.board}>
      {creators.map((c) => (
        <CreatorContentGroup key={c.creator_id} leadId={leadId} creator={c} />
      ))}
    </div>
  );
}

'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import {
  fetchInfluencers,
  approveInfluencer,
  rejectInfluencer,
  fetchSelectedCreators,
} from '@/services/api/overview.service';
import type {
  InfluencerItem,
  InfluencerProfile,
  InstagramPost,
} from '@/types/overview.types';
import styles from './influencers.module.css';

// ── Utilities ──────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name
    .split(' ')
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, '')}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1).replace(/\.0$/, '')}K`;
  return String(n);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Average engagement rate computed from recent posts when the API doesn't provide one. */
function computedEngagementRate(profile: InfluencerProfile): number | null {
  if (profile.instagram_engagement_rate != null) return profile.instagram_engagement_rate;
  const posts = profile.searchapi_data?.instagram?.posts ?? [];
  const followers = profile.instagram_followers;
  if (!posts.length || !followers) return null;
  const withLikes = posts.filter((p) => p.likes != null);
  if (!withLikes.length) return null;
  const total = withLikes.reduce((sum, p) => sum + (p.likes ?? 0) + (p.comments ?? 0), 0);
  return (total / withLikes.length / followers) * 100;
}

function avgFromPosts(posts: InstagramPost[], key: 'likes' | 'comments' | 'views'): number | null {
  const vals = posts.map((p) => p[key]).filter((v): v is number => v != null);
  if (!vals.length) return null;
  return Math.round(vals.reduce((a, b) => a + b, 0) / vals.length);
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

// ── Icons ──────────────────────────────────────────────────────────────────

const InstagramIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
  </svg>
);

const TikTokIcon = ({ size = 16 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.01a8.16 8.16 0 0 0 4.77 1.52V7.1a4.85 4.85 0 0 1-1-.41z" />
  </svg>
);

const VerifiedBadge = () => (
  <svg className={styles.verifiedBadge} width="16" height="16" viewBox="0 0 24 24" fill="#3897f0" aria-label="Verified">
    <path d="M12 2l2.4 2.4 3.3-.5.5 3.3L20.6 9.6 22 12l-1.4 2.4-2.4 2.4-.5 3.3-3.3-.5L12 22l-2.4-2.4-3.3.5-.5-3.3L3.4 14.4 2 12l1.4-2.4 2.4-2.4.5-3.3 3.3.5L12 2z" />
    <path d="M10.5 14.3l-2.2-2.2-1.1 1.1 3.3 3.3 6-6-1.1-1.1-4.9 4.9z" fill="white" />
  </svg>
);

const HeartIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
  </svg>
);

const CommentIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
  </svg>
);

const PlayIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

const CarouselIcon = ({ size = 14 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M19 3H9a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zM5 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-1H5V7z" />
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const SparkleIcon = ({ size = 12 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2l1.9 5.8a2 2 0 0 0 1.3 1.3L21 11l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 20l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 11l5.8-1.9a2 2 0 0 0 1.3-1.3L12 2z" />
  </svg>
);

// ── Match score (out of 15) ────────────────────────────────────────────────

const MATCH_SCORE_MAX = 15;

function MatchScore({ score, compact }: { score: number; compact?: boolean }) {
  const pct = Math.min(100, Math.max(0, (score / MATCH_SCORE_MAX) * 100));
  return (
    <div className={compact ? styles.matchScore : styles.matchScoreLarge}>
      <div className={styles.matchScoreHeader}>
        <span className={styles.matchScoreLabel}><SparkleIcon /> AI Match Score</span>
        <span className={styles.matchScoreValue}>
          {score % 1 === 0 ? score : score.toFixed(1)}<em>/{MATCH_SCORE_MAX}</em>
        </span>
      </div>
      <div className={styles.matchScoreTrack}>
        <div className={styles.matchScoreFill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// ── Instagram CDN media helpers ────────────────────────────────────────────
// IG's CDN rejects requests carrying a referrer and its signed URLs expire,
// so: try direct with no-referrer → retry via our media proxy → fallback.

function proxied(url: string): string {
  return `/api/media-proxy?url=${encodeURIComponent(url)}`;
}

function IgImage({ src, alt, className, fallback }: {
  src: string;
  alt: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [stage, setStage] = useState<0 | 1 | 2>(0);
  useEffect(() => { setStage(0); }, [src]);
  if (!src || stage === 2) return <>{fallback}</>;
  const url = stage === 0 ? src : proxied(src);
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={url}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setStage((s) => (s + 1) as 1 | 2)}
    />
  );
}

// ── Post thumbnail ─────────────────────────────────────────────────────────

function PostThumb({ post, large, onOpen }: { post: InstagramPost; large?: boolean; onOpen: (post: InstagramPost) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(post)}
      className={large ? styles.postThumbLarge : styles.postThumb}
      title={post.caption || 'View post'}
    >
      <IgImage
        src={post.thumbnail ?? ''}
        alt={post.caption ?? 'Instagram post'}
        fallback={<div className={styles.postThumbFallback}><InstagramIcon size={large ? 28 : 20} /></div>}
      />
      <span className={styles.postTypeIcon}>
        {post.type === 'reel' ? <PlayIcon size={large ? 14 : 11} /> : post.type === 'carousel' ? <CarouselIcon size={large ? 15 : 12} /> : null}
      </span>
      <span className={styles.postOverlay}>
        {post.likes != null && <span className={styles.postOverlayStat}><HeartIcon size={large ? 13 : 11} /> {formatNumber(post.likes)}</span>}
        {post.comments != null && <span className={styles.postOverlayStat}><CommentIcon size={large ? 13 : 11} /> {formatNumber(post.comments)}</span>}
        {post.views != null && <span className={styles.postOverlayStat}><PlayIcon size={large ? 13 : 11} /> {formatNumber(post.views)}</span>}
      </span>
    </button>
  );
}

// ── Post lightbox (plays reels / browses carousels in-app) ────────────────

function PostLightbox({ post, onClose }: { post: InstagramPost; onClose: () => void }) {
  const [slide, setSlide] = useState(0);
  const [videoFailed, setVideoFailed] = useState(false);
  const items = post.carousel_items ?? [];
  const isCarousel = post.type === 'carousel' && items.length > 0;
  const isVideo = post.type === 'reel' || post.type === 'video';

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (isCarousel && e.key === 'ArrowRight') setSlide((s) => Math.min(s + 1, items.length - 1));
      if (isCarousel && e.key === 'ArrowLeft') setSlide((s) => Math.max(s - 1, 0));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, isCarousel, items.length]);

  const current = isCarousel ? items[slide] : null;

  return (
    <div className={styles.lightboxBackdrop} onClick={onClose}>
      <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label="Post viewer" onClick={(e) => e.stopPropagation()}>
        <button className={styles.lightboxClose} onClick={onClose} aria-label="Close"><CloseIcon /></button>

        <div className={styles.lightboxMedia}>
          {isVideo && !videoFailed && (
            <video
              key={post.id}
              src={proxied(post.link)}
              poster={post.thumbnail ? proxied(post.thumbnail) : undefined}
              controls
              autoPlay
              playsInline
              className={styles.lightboxVideo}
              onError={() => setVideoFailed(true)}
            />
          )}
          {isVideo && videoFailed && (
            <div className={styles.lightboxFallback}>
              <InstagramIcon size={36} />
              <p>This video is no longer available from Instagram&apos;s CDN.</p>
              <a href={post.permalink} target="_blank" rel="noopener noreferrer">Watch on Instagram</a>
            </div>
          )}

          {isCarousel && current && (
            <>
              {current.type === 'video' ? (
                <video key={current.id} src={proxied(current.link)} controls autoPlay playsInline className={styles.lightboxVideo} />
              ) : (
                <IgImage
                  key={current.id}
                  src={current.link}
                  alt={post.caption ?? 'Carousel item'}
                  className={styles.lightboxImage}
                  fallback={
                    <div className={styles.lightboxFallback}>
                      <InstagramIcon size={36} />
                      <p>This image is no longer available from Instagram&apos;s CDN.</p>
                      <a href={post.permalink} target="_blank" rel="noopener noreferrer">View on Instagram</a>
                    </div>
                  }
                />
              )}
              {slide > 0 && (
                <button className={`${styles.lightboxArrow} ${styles.lightboxArrowLeft}`} onClick={() => setSlide((s) => s - 1)} aria-label="Previous">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
                </button>
              )}
              {slide < items.length - 1 && (
                <button className={`${styles.lightboxArrow} ${styles.lightboxArrowRight}`} onClick={() => setSlide((s) => s + 1)} aria-label="Next">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6" /></svg>
                </button>
              )}
              <span className={styles.lightboxCounter}>{slide + 1} / {items.length}</span>
            </>
          )}

          {!isVideo && !isCarousel && (
            <IgImage
              src={post.link || post.thumbnail || ''}
              alt={post.caption ?? 'Instagram post'}
              className={styles.lightboxImage}
              fallback={
                <div className={styles.lightboxFallback}>
                  <InstagramIcon size={36} />
                  <p>This image is no longer available from Instagram&apos;s CDN.</p>
                  <a href={post.permalink} target="_blank" rel="noopener noreferrer">View on Instagram</a>
                </div>
              }
            />
          )}
        </div>

        <div className={styles.lightboxInfo}>
          {post.caption && <p className={styles.lightboxCaption}>{post.caption}</p>}
          <div className={styles.lightboxStats}>
            {post.likes != null && <span><HeartIcon size={13} /> {formatNumber(post.likes)}</span>}
            {post.comments != null && <span><CommentIcon size={13} /> {formatNumber(post.comments)}</span>}
            {post.views != null && <span><PlayIcon size={13} /> {formatNumber(post.views)}</span>}
            {post.iso_date && <span className={styles.lightboxDate}>{formatDate(post.iso_date)}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Full profile modal ─────────────────────────────────────────────────────

function ProfileModal({ item, onClose, onOpenPost }: { item: InfluencerItem; onClose: () => void; onOpenPost: (post: InstagramPost) => void }) {
  const { profile } = item;
  const ig = profile.searchapi_data?.instagram;
  const igProfile = ig?.profile;
  const posts = ig?.posts ?? [];
  const engagement = computedEngagementRate(profile);
  const avgLikes = profile.instagram_avg_likes ?? avgFromPosts(posts, 'likes');
  const avgComments = profile.instagram_avg_comments ?? avgFromPosts(posts, 'comments');
  const avgViews = avgFromPosts(posts, 'views');
  const avatar = igProfile?.avatar_hd || profile.profile_image;
  const niches = profile.niche ? profile.niche.split(',').map((s) => s.trim()).filter(Boolean) : [];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  return (
    <div className={styles.modalBackdrop} onClick={onClose}>
      <div className={styles.modal} role="dialog" aria-modal="true" aria-label={`${profile.name} profile`} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} aria-label="Close"><CloseIcon /></button>

        {/* Hero */}
        <div className={styles.modalHero}>
          <IgImage
            src={avatar}
            alt={profile.name}
            className={styles.modalAvatar}
            fallback={<div className={styles.modalAvatarInitials}>{getInitials(profile.name)}</div>}
          />
          <div className={styles.modalHeroInfo}>
            <div className={styles.modalName}>
              {profile.name}
              {(profile.is_verified || igProfile?.is_verified) && <VerifiedBadge />}
            </div>
            {igProfile?.name && igProfile.name !== profile.name && (
              <div className={styles.modalIgName}>{igProfile.name}</div>
            )}
            <div className={styles.modalMetaRow}>
              {(igProfile?.category || profile.category) && (
                <span className={styles.categoryPill}>{igProfile?.category || profile.category}</span>
              )}
              {(profile.is_business || igProfile?.is_business) && (
                <span className={styles.businessPill}>Business Account</span>
              )}
              {profile.location && (
                <span className={styles.modalLocation}>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
                  </svg>
                  {profile.location}{profile.country && profile.country !== profile.location ? `, ${profile.country}` : ''}
                </span>
              )}
            </div>
            {niches.length > 0 && (
              <div className={styles.nicheTags}>
                {niches.map((n) => <span key={n} className={styles.nicheTag}>{n}</span>)}
              </div>
            )}
          </div>
          {profile.rate && <div className={styles.modalRate}>{profile.rate}<span>per campaign</span></div>}
        </div>

        {/* Bio */}
        {(igProfile?.bio || profile.bio) && (
          <p className={styles.modalBio}>{igProfile?.bio || profile.bio}</p>
        )}

        {/* AI match score + selection reason */}
        {item.recommendation_score != null && <MatchScore score={item.recommendation_score} />}
        {item.selection_reason && (
          <div className={styles.selectionReason}>
            <span className={styles.selectionReasonLabel}>Why this creator</span>
            <p>{item.selection_reason}</p>
          </div>
        )}

        {/* Stats */}
        <div className={styles.modalStatsGrid}>
          {profile.instagram_followers != null && (
            <div className={styles.statCell}><strong>{formatNumber(profile.instagram_followers)}</strong><span>Followers</span></div>
          )}
          {profile.instagram_following != null && (
            <div className={styles.statCell}><strong>{formatNumber(profile.instagram_following)}</strong><span>Following</span></div>
          )}
          {profile.instagram_posts != null && (
            <div className={styles.statCell}><strong>{formatNumber(profile.instagram_posts)}</strong><span>Posts</span></div>
          )}
          {engagement != null && (
            <div className={styles.statCell}><strong>{engagement.toFixed(2)}%</strong><span>Engagement</span></div>
          )}
          {avgLikes != null && (
            <div className={styles.statCell}><strong>{formatNumber(avgLikes)}</strong><span>Avg Likes</span></div>
          )}
          {avgComments != null && (
            <div className={styles.statCell}><strong>{formatNumber(avgComments)}</strong><span>Avg Comments</span></div>
          )}
          {avgViews != null && (
            <div className={styles.statCell}><strong>{formatNumber(avgViews)}</strong><span>Avg Reel Views</span></div>
          )}
          {profile.tiktok_followers != null && (
            <div className={styles.statCell}><strong>{formatNumber(profile.tiktok_followers)}</strong><span>TikTok Followers</span></div>
          )}
          {profile.youtube_subscribers != null && (
            <div className={styles.statCell}><strong>{formatNumber(profile.youtube_subscribers)}</strong><span>YouTube Subs</span></div>
          )}
        </div>

        {/* Social links */}
        <div className={styles.modalSocials}>
          {profile.instagram_handle && (
            <a
              href={profile.instagram_url || `https://www.instagram.com/${profile.instagram_handle}`}
              target="_blank" rel="noopener noreferrer" className={styles.socialLink} style={{ color: '#e1306c' }}
            >
              <InstagramIcon /> @{profile.instagram_handle}
            </a>
          )}
          {profile.tiktok_handle && (
            <a
              href={profile.tiktok_url || `https://www.tiktok.com/@${profile.tiktok_handle}`}
              target="_blank" rel="noopener noreferrer" className={styles.socialLink} style={{ color: '#010101' }}
            >
              <TikTokIcon /> @{profile.tiktok_handle}
            </a>
          )}
        </div>

        {/* Recent posts */}
        {posts.length > 0 && (
          <div className={styles.modalPostsSection}>
            <h3 className={styles.modalSectionTitle}>Recent Posts</h3>
            <div className={styles.modalPostsGrid}>
              {posts.map((p) => (
                <div key={p.id} className={styles.modalPostCard}>
                  <PostThumb post={p} large onOpen={onOpenPost} />
                  <div className={styles.modalPostMeta}>
                    {p.caption && <p className={styles.modalPostCaption}>{p.caption}</p>}
                    <div className={styles.modalPostStats}>
                      {p.likes != null && <span><HeartIcon /> {formatNumber(p.likes)}</span>}
                      {p.comments != null && <span><CommentIcon /> {formatNumber(p.comments)}</span>}
                      {p.views != null && <span><PlayIcon /> {formatNumber(p.views)}</span>}
                      {p.carousel_items && <span><CarouselIcon size={12} /> {p.carousel_items.length}</span>}
                    </div>
                    {p.iso_date && <span className={styles.modalPostDate}>{formatDate(p.iso_date)}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

// ── InfluencerCard ─────────────────────────────────────────────────────────

function InfluencerCard({
  item,
  isSelected,
  onApprove,
  onReject,
  onRemove,
  onOpen,
}: {
  item: InfluencerItem;
  isSelected: boolean;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string) => Promise<void>;
  onRemove: (id: string) => void;
  onOpen: (item: InfluencerItem) => void;
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

  const ig = profile.searchapi_data?.instagram;
  const igProfile = ig?.profile;
  const showIG = !!profile.instagram_handle;
  const showTT = !!profile.tiktok_handle;
  const score = item.recommendation_score;
  const isVerified = profile.is_verified || igProfile?.is_verified;
  const engagement = computedEngagementRate(profile);
  const avatar = igProfile?.avatar_hd || profile.profile_image;
  const bio = igProfile?.bio || profile.bio;
  const niches = profile.niche ? profile.niche.split(',').map((s) => s.trim()).filter(Boolean) : [];

  return (
    <div className={`${styles.card} ${isSelected ? styles.cardSelected : isPendingReview(status) ? styles.cardPending : ''}`}>
      {/* Selected badge */}
      {isSelected && (
        <div className={styles.creatorCheckmark}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Selected
        </div>
      )}

      {/* Profile header */}
      <div className={styles.profileHeader}>
        <div className={isSelected ? styles.avatarRingGreen : styles.avatarRing}>
          <IgImage
            src={avatar}
            alt={profile.name}
            className={styles.avatar}
            fallback={
              <div className={isSelected ? styles.avatarInitialsGreen : styles.avatarInitials}>
                {getInitials(profile.name)}
              </div>
            }
          />
        </div>
        <div className={styles.profileInfo}>
          <div className={styles.name}>
            {profile.name}
            {isVerified && <VerifiedBadge />}
          </div>
          {(igProfile?.category || profile.category) && (
            <div className={styles.categoryLabel}>{igProfile?.category || profile.category}</div>
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

      {/* Niche tags */}
      {niches.length > 0 && (
        <div className={styles.nicheTags}>
          {niches.slice(0, 3).map((n) => (
            <span key={n} className={isSelected ? styles.nicheTagGreen : styles.nicheTag}>{n}</span>
          ))}
          {niches.length > 3 && <span className={styles.nicheTagMore}>+{niches.length - 3}</span>}
        </div>
      )}

      {/* Bio */}
      {bio && <p className={styles.bio}>{bio}</p>}

      {/* AI match score */}
      {score != null && <MatchScore score={score} compact />}

      {/* AI selection reason */}
      {item.selection_reason && (
        <div className={styles.selectionReason}>
          <span className={styles.selectionReasonLabel}>Why this creator</span>
          <p>{item.selection_reason}</p>
        </div>
      )}

      {/* Stats band */}
      {(profile.instagram_followers != null || engagement != null) && (
        <div className={styles.statsBand}>
          {profile.instagram_followers != null && (
            <div className={styles.statItem}><strong>{formatNumber(profile.instagram_followers)}</strong><span>Followers</span></div>
          )}
          {profile.instagram_posts != null && (
            <div className={styles.statItem}><strong>{formatNumber(profile.instagram_posts)}</strong><span>Posts</span></div>
          )}
          {engagement != null && (
            <div className={styles.statItem}><strong>{engagement.toFixed(1)}%</strong><span>Engagement</span></div>
          )}
        </div>
      )}

      {/* Platform handles */}
      {(showIG || showTT) && (
        <div className={styles.platforms}>
          {showIG && (
            <a
              href={profile.instagram_url || `https://www.instagram.com/${profile.instagram_handle}`}
              target="_blank" rel="noopener noreferrer" className={styles.platformRow}
            >
              <span className={styles.platformIconWrap} style={{ color: '#e1306c' }}><InstagramIcon /></span>
              <span className={styles.platformHandle}>@{profile.instagram_handle}</span>
              {profile.instagram_followers != null && profile.instagram_followers > 0 && (
                <span className={styles.platformStat}>{formatNumber(profile.instagram_followers)} followers</span>
              )}
            </a>
          )}
          {showTT && (
            <a
              href={profile.tiktok_url || `https://www.tiktok.com/@${profile.tiktok_handle}`}
              target="_blank" rel="noopener noreferrer" className={styles.platformRow}
            >
              <span className={styles.platformIconWrap} style={{ color: '#010101' }}><TikTokIcon /></span>
              <span className={styles.platformHandle}>@{profile.tiktok_handle}</span>
              {profile.tiktok_followers != null && profile.tiktok_followers > 0 && (
                <span className={styles.platformStat}>{formatNumber(profile.tiktok_followers)} followers</span>
              )}
            </a>
          )}
        </div>
      )}

      {/* Rate + status */}
      <div className={styles.statusRow}>
        {profile.rate && <span className={styles.rateBadge}>{profile.rate}</span>}
        <span className={`${styles.badge} ${isSelected ? styles.badgeApproved : statusBadgeClass(status)}`}>
          {isSelected ? 'Approved' : statusLabel(status)}
        </span>
      </div>

      {/* View full profile */}
      <button className={styles.btnViewProfile} onClick={() => onOpen(item)}>
        View Full Profile
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </button>

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
  const [selectedCreators, setSelectedCreators] = useState<Map<string, InfluencerItem>>(new Map());
  const [openItem, setOpenItem] = useState<InfluencerItem | null>(null);
  const [openPost, setOpenPost] = useState<InstagramPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [infRes, creatorRes] = await Promise.all([
        fetchInfluencers(),
        fetchSelectedCreators().catch(() => ({ creators: [], total: 0 })),
      ]);
      setInfluencers(infRes.influencers);
      setSelectedCreators(new Map(
        creatorRes.creators.map((c) => [
          c.creator_id,
          {
            ...c,
            recommendation_score: c.recommendation_score ?? null,
            selection_reason: c.selection_reason ?? '',
          } as InfluencerItem,
        ]),
      ));
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

  // Merge: the /client/creators payload carries the rich profile (searchapi_data,
  // verified flags) — prefer it for selected creators, and include any selected
  // creator missing from the influencers list.
  const displayItems = useMemo(() => {
    const merged = influencers.map((inf) => {
      const rich = selectedCreators.get(inf.creator_id);
      if (!rich) return inf;
      return {
        ...inf,
        profile: rich.profile,
        recommendation_score: inf.recommendation_score ?? rich.recommendation_score,
        selection_reason: inf.selection_reason || rich.selection_reason,
      };
    });
    const shownIds = new Set(merged.map((i) => i.creator_id));
    for (const [id, item] of selectedCreators) {
      if (!shownIds.has(id)) merged.push(item);
    }
    return merged;
  }, [influencers, selectedCreators]);

  const pendingCount = displayItems.filter((i) => isPendingReview(i.status) && !selectedCreators.has(i.creator_id)).length;

  return (
    <AuthGuard>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>
              Influencers
              {!loading && displayItems.length > 0 && (
                <span className={styles.totalBadge}>{displayItems.length}</span>
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

        {!loading && !error && displayItems.length === 0 && (
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

        {!loading && !error && displayItems.length > 0 && (
          <div className={styles.grid}>
            {displayItems.map((inf, idx) => (
              <InfluencerCard
                key={`${inf.assignment_id}-${idx}`}
                item={inf}
                isSelected={selectedCreators.has(inf.creator_id)}
                onApprove={handleApprove}
                onReject={handleReject}
                onRemove={handleRemove}
                onOpen={setOpenItem}
              />
            ))}
          </div>
        )}

        {openItem && <ProfileModal item={openItem} onClose={() => setOpenItem(null)} onOpenPost={setOpenPost} />}
        {openPost && <PostLightbox post={openPost} onClose={() => setOpenPost(null)} />}
      </main>
    </AuthGuard>
  );
}

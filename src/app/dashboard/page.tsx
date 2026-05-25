'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { fetchOverview } from '@/services/api/overview.service';
import type { OverviewResponse } from '@/types/overview.types';
import styles from './dashboard.module.css';

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-SG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    closed_won: styles.badgeGreen,
    done: styles.badgeGreen,
    approved: styles.badgeGreen,
    pending: styles.badgeYellow,
    scheduled: styles.badgeBlue,
    discovery: styles.badgeBlue,
    rejected: styles.badgeRed,
  };
  return `${styles.badge} ${map[status] ?? styles.badgeGray}`;
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function DashboardPage() {
  const [data, setData] = useState<OverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchOverview()
      .then(setData)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard>
      <Navbar />
      <main className={styles.page}>
        {loading && (
          <div className={styles.centerState}>
            <span className={styles.spinner} />
            <p>Loading your dashboard…</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorState}>
            <p>Failed to load dashboard. Please refresh.</p>
          </div>
        )}

        {!loading && !error && data && (
          <>
            {/* ── Welcome Header ── */}
            <div className={styles.welcomeRow}>
              <div>
                <h1 className={styles.welcomeTitle}>
                  Welcome back, {data.lead.name}
                </h1>
                <p className={styles.welcomeSub}>{data.lead.company}</p>
              </div>
              <div className={styles.welcomeMeta}>
                <span className={statusBadge(data.lead.status)}>
                  {statusLabel(data.lead.status)}
                </span>
                <span className={styles.welcomeSource}>via {data.lead.source}</span>
              </div>
            </div>

            {/* ── Stats Row ── */}
            <div className={styles.statsRow}>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <MeetingIcon />
                </div>
                <div>
                  <div className={styles.statNum}>{data.total_meetings}</div>
                  <div className={styles.statLabel}>Meetings</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <DocIcon />
                </div>
                <div>
                  <div className={styles.statNum}>{data.total_proposals}</div>
                  <div className={styles.statLabel}>Proposals</div>
                </div>
              </div>
              <div className={styles.statCard}>
                <div className={styles.statIcon}>
                  <CampaignIcon />
                </div>
                <div>
                  <div className={styles.statNum}>{data.total_campaigns}</div>
                  <div className={styles.statLabel}>Campaigns</div>
                </div>
              </div>
            </div>

            <div className={styles.grid}>
              {/* ── Client Info ── */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <PersonIcon />
                  <h2 className={styles.cardTitle}>Your Details</h2>
                </div>
                <div className={styles.infoList}>
                  <InfoRow label="Name" value={data.lead.name} />
                  <InfoRow label="Company" value={data.lead.company} />
                  <InfoRow label="Email" value={data.lead.email} />
                  <InfoRow label="Phone" value={data.lead.phone} />
                  <InfoRow label="Member Since" value={formatDate(data.lead.created_at)} />
                </div>
              </div>

              {/* ── Meetings ── */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <MeetingIcon />
                  <h2 className={styles.cardTitle}>Meetings</h2>
                </div>
                {data.meetings.length === 0 ? (
                  <p className={styles.emptyNote}>No meetings yet.</p>
                ) : (
                  <div className={styles.itemList}>
                    {data.meetings.map((m) => (
                      <div key={m.meeting_id} className={styles.meetingItem}>
                        <div className={styles.meetingTop}>
                          <span className={styles.meetingName}>{m.event_name}</span>
                          <span className={statusBadge(m.meeting_status)}>
                            {statusLabel(m.meeting_status)}
                          </span>
                        </div>
                        <div className={styles.meetingMeta}>
                          <span className={statusBadge(m.meeting_type)}>
                            {statusLabel(m.meeting_type)}
                          </span>
                          <span className={styles.metaText}>
                            <CalIcon />
                            {formatDateTime(m.scheduled_at)}
                          </span>
                          {m.has_transcript && (
                            <span className={styles.transcriptBadge}>Transcript Available</span>
                          )}
                        </div>
                        {m.zoom_join_url && (
                          <a
                            href={m.zoom_join_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={styles.zoomLink}
                          >
                            <ZoomIcon /> Join Zoom
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Proposals ── */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <DocIcon />
                  <h2 className={styles.cardTitle}>Proposals</h2>
                  {data.proposals.length > 0 && (
                    <Link href="/dashboard/proposals" className={styles.viewAllLink}>
                      View Documents →
                    </Link>
                  )}
                </div>
                {data.proposals.length === 0 ? (
                  <p className={styles.emptyNote}>No proposals yet.</p>
                ) : (
                  <div className={styles.itemList}>
                    {data.proposals.map((p) => (
                      <div key={p.call_id} className={styles.proposalItem}>
                        <div className={styles.proposalTop}>
                          <span className={styles.proposalId}>
                            #{p.call_id.slice(0, 8).toUpperCase()}
                          </span>
                          <span className={statusBadge(p.review_status)}>
                            {statusLabel(p.review_status)}
                          </span>
                        </div>
                        <div className={styles.proposalMeta}>
                          <span className={styles.metaText}>
                            <CalIcon /> Created {formatDate(p.created_at)}
                          </span>
                          {p.email_sent ? (
                            <span className={styles.sentBadge}>Email Sent</span>
                          ) : (
                            <span className={styles.notSentBadge}>Email Pending</span>
                          )}
                        </div>
                        <Link href="/dashboard/proposals" className={styles.docLink}>
                          <DocIcon /> Open Full Proposal →
                        </Link>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Campaigns ── */}
              <div className={styles.card}>
                <div className={styles.cardHeader}>
                  <CampaignIcon />
                  <h2 className={styles.cardTitle}>Campaigns</h2>
                  {data.campaigns.length > 0 && (
                    <Link href="/campaigns" className={styles.viewAllLink}>
                      View All →
                    </Link>
                  )}
                </div>
                {data.campaigns.length === 0 ? (
                  <div className={styles.noCampaigns}>
                    <p className={styles.emptyNote}>No campaigns launched yet.</p>
                    <p className={styles.emptyHint}>
                      Your campaigns will appear here once they are set up by the SocialJet team.
                    </p>
                  </div>
                ) : (
                  <div className={styles.itemList}>
                    {data.campaigns.map((c) => (
                      <Link
                        key={c.campaign_id}
                        href={`/campaigns/${c.campaign_id}`}
                        className={styles.campaignItem}
                      >
                        <span className={styles.campaignName}>{c.name}</span>
                        <span className={statusBadge(c.status)}>{statusLabel(c.status)}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </main>
    </AuthGuard>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.infoRow}>
      <span className={styles.infoLabel}>{label}</span>
      <span className={styles.infoValue}>{value || '—'}</span>
    </div>
  );
}

// ── Icons ──
function PersonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
function MeetingIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}
function DocIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}
function CampaignIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
function CalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  );
}
function ZoomIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="23 7 16 12 23 17 23 7" />
      <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
    </svg>
  );
}

'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { fetchProposals } from '@/services/api/overview.service';
import type { ProposalItem, ProposalContent } from '@/types/overview.types';
import styles from './proposals.module.css';

// ── Utilities ──────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString('en-SG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch {
    return iso;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serialize(val: any): string {
  if (!val) return '';
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (Array.isArray(val)) return val.map(serialize).filter(Boolean).join('\n');
  if (typeof val === 'object') {
    return Object.entries(val)
      .filter(([, v]) => v !== null && v !== undefined && v !== '')
      .map(([k, v]) => `${k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}: ${serialize(v)}`)
      .join('\n');
  }
  return String(val);
}

function fieldVal(p: ProposalContent, ...keys: string[]): string {
  for (const k of keys) {
    if (p[k] !== undefined && p[k] !== null && p[k] !== '') return serialize(p[k]);
  }
  return '';
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizePricingTiers(raw: any): Array<Record<string, any>> {
  if (!raw) return [];
  if (typeof raw === 'string') {
    try { return normalizePricingTiers(JSON.parse(raw)); } catch { return [{ package_name: 'Package', description: raw }]; }
  }
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'object') {
    const vals = Object.values(raw);
    if (vals.length > 0 && typeof vals[0] === 'object' && !Array.isArray(vals[0])) return vals as Array<Record<string, any>>;
    return [raw];
  }
  return [];
}

// ── Embedded CSS (captured in PDF) ────────────────────────────────────────

const PROPOSAL_CSS = `
/* ─── Root shell ─── */
.proposal-root { display: flex; flex-direction: column; gap: 16px; margin-bottom: 40px; }

/* ─── Document card ─── */
.proposal-document { background: white; border-radius: 24px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07); }

/* ─── Hero Header ─── */
.proposal-hero { background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #6c63ff 100%); padding: 40px 40px 32px; position: relative; overflow: hidden; }
.proposal-hero::before { content: ''; position: absolute; top: -60px; right: -60px; width: 240px; height: 240px; border-radius: 50%; background: rgba(255,255,255,0.05); }
.proposal-hero::after { content: ''; position: absolute; bottom: -40px; left: 30%; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.04); }

.proposal-hero-meta { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.proposal-hero-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); }
.proposal-hero-divider { color: rgba(255,255,255,0.25); font-size: 13px; }
.proposal-hero-date, .proposal-hero-no { font-size: 11px; color: rgba(255,255,255,0.5); }

.proposal-hero-title { font-size: 2rem; font-weight: 800; color: white; margin: 0 0 12px 0; line-height: 1.15; max-width: 720px; position: relative; z-index: 1; }
.proposal-hero-sub { font-size: 13px; color: rgba(255,255,255,0.65); margin: 0 0 24px 0; max-width: 600px; line-height: 1.6; position: relative; z-index: 1; }

.proposal-hero-pills { display: flex; flex-wrap: wrap; gap: 12px; position: relative; z-index: 1; }
.proposal-hero-pill { display: inline-flex; align-items: center; gap: 8px; background: rgba(255,255,255,0.12); border: 1px solid rgba(255,255,255,0.2); border-radius: 9999px; padding: 6px 16px; font-size: 11px; font-weight: 600; color: white; backdrop-filter: blur(4px); }

/* ─── Body ─── */
.proposal-body { padding: 40px; display: flex; flex-direction: column; gap: 40px; }
.proposal-section { display: flex; flex-direction: column; gap: 20px; }
.proposal-section-title { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #6c63ff; margin: 0; padding-bottom: 12px; border-bottom: 2px solid #ede9fe; }
.proposal-body-text { font-size: 13px; color: #475569; line-height: 1.75; margin: 0; white-space: pre-line; }

/* ─── Strategy card ─── */
.proposal-strategy-card { background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-left: 4px solid #6c63ff; border-radius: 0 12px 12px 0; padding: 20px 24px; }

/* ─── Pricing ─── */
.proposal-pricing-note { font-size: 11px; color: #94a3b8; margin: 0; font-style: italic; }
.proposal-pricing-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 20px; }
.proposal-pricing-card { border: 1px solid #e2e8f0; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 8px; background: #fafafa; position: relative; }
.proposal-pricing-card-highlighted { border: 2px solid #6c63ff; border-radius: 16px; padding: 24px; display: flex; flex-direction: column; gap: 8px; background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); position: relative; box-shadow: 0 4px 20px rgba(108,99,255,0.12); }
.proposal-recommended-badge { position: absolute; top: -12px; left: 50%; transform: translateX(-50%); background: #6c63ff; color: white; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.08em; padding: 3px 12px; border-radius: 9999px; white-space: nowrap; }
.proposal-pricing-name { font-size: 15px; font-weight: 800; color: #1e293b; }
.proposal-pricing-price { font-size: 1.75rem; font-weight: 800; color: #6c63ff; line-height: 1; margin: 4px 0; }
.proposal-pricing-range { font-size: 11px; color: #94a3b8; font-weight: 600; }
.proposal-pricing-desc { font-size: 11px; color: #475569; line-height: 1.5; margin: 8px 0 0 0; }

.proposal-ad-budget-banner { background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px 20px; font-size: 11px; color: #92400e; line-height: 1.6; }

/* ─── Timeline ─── */
.proposal-timeline { display: flex; flex-direction: column; }
.proposal-timeline-step { display: flex; gap: 20px; }
.proposal-timeline-left { display: flex; flex-direction: column; align-items: center; flex-shrink: 0; }
.proposal-timeline-dot { width: 32px; height: 32px; border-radius: 50%; background: #6c63ff; color: white; font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
.proposal-timeline-line { width: 2px; flex: 1; min-height: 20px; background: linear-gradient(to bottom, #6c63ff, #ede9fe); margin: 4px 0; }
.proposal-timeline-content { padding-bottom: 24px; flex: 1; }
.proposal-timeline-week { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6c63ff; margin-bottom: 4px; }
.proposal-timeline-milestone { font-size: 15px; font-weight: 700; color: #1e293b; }
.proposal-timeline-deliverable { font-size: 11px; font-weight: 600; color: #475569; margin: 4px 0; }
.proposal-timeline-desc { font-size: 13px; color: #94a3b8; line-height: 1.55; margin: 0; }

/* ─── Metrics Table ─── */
.proposal-metrics-table { border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; }
.proposal-metrics-header { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 16px; padding: 12px 20px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.06em; color: #94a3b8; }
.proposal-metric-row { display: grid; grid-template-columns: 1fr 1fr 2fr; gap: 16px; padding: 16px 20px; border-bottom: 1px solid #f1f5f9; align-items: start; }
.proposal-metric-row:last-child { border-bottom: none; }
.proposal-metric-name { font-size: 13px; font-weight: 700; color: #1e293b; }
.proposal-metric-target { font-size: 13px; font-weight: 600; color: #6c63ff; }
.proposal-metric-desc { font-size: 11px; color: #94a3b8; line-height: 1.5; }

/* ─── Inclusions / Value Adds ─── */
.proposal-inclusions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
.proposal-check-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px; }
.proposal-check-item { display: flex; align-items: flex-start; gap: 12px; font-size: 13px; color: #475569; line-height: 1.5; }
.proposal-check-dot { width: 20px; height: 20px; border-radius: 50%; background: #d1fae5; color: #059669; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
.proposal-check-dot-purple { width: 20px; height: 20px; border-radius: 50%; background: #ede9fe; color: #6c63ff; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }

/* ─── Offer card ─── */
.proposal-offer-card { background: linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%); border: 1px solid #fde68a; border-radius: 16px; padding: 24px; }
.proposal-offer-type { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #d97706; margin-bottom: 8px; }
.proposal-offer-desc { font-size: 13px; color: #92400e; line-height: 1.6; margin: 0 0 12px 0; }
.proposal-offer-cta { font-size: 11px; font-weight: 700; color: #d97706; margin: 0; font-style: italic; }

/* ─── Next Steps ─── */
.proposal-next-steps-card { background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border: 1px solid #bbf7d0; border-radius: 16px; padding: 24px; }
.proposal-next-steps-card .proposal-body-text { color: #166534; }

/* ─── Sub-section label ─── */
.proposal-sub-label { font-size: 12px; font-weight: 700; color: #1e293b; margin: 0 0 4px 0; }
.proposal-sub-text { font-size: 13px; color: #475569; line-height: 1.75; margin: 0; white-space: pre-line; }
.proposal-inline-row { font-size: 13px; color: #475569; line-height: 1.6; margin: 0; }
.proposal-inline-key { font-weight: 700; color: #1e293b; }

/* ─── Footer ─── */
.proposal-footer { border-top: 1px solid #e2e8f0; padding: 20px 40px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
.proposal-footer-brand { font-size: 13px; font-weight: 800; color: #6c63ff; letter-spacing: 0.04em; }
.proposal-footer-note { font-size: 11px; color: #94a3b8; }

/* ─── Print ─── */
@media print { body { padding: 0 !important; } @page { margin: 10mm; } }
`;

// ── Icons ─────────────────────────────────────────────────────────────────

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const DocIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </svg>
);

const CheckSvg = ({ color = '#059669' }: { color?: string }) => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ── ProposalDocument ──────────────────────────────────────────────────────

function ProposalDocument({
  item,
  docRef,
}: {
  item: ProposalItem;
  docRef: React.RefObject<HTMLDivElement | null>;
}) {
  const p: ProposalContent = item.proposal;
  const date = formatDate(item.created_at);

  const companyName = item.lead_company || fieldVal(p, 'brand_name', 'company_name');
  const budget = fieldVal(p, 'budget');
  const timeline = fieldVal(p, 'timeline');
  const clientNeeds = fieldVal(p, 'client_needs', 'call_summary');
  const strategy = fieldVal(p, 'strategy');
  const nextSteps = fieldVal(p, 'next_steps');
  const marketingMessage = fieldVal(p, 'marketing_message');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sa: any = p.situation_analysis;
  const currentSituation = (sa && serialize(sa.current_situation)) || fieldVal(p, 'current_situation');
  const objectives = (sa && serialize(sa.objectives)) || fieldVal(p, 'objectives', 'campaign_objective');
  const keyChallenges = (sa && serialize(sa.key_challenges)) || fieldVal(p, 'key_challenges');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const taRaw: any = p.target_audience;
  const taIsObject = taRaw && typeof taRaw === 'object' && !Array.isArray(taRaw);

  const pricingTiers = normalizePricingTiers(p.pricing_tiers);
  const pricingNote = fieldVal(p, 'pricing_note', 'pricing_tiers_note');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const adBudget: any = p.recommended_ad_budget;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const packageInclusions: any[] = Array.isArray(p.package_inclusions)
    ? p.package_inclusions
    : typeof p.package_inclusions === 'string'
    ? p.package_inclusions.split(/\n/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const valueAdds: any[] = Array.isArray(p.value_adds)
    ? p.value_adds
    : typeof p.value_adds === 'string'
    ? p.value_adds.split(/\n/).map((s: string) => s.trim()).filter(Boolean)
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const timelineMilestones: any[] = Array.isArray(p.timeline_milestones)
    ? p.timeline_milestones
    : Array.isArray(p.campaign_timeline)
    ? p.campaign_timeline
    : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const metrics: any[] = Array.isArray(p.key_success_metrics) ? p.key_success_metrics : [];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offerDetails: any = p.offer_details;

  return (
    <div className="proposal-root" ref={docRef}>
      {/* Embedded stylesheet — captured in PDF via outerHTML */}
      <style dangerouslySetInnerHTML={{ __html: PROPOSAL_CSS }} />

      <div className="proposal-document">
        {/* ══ HERO ══ */}
        <div className="proposal-hero">
          <div className="proposal-hero-meta">
            <span className="proposal-hero-label">SocialJet</span>
            <span className="proposal-hero-divider">·</span>
            <span className="proposal-hero-label">Influencer Marketing Agency</span>
            <span className="proposal-hero-divider">·</span>
            <span className="proposal-hero-date">{date}</span>
          </div>

          <h1 className="proposal-hero-title">
            SocialJet <span style={{ fontWeight: 400, opacity: 0.75 }}>×</span> {companyName}
          </h1>

          {clientNeeds && (
            <p className="proposal-hero-sub">{clientNeeds}</p>
          )}

          <div className="proposal-hero-pills">
            {budget && (
              <span className="proposal-hero-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                {budget}
              </span>
            )}
            {timeline && (
              <span className="proposal-hero-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                {timeline}
              </span>
            )}
            {item.call_summary && !clientNeeds && (
              <span className="proposal-hero-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                Influencer Marketing Proposal
              </span>
            )}
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div className="proposal-body">

          {/* Executive Summary */}
          {item.call_summary && (
            <section className="proposal-section">
              <h2 className="proposal-section-title">Executive Summary</h2>
              <p className="proposal-body-text">{item.call_summary}</p>
            </section>
          )}

          {/* Situation Analysis */}
          {(currentSituation || objectives || keyChallenges || taRaw) && (
            <section className="proposal-section">
              <h2 className="proposal-section-title">Situation Analysis</h2>
              {currentSituation && (
                <div>
                  <p className="proposal-sub-label">Current Situation</p>
                  <p className="proposal-sub-text">{currentSituation}</p>
                </div>
              )}
              {objectives && (
                <div>
                  <p className="proposal-sub-label">Objectives</p>
                  <p className="proposal-sub-text">{objectives}</p>
                </div>
              )}
              {keyChallenges && (
                <div>
                  <p className="proposal-sub-label">Key Challenges</p>
                  <p className="proposal-sub-text">{keyChallenges}</p>
                </div>
              )}
              {taRaw && (
                <div>
                  <p className="proposal-sub-label">Target Audience</p>
                  {taIsObject ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {Object.entries(taRaw).map(([k, v]) => (
                        <p key={k} className="proposal-inline-row">
                          <span className="proposal-inline-key">
                            {k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}:{' '}
                          </span>
                          {serialize(v)}
                        </p>
                      ))}
                    </div>
                  ) : (
                    <p className="proposal-sub-text">{serialize(taRaw)}</p>
                  )}
                </div>
              )}
            </section>
          )}

          {/* Strategy */}
          {strategy && (
            <section className="proposal-section">
              <h2 className="proposal-section-title">Strategy</h2>
              <div className="proposal-strategy-card">
                <p className="proposal-body-text" style={{ color: '#3730a3' }}>{strategy}</p>
              </div>
            </section>
          )}

          {/* Marketing Message */}
          {marketingMessage && (
            <section className="proposal-section">
              <h2 className="proposal-section-title">Marketing Message</h2>
              <div className="proposal-strategy-card">
                <p className="proposal-body-text" style={{ fontStyle: 'italic', color: '#3730a3' }}>{marketingMessage}</p>
              </div>
            </section>
          )}

          {/* Investment Packages */}
          {pricingTiers.length > 0 && (
            <section className="proposal-section">
              <h2 className="proposal-section-title">Investment Packages</h2>
              {pricingNote && <p className="proposal-pricing-note">{pricingNote}</p>}
              <div className="proposal-pricing-grid">
                {pricingTiers.map((tier, idx) => {
                  const name = tier.package_name || tier.name || `Package ${idx + 1}`;
                  const price = tier.price || tier.cost || '';
                  const desc = tier.description || tier.details || '';
                  const range = tier.influencer_count_range || tier.influencer_count || '';
                  const isHighlighted = idx === 1;
                  return (
                    <div key={idx} className={isHighlighted ? 'proposal-pricing-card-highlighted' : 'proposal-pricing-card'}>
                      {isHighlighted && <span className="proposal-recommended-badge">Recommended</span>}
                      <div className="proposal-pricing-name">{serialize(name)}</div>
                      {price && <div className="proposal-pricing-price">{serialize(price)}</div>}
                      {range && <div className="proposal-pricing-range">{serialize(range)}</div>}
                      {desc && <div className="proposal-pricing-desc">{serialize(desc)}</div>}
                    </div>
                  );
                })}
              </div>

              {/* Ad Budget Banner */}
              {adBudget && (
                <div className="proposal-ad-budget-banner">
                  <strong>Recommended Ad Budget:</strong>{' '}
                  {adBudget.daily_budget && `${adBudget.daily_budget} daily`}
                  {adBudget.duration && ` · ${adBudget.duration}`}
                  {adBudget.adjustment_note && ` — ${adBudget.adjustment_note}`}
                </div>
              )}
            </section>
          )}

          {/* Inclusions + Value Adds */}
          {(packageInclusions.length > 0 || valueAdds.length > 0) && (
            <section className="proposal-section">
              <h2 className="proposal-section-title">What&apos;s Included</h2>
              <div className="proposal-inclusions-grid">
                {packageInclusions.length > 0 && (
                  <div>
                    <p className="proposal-sub-label" style={{ marginBottom: 12 }}>Package Inclusions</p>
                    <ul className="proposal-check-list">
                      {packageInclusions.map((item: string | object, idx: number) => (
                        <li key={idx} className="proposal-check-item">
                          <span className="proposal-check-dot"><CheckSvg /></span>
                          <span>{typeof item === 'string' ? item : serialize(item)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {valueAdds.length > 0 && (
                  <div>
                    <p className="proposal-sub-label" style={{ marginBottom: 12 }}>Value Adds</p>
                    <ul className="proposal-check-list">
                      {valueAdds.map((va: string | object, idx: number) => (
                        <li key={idx} className="proposal-check-item">
                          <span className="proposal-check-dot-purple"><CheckSvg color="#6c63ff" /></span>
                          <span>{typeof va === 'string' ? va : serialize(va)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Campaign Timeline */}
          {timelineMilestones.length > 0 && (
            <section className="proposal-section">
              <h2 className="proposal-section-title">Campaign Timeline</h2>
              <div className="proposal-timeline">
                {timelineMilestones.map((row: Record<string, unknown>, idx: number) => {
                  const week = row.week !== undefined ? String(row.week) : `Week ${idx + 1}`;
                  const milestone = row.milestone || row.title || '';
                  const deliverable = row.deliverable || row.deliverables || '';
                  const desc = row.description || row.activities || row.details || '';
                  const isLast = idx === timelineMilestones.length - 1;
                  return (
                    <div key={idx} className="proposal-timeline-step">
                      <div className="proposal-timeline-left">
                        <div className="proposal-timeline-dot">{idx + 1}</div>
                        {!isLast && <div className="proposal-timeline-line" />}
                      </div>
                      <div className="proposal-timeline-content">
                        <div className="proposal-timeline-week">{week}</div>
                        {milestone && <div className="proposal-timeline-milestone">{serialize(milestone as string)}</div>}
                        {deliverable && <div className="proposal-timeline-deliverable">↳ {serialize(deliverable as string)}</div>}
                        {desc && <p className="proposal-timeline-desc">{serialize(desc as string)}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Key Success Metrics */}
          {metrics.length > 0 && (
            <section className="proposal-section">
              <h2 className="proposal-section-title">Key Success Metrics</h2>
              <div className="proposal-metrics-table">
                <div className="proposal-metrics-header">
                  <span>Metric</span>
                  <span>Target</span>
                  <span>Description</span>
                </div>
                {metrics.map((m: Record<string, unknown>, idx: number) => (
                  <div key={idx} className="proposal-metric-row">
                    <span className="proposal-metric-name">{serialize((m.metric || m.name || m.kpi) as string)}</span>
                    <span className="proposal-metric-target">{serialize((m.target || m.value) as string)}</span>
                    <span className="proposal-metric-desc">{serialize((m.description || m.details) as string)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Offer Details */}
          {offerDetails && (
            <section className="proposal-section">
              <h2 className="proposal-section-title">Special Offer</h2>
              <div className="proposal-offer-card">
                {offerDetails.offer_type && <div className="proposal-offer-type">{offerDetails.offer_type}</div>}
                {offerDetails.description && <p className="proposal-offer-desc">{offerDetails.description}</p>}
                {offerDetails.call_to_action && <p className="proposal-offer-cta">{offerDetails.call_to_action}</p>}
              </div>
            </section>
          )}

          {/* Next Steps */}
          {nextSteps && (
            <section className="proposal-section">
              <h2 className="proposal-section-title">Next Steps</h2>
              <div className="proposal-next-steps-card">
                <p className="proposal-body-text" style={{ color: '#166534' }}>{nextSteps}</p>
              </div>
            </section>
          )}
        </div>

        {/* ══ FOOTER ══ */}
        <div className="proposal-footer">
          <span className="proposal-footer-brand">SocialJet · socialjet.sg</span>
          <span className="proposal-footer-note">Confidential — prepared exclusively for {companyName}</span>
        </div>
      </div>
    </div>
  );
}

// ── ProposalWrapper ───────────────────────────────────────────────────────

function ProposalWrapper({ item }: { item: ProposalItem }) {
  const docRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    if (!docRef.current) return;
    const html = docRef.current.outerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.documentElement.innerHTML = `
<head>
<meta charset="utf-8">
<title>Proposal — ${item.lead_company}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 40px; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
  @media print { body { padding: 0; background: white; } @page { margin: 10mm; } }
</style>
</head>
<body>${html}</body>`;
    win.focus();
    setTimeout(() => win.print(), 800);
  }, [item.lead_company]);

  const statusMap: Record<string, string> = {
    approved: styles.badgeGreen,
    pending: styles.badgeYellow,
    rejected: styles.badgeRed,
  };

  return (
    <div className={styles.proposalWrapper}>
      <div className={styles.proposalBar}>
        <div className={styles.proposalBarLeft}>
          <DocIcon />
          <span className={styles.proposalBarTitle}>
            Proposal for <strong>{item.lead_company}</strong>
          </span>
          <span className={`${styles.badge} ${statusMap[item.review_status] ?? styles.badgeGray}`}>
            {item.review_status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>
        <button className={styles.downloadBtn} onClick={handleDownload} aria-label="Download proposal PDF">
          <DownloadIcon /> Download PDF
        </button>
      </div>
      <ProposalDocument item={item} docRef={docRef} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function ProposalsPage() {
  const [proposals, setProposals] = useState<ProposalItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchProposals()
      .then((res) => setProposals(res.proposals))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Your Proposals</h1>
            <p className={styles.pageSub}>Campaign proposals prepared by the SocialJet team</p>
          </div>
        </div>

        {loading && (
          <div className={styles.centerState}>
            <span className={styles.spinner} />
            <p>Loading proposals…</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorState}>
            <p>Failed to load proposals. Please refresh.</p>
          </div>
        )}

        {!loading && !error && proposals.length === 0 && (
          <div className={styles.emptyState}>
            <DocIcon />
            <p>No proposals yet. The SocialJet team will share one soon.</p>
          </div>
        )}

        {!loading && !error && proposals.length > 0 && (
          <div className={styles.proposalsList}>
            {proposals.map((p) => (
              <ProposalWrapper key={p.call_id} item={p} />
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}

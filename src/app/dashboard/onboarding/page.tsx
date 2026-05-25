'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { AuthGuard } from '@/components/AuthGuard';
import { Navbar } from '@/components/Navbar';
import { fetchOnboardingDocuments } from '@/services/api/overview.service';
import type { OnboardingDocumentItem } from '@/types/overview.types';
import styles from './onboarding.module.css';

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

function hasValue(v: unknown): boolean {
  if (v === null || v === undefined || v === '') return false;
  if (Array.isArray(v)) return v.length > 0;
  return true;
}

// ── Embedded CSS ───────────────────────────────────────────────────────────

const ONBOARDING_CSS = `
.ob-root { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; display: flex; flex-direction: column; gap: 0; }
.ob-doc { background: white; border-radius: 20px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.07); }
.ob-hero { background: linear-gradient(135deg, #1e1b4b 0%, #3730a3 50%, #6c63ff 100%); padding: 40px 40px 32px; position: relative; overflow: hidden; }
.ob-hero::before { content: ''; position: absolute; top: -60px; right: -60px; width: 240px; height: 240px; border-radius: 50%; background: rgba(255,255,255,0.05); }
.ob-hero::after { content: ''; position: absolute; bottom: -40px; left: 30%; width: 160px; height: 160px; border-radius: 50%; background: rgba(255,255,255,0.04); }
.ob-agency-label { font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: rgba(255,255,255,0.5); margin-bottom: 12px; position: relative; z-index: 1; }
.ob-prepared-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.4); margin-bottom: 8px; position: relative; z-index: 1; }
.ob-hero-title { font-size: 32px; font-weight: 800; color: #fff; margin: 0 0 16px; line-height: 1.15; position: relative; z-index: 1; }
.ob-hero-title .sep { font-weight: 300; opacity: 0.6; margin: 0 8px; }
.ob-doc-type-pill { display: inline-block; border: 1px solid rgba(255,255,255,0.3); border-radius: 8px; padding: 4px 16px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.8); margin-bottom: 16px; position: relative; z-index: 1; }
.ob-hero-summary { font-size: 14px; color: rgba(255,255,255,0.65); margin: 0 0 24px; max-width: 600px; line-height: 1.6; position: relative; z-index: 1; }
.ob-hero-meta { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; border-top: 1px solid rgba(255,255,255,0.15); padding-top: 20px; position: relative; z-index: 1; }
.ob-meta-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: rgba(255,255,255,0.45); }
.ob-meta-value { font-size: 14px; font-weight: 600; color: #fff; margin-top: 2px; }
.ob-body { padding: 24px; display: flex; flex-direction: column; gap: 16px; }
.ob-section { border: 1px solid #e8e8f0; border-radius: 12px; overflow: hidden; }
.ob-section-header { padding: 10px 16px; background: #f9f9fb; border-bottom: 1px solid #e8e8f0; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #6b7280; }
.ob-section-body { padding: 16px; display: grid; grid-template-columns: 1fr 1fr; gap: 12px 24px; }
.ob-section-body.full { display: flex; flex-direction: column; gap: 12px; }
.ob-field { display: flex; flex-direction: column; gap: 4px; }
.ob-field-label { font-size: 11px; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.04em; }
.ob-field-value { font-size: 13px; color: #111827; line-height: 1.5; }
.ob-pills { display: flex; flex-wrap: wrap; gap: 6px; }
.ob-pill { display: inline-flex; align-items: center; padding: 3px 10px; background: #f3f2ff; color: #5b21b6; border-radius: 9999px; font-size: 12px; font-weight: 500; }
.ob-table { width: 100%; border-collapse: collapse; }
.ob-table th { text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #e8e8f0; background: #f9f9fb; }
.ob-table td { padding: 10px 12px; color: #374151; font-size: 13px; border-bottom: 1px solid #f1f5f9; }
.ob-table tr:last-child td { border-bottom: none; }
.ob-footer { border-top: 1px solid #e2e8f0; padding: 16px 24px; display: flex; justify-content: space-between; align-items: center; background: #f8fafc; }
.ob-footer-brand { font-size: 13px; font-weight: 800; color: #6c63ff; }
.ob-footer-note { font-size: 11px; color: #94a3b8; }
@media print { body { padding: 0 !important; } @page { margin: 10mm; size: A4; } }
`;

// ── Icons ──────────────────────────────────────────────────────────────────

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

// ── Field helpers ──────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toLabel(item: any): string {
  if (!item) return '';
  if (typeof item === 'string') return item;
  if (typeof item === 'number') return String(item);
  if (typeof item === 'object') {
    // e.g. { count: 5, tier: "Micro" } → "Micro (5)"
    const { tier, count, name, label, value, title, ...rest } = item;
    if (tier && count != null) return `${tier} (${count})`;
    if (tier) return String(tier);
    if (name) return String(name);
    if (label) return String(label);
    if (title) return String(title);
    if (value) return String(value);
    return Object.values(rest).filter(Boolean).join(' · ');
  }
  return String(item);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Pills({ items }: { items: any[] }) {
  const filtered = items.map(toLabel).filter(Boolean);
  if (filtered.length === 0) return null;
  return (
    <div className="ob-pills">
      {filtered.map((p, i) => <span key={i} className="ob-pill">{p}</span>)}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="ob-field">
      <span className="ob-field-label">{label}</span>
      <div className="ob-field-value">{children}</div>
    </div>
  );
}

// ── OnboardingDocumentCard ─────────────────────────────────────────────────

function OnboardingDocumentCard({
  item,
  docRef,
}: {
  item: OnboardingDocumentItem;
  docRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { document: doc } = item;
  const { brand, campaign, kols, content, product, offer_and_cta, budget, timeline, pending_items, next_steps } = doc;
  const date = formatDate(item.created_at);

  // ── Section visibility guards ──
  const showBrandContact = hasValue(brand.website) || hasValue(brand.phone) || hasValue(brand.email) ||
    hasValue(brand.instagram) || hasValue(brand.tiktok) || hasValue(brand.facebook) || hasValue(brand.source);

  const showCampaign = hasValue(campaign.platforms) || hasValue(campaign.objectives) ||
    hasValue(campaign.geographic_focus) || hasValue(campaign.marketing_message) ||
    hasValue(campaign.deliverables) || hasValue(campaign.content_timeline) || hasValue(campaign.creative_angles);

  const showKols = hasValue(kols.total_count) || hasValue(kols.tier_breakdown) ||
    hasValue(kols.preferred_age_range) || hasValue(kols.ideal_profile) || hasValue(kols.no_gos);

  const showContent = hasValue(content.type_preferences) || hasValue(content.tone_and_style) ||
    hasValue(content.mandatory_inclusions) || hasValue(content.content_donts);

  const showProduct = hasValue(product.main_products) || hasValue(product.usps) ||
    hasValue(product.delivery_by) || hasValue(product.loan_or_given) || hasValue(product.lead_time_days);

  const showOffer = hasValue(offer_and_cta.offer) || hasValue(offer_and_cta.cta) || hasValue(offer_and_cta.cta_links);

  const showBudgetTimeline = hasValue(budget) || hasValue(timeline.start_date) ||
    hasValue(timeline.end_date) || hasValue(timeline.posting_schedule);

  const keyDatesRows = (timeline.key_dates ?? []).filter(r => hasValue(r.date) || hasValue(r.milestone) || hasValue(r.owner));
  const pendingRows = (pending_items ?? []).filter(r => hasValue(r.item) || hasValue(r.from) || hasValue(r.deadline));
  const nextStepsRows = (next_steps ?? []).filter(r => hasValue(r.action) || hasValue(r.owner) || hasValue(r.deadline));

  return (
    <div className="ob-root" ref={docRef}>
      <style dangerouslySetInnerHTML={{ __html: ONBOARDING_CSS }} />
      <div className="ob-doc">

        {/* ══ HERO ══ */}
        <div className="ob-hero">
          <div className="ob-agency-label">SOCIALJET · INFLUENCER MARKETING AGENCY</div>
          <div className="ob-prepared-label">Prepared for</div>
          <h1 className="ob-hero-title">
            SocialJet <span className="sep">×</span> {brand.name}
          </h1>
          <div className="ob-doc-type-pill">ONBOARDING DOCUMENT</div>
          {hasValue(brand.summary) && (
            <p className="ob-hero-summary">{brand.summary}</p>
          )}
          <div className="ob-hero-meta">
            <div>
              <div className="ob-meta-label">Industry</div>
              <div className="ob-meta-value">{brand.industry || '—'}</div>
            </div>
            <div>
              <div className="ob-meta-label">Contact</div>
              <div className="ob-meta-value">{brand.contact_name || '—'}</div>
            </div>
            <div>
              <div className="ob-meta-label">Date</div>
              <div className="ob-meta-value">{date}</div>
            </div>
          </div>
        </div>

        {/* ══ BODY ══ */}
        <div className="ob-body">

          {/* Brand & Contact */}
          {showBrandContact && (
            <div className="ob-section">
              <div className="ob-section-header">Brand &amp; Contact</div>
              <div className="ob-section-body">
                {hasValue(brand.website) && <Field label="Website">{brand.website}</Field>}
                {hasValue(brand.phone) && <Field label="Phone">{brand.phone}</Field>}
                {hasValue(brand.email) && <Field label="Email">{brand.email}</Field>}
                {hasValue(brand.instagram) && <Field label="Instagram">{brand.instagram}</Field>}
                {hasValue(brand.tiktok) && <Field label="TikTok">{brand.tiktok}</Field>}
                {hasValue(brand.facebook) && <Field label="Facebook">{brand.facebook}</Field>}
                {hasValue(brand.source) && <Field label="Source">{brand.source}</Field>}
              </div>
            </div>
          )}

          {/* Campaign Overview */}
          {showCampaign && (
            <div className="ob-section">
              <div className="ob-section-header">Campaign Overview</div>
              <div className="ob-section-body full">
                {hasValue(campaign.platforms) && (
                  <Field label="Platforms"><Pills items={campaign.platforms} /></Field>
                )}
                {hasValue(campaign.objectives) && (
                  <Field label="Objectives"><Pills items={campaign.objectives} /></Field>
                )}
                {hasValue(campaign.geographic_focus) && (
                  <Field label="Geographic Focus">{campaign.geographic_focus}</Field>
                )}
                {hasValue(campaign.marketing_message) && (
                  <Field label="Marketing Message">{campaign.marketing_message}</Field>
                )}
                {hasValue(campaign.deliverables) && (
                  <Field label="Deliverables">{campaign.deliverables}</Field>
                )}
                {hasValue(campaign.content_timeline) && (
                  <Field label="Content Timeline">{campaign.content_timeline}</Field>
                )}
                {hasValue(campaign.creative_angles) && (
                  <Field label="Creative Angles"><Pills items={campaign.creative_angles} /></Field>
                )}
              </div>
            </div>
          )}

          {/* KOL Requirements */}
          {showKols && (
            <div className="ob-section">
              <div className="ob-section-header">KOL Requirements</div>
              <div className="ob-section-body">
                {hasValue(kols.total_count) && (
                  <Field label="Total Count">{String(kols.total_count)}</Field>
                )}
                {hasValue(kols.tier_breakdown) && (
                  <Field label="Tier Breakdown"><Pills items={kols.tier_breakdown} /></Field>
                )}
                {hasValue(kols.preferred_age_range) && (
                  <Field label="Preferred Age Range">{kols.preferred_age_range}</Field>
                )}
                {hasValue(kols.ideal_profile) && (
                  <Field label="Ideal Profile">{kols.ideal_profile}</Field>
                )}
                {hasValue(kols.no_gos) && (
                  <Field label="No-Gos"><Pills items={kols.no_gos} /></Field>
                )}
              </div>
            </div>
          )}

          {/* Content Guidelines */}
          {showContent && (
            <div className="ob-section">
              <div className="ob-section-header">Content Guidelines</div>
              <div className="ob-section-body full">
                {hasValue(content.type_preferences) && (
                  <Field label="Type Preferences"><Pills items={content.type_preferences} /></Field>
                )}
                {hasValue(content.tone_and_style) && (
                  <Field label="Tone &amp; Style">{content.tone_and_style}</Field>
                )}
                {hasValue(content.mandatory_inclusions) && (
                  <Field label="Mandatory Inclusions"><Pills items={content.mandatory_inclusions} /></Field>
                )}
                {hasValue(content.content_donts) && (
                  <Field label="Content Don'ts"><Pills items={content.content_donts} /></Field>
                )}
              </div>
            </div>
          )}

          {/* Product Details */}
          {showProduct && (
            <div className="ob-section">
              <div className="ob-section-header">Product Details</div>
              <div className="ob-section-body">
                {hasValue(product.main_products) && (
                  <Field label="Main Products"><Pills items={product.main_products} /></Field>
                )}
                {hasValue(product.usps) && (
                  <Field label="USPs"><Pills items={product.usps} /></Field>
                )}
                {hasValue(product.delivery_by) && (
                  <Field label="Delivery By">{product.delivery_by}</Field>
                )}
                {hasValue(product.loan_or_given) && (
                  <Field label="Loan or Given">{product.loan_or_given}</Field>
                )}
                {hasValue(product.lead_time_days) && (
                  <Field label="Lead Time (days)">{product.lead_time_days}</Field>
                )}
              </div>
            </div>
          )}

          {/* Offer & CTA */}
          {showOffer && (
            <div className="ob-section">
              <div className="ob-section-header">Offer &amp; CTA</div>
              <div className="ob-section-body full">
                {hasValue(offer_and_cta.offer) && (
                  <Field label="Offer">{offer_and_cta.offer}</Field>
                )}
                {hasValue(offer_and_cta.cta) && (
                  <Field label="CTA">{offer_and_cta.cta}</Field>
                )}
                {hasValue(offer_and_cta.cta_links) && (
                  <Field label="CTA Links"><Pills items={offer_and_cta.cta_links} /></Field>
                )}
              </div>
            </div>
          )}

          {/* Budget & Timeline */}
          {showBudgetTimeline && (
            <div className="ob-section">
              <div className="ob-section-header">Budget &amp; Timeline</div>
              <div className="ob-section-body">
                {hasValue(budget) && <Field label="Budget">{budget}</Field>}
                {hasValue(timeline.start_date) && <Field label="Start Date">{timeline.start_date}</Field>}
                {hasValue(timeline.end_date) && <Field label="End Date">{timeline.end_date}</Field>}
                {hasValue(timeline.posting_schedule) && <Field label="Posting Schedule">{timeline.posting_schedule}</Field>}
              </div>
            </div>
          )}

          {/* Key Dates */}
          {keyDatesRows.length > 0 && (
            <div className="ob-section">
              <div className="ob-section-header">Key Dates</div>
              <table className="ob-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Milestone</th>
                    <th>Owner</th>
                  </tr>
                </thead>
                <tbody>
                  {keyDatesRows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.date || '—'}</td>
                      <td>{r.milestone || '—'}</td>
                      <td>{r.owner || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pending Items */}
          {pendingRows.length > 0 && (
            <div className="ob-section">
              <div className="ob-section-header">Pending Items</div>
              <table className="ob-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>From</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.item || '—'}</td>
                      <td>{r.from || '—'}</td>
                      <td>{r.deadline || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Next Steps */}
          {nextStepsRows.length > 0 && (
            <div className="ob-section">
              <div className="ob-section-header">Next Steps</div>
              <table className="ob-table">
                <thead>
                  <tr>
                    <th>Action</th>
                    <th>Owner</th>
                    <th>Deadline</th>
                  </tr>
                </thead>
                <tbody>
                  {nextStepsRows.map((r, i) => (
                    <tr key={i}>
                      <td>{r.action || '—'}</td>
                      <td>{r.owner || '—'}</td>
                      <td>{r.deadline || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* ══ FOOTER ══ */}
        <div className="ob-footer">
          <span className="ob-footer-brand">SocialJet · socialjet.sg</span>
          <span className="ob-footer-note">Confidential — prepared for {brand.name}</span>
        </div>
      </div>
    </div>
  );
}

// ── OnboardingWrapper ──────────────────────────────────────────────────────

function OnboardingWrapper({ item }: { item: OnboardingDocumentItem }) {
  const docRef = useRef<HTMLDivElement>(null);

  const handleDownload = useCallback(() => {
    if (!docRef.current) return;
    const html = docRef.current.outerHTML;
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.documentElement.innerHTML = `
<head>
<meta charset="utf-8">
<title>Onboarding — ${item.document.brand.name}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body { margin: 0; padding: 40px; background: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; color-adjust: exact; }
  @media print { body { padding: 0; background: white; } @page { margin: 10mm; size: A4; } }
</style>
</head>
<body>${html}</body>`;
    win.focus();
    setTimeout(() => win.print(), 800);
  }, [item.document.brand.name]);

  return (
    <div className={styles.wrapper}>
      <div className={styles.topBar}>
        <div className={styles.topBarLeft}>
          <DocIcon />
          <span className={styles.topBarTitle}>
            Onboarding Document for <strong>{item.document.brand.name}</strong>
          </span>
          <span className={`${styles.badge} ${styles.badgeGray}`}>
            {item.doc_type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}
          </span>
        </div>
        <button className={styles.downloadBtn} onClick={handleDownload} aria-label="Download onboarding PDF">
          <DownloadIcon /> Download PDF
        </button>
      </div>
      <OnboardingDocumentCard item={item} docRef={docRef} />
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────

export default function OnboardingPage() {
  const [docs, setDocs] = useState<OnboardingDocumentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    fetchOnboardingDocuments()
      .then((res) => setDocs(res.onboarding_documents))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, []);

  return (
    <AuthGuard>
      <Navbar />
      <main className={styles.page}>
        <div className={styles.pageHeader}>
          <div>
            <h1 className={styles.pageTitle}>Onboarding Documents</h1>
            <p className={styles.pageSub}>Campaign onboarding documents prepared by the SocialJet team</p>
          </div>
        </div>

        {loading && (
          <div className={styles.centerState}>
            <span className={styles.spinner} />
            <p>Loading onboarding documents…</p>
          </div>
        )}

        {error && !loading && (
          <div className={styles.errorState}>
            <p>Failed to load onboarding documents. Please refresh.</p>
          </div>
        )}

        {!loading && !error && docs.length === 0 && (
          <div className={styles.emptyState}>
            <DocIcon />
            <p>No onboarding documents yet. The SocialJet team will share one soon.</p>
          </div>
        )}

        {!loading && !error && docs.length > 0 && (
          <div className={styles.list}>
            {docs.map((doc) => (
              <OnboardingWrapper key={doc.onboarding_id} item={doc} />
            ))}
          </div>
        )}
      </main>
    </AuthGuard>
  );
}

// ALL API URLs are defined here — never hardcode URLs elsewhere.

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';

export const ENDPOINTS = {
  // ─── Auth ──────────────────────────────────────────────────────
  AUTH_OTP_REQUEST: `${BASE}/auth/otp/request`,
  AUTH_OTP_VERIFY: `${BASE}/auth/otp/verify`,

  // ─── Campaigns ────────────────────────────────────────────────
  CAMPAIGNS: `${BASE}/client/campaigns`,
  CAMPAIGN: (campaignId: string) => `${BASE}/client/campaigns/${campaignId}`,

  // ─── Creators ────────────────────────────────────────────────
  CREATORS: (campaignId: string) =>
    `${BASE}/client/campaigns/${campaignId}/creators`,
  CREATOR_APPROVE: (campaignId: string, creatorId: string) =>
    `${BASE}/client/campaigns/${campaignId}/creators/${creatorId}/approve`,
  CREATOR_REJECT: (campaignId: string, creatorId: string) =>
    `${BASE}/client/campaigns/${campaignId}/creators/${creatorId}/reject`,

  // ─── Content ─────────────────────────────────────────────────
  CONTENT: (campaignId: string) =>
    `${BASE}/client/campaigns/${campaignId}/content`,
  CONTENT_APPROVE: (campaignId: string, contentId: string) =>
    `${BASE}/client/campaigns/${campaignId}/content/${contentId}/approve`,
  CONTENT_REJECT: (campaignId: string, contentId: string) =>
    `${BASE}/client/campaigns/${campaignId}/content/${contentId}/reject`,

  // ─── Progress ────────────────────────────────────────────────
  CAMPAIGN_PROGRESS: (campaignId: string) =>
    `${BASE}/client/campaigns/${campaignId}/progress`,

  // ─── Dashboard ───────────────────────────────────────────────
  OVERVIEW: `${BASE}/client/overview`,
  PROPOSALS: `${BASE}/client/proposals`,
  ONBOARDING_DOCUMENTS: `${BASE}/client/onboarding-document`,
  INFLUENCERS: `${BASE}/client/influencers`,
  INFLUENCER_UPDATE: (creatorId: string) => `${BASE}/client/influencers/${creatorId}`,
  SELECTED_CREATORS: `${BASE}/client/creators`,

  // ─── Content review ──────────────────────────────────────────
  CLIENT_CONTENT_LINKS: (leadId: string, creatorId: string) =>
    `${BASE}/content/${leadId}/${creatorId}/client-links`,
  CLIENT_CONTENT_REVIEW: (leadId: string, contentId: string) =>
    `${BASE}/content/${leadId}/links/${contentId}/client-review`,
} as const;

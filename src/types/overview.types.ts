export interface OverviewLead {
  name: string;
  company: string;
  email: string;
  phone: string;
  status: string;
  stage: string;
  source: string;
  contact_person: string;
  created_at: string;
}

export interface OverviewMeeting {
  meeting_id: string;
  scheduled_at: string;
  meeting_status: string;
  meeting_type: string;
  event_name: string;
  source: string;
  duration: string;
  zoom_join_url: string;
  has_transcript: boolean;
}

export interface OverviewProposal {
  call_id: string;
  has_proposal: boolean;
  review_status: string;
  created_at: string;
  email_sent: boolean;
  email_sent_at: string | null;
}

export interface OverviewCampaign {
  campaign_id: string;
  name: string;
  status: string;
  created_at: string;
}

export interface OverviewResponse {
  lead: OverviewLead;
  meetings: OverviewMeeting[];
  proposals: OverviewProposal[];
  campaigns: OverviewCampaign[];
  total_meetings: number;
  total_proposals: number;
  total_campaigns: number;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ProposalContent = Record<string, any>;

export interface ProposalItem {
  call_id: string;
  lead_name: string;
  lead_company: string;
  proposal: ProposalContent;
  review_status: string;
  call_summary: string;
  client_needs: string;
  created_at: string;
  email_sent: boolean;
  email_sent_at: string | null;
}

export interface ProposalsResponse {
  proposals: ProposalItem[];
  total: number;
}

// ── Onboarding Document ──────────────────────────────────────────────────

export interface OnboardingBrand {
  name: string;
  industry: string;
  contact_name: string;
  email: string;
  phone: string;
  source: string;
  website: string;
  instagram: string;
  tiktok: string;
  facebook: string;
  summary: string;
}

export interface OnboardingCampaign {
  platforms: string[];
  deliverables: string;
  content_timeline: string;
  objectives: string[];
  marketing_message: string;
  creative_angles: string[];
  geographic_focus: string;
}

export interface OnboardingKols {
  total_count: number | null;
  tier_breakdown: string[];
  ideal_profile: string;
  preferred_age_range: string;
  no_gos: string[];
}

export interface OnboardingContent {
  type_preferences: string[];
  tone_and_style: string;
  mandatory_inclusions: string[];
  content_donts: string[];
}

export interface OnboardingProduct {
  main_products: string[];
  usps: string[];
  delivery_by: string;
  loan_or_given: string;
  lead_time_days: string;
}

export interface OnboardingOfferAndCta {
  offer: string;
  cta: string;
  cta_links: string[];
}

export interface OnboardingKeyDate {
  date: string;
  milestone: string;
  owner: string;
}

export interface OnboardingTimeline {
  start_date: string;
  end_date: string;
  key_dates: OnboardingKeyDate[];
  posting_schedule: string;
}

export interface OnboardingPendingItem {
  item: string;
  from: string;
  deadline: string;
}

export interface OnboardingNextStep {
  action: string;
  owner: string;
  deadline: string;
}

export interface OnboardingDocument {
  brand: OnboardingBrand;
  campaign: OnboardingCampaign;
  kols: OnboardingKols;
  content: OnboardingContent;
  product: OnboardingProduct;
  offer_and_cta: OnboardingOfferAndCta;
  budget: string;
  timeline: OnboardingTimeline;
  pending_items: OnboardingPendingItem[];
  client_comments: string[];
  onboarding_call_agenda: string[];
  next_steps: OnboardingNextStep[];
  raw_html: string | null;
}

export interface OnboardingDocumentItem {
  onboarding_id: string;
  doc_type: string;
  document: OnboardingDocument;
  sent_at: string;
  email_sent: string;
  email_sent_at: string;
  created_at: string;
}

export interface OnboardingDocumentsResponse {
  onboarding_documents: OnboardingDocumentItem[];
  total: number;
}

// ── Influencers ──────────────────────────────────────────────────────────

export interface InfluencerProfile {
  creator_id: string;
  name: string;
  email: string;
  phone: string;
  niche: string;
  category: string;
  location: string;
  country: string;
  language: string;
  bio: string;
  profile_image: string;
  rate: string;
  instagram_handle: string;
  instagram_followers: number;
  instagram_following: number;
  instagram_posts: number;
  instagram_engagement_rate: number;
  instagram_avg_likes: number;
  instagram_avg_comments: number;
  instagram_url: string;
  tiktok_handle: string;
  tiktok_followers: number;
  tiktok_following: number;
  tiktok_videos: number;
  tiktok_likes: number;
  tiktok_engagement_rate: number;
  tiktok_avg_views: number;
  tiktok_url: string;
  youtube_subscribers: number;
  youtube_videos: number;
  youtube_views: number;
  youtube_engagement_rate: number;
  youtube_avg_views: number;
  youtube_url: string;
  follower_count: number;
  engagement_rate: number;
  status: string;
}

export interface InfluencerItem {
  assignment_id: string;
  creator_id: string;
  status: string;
  source: string;
  added_at: string;
  sent_to_client_at: string | null;
  recommendation_score: number | null;
  selection_reason: string;
  profile: InfluencerProfile;
}

export interface InfluencersResponse {
  influencers: InfluencerItem[];
  total: number;
}

// ── Selected Creators ────────────────────────────────────────────────────

export interface CreatorItem {
  assignment_id: string;
  creator_id: string;
  status: string;
  source: string;
  added_at: string;
  client_decision_at: string | null;
  sent_to_client_at: string | null;
  profile: InfluencerProfile;
}

export interface CreatorsResponse {
  creators: CreatorItem[];
  total: number;
}

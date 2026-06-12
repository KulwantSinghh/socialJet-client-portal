export interface OverviewLead {
  lead_id?: string;
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
  lead_id?: string;
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

export interface InstagramPostMusic {
  artist_name: string;
  song_name: string;
  uses_original_audio: boolean;
  audio_id: string;
}

export interface InstagramCarouselItem {
  position: number;
  id: string;
  type: string;
  link: string;
  width: number;
  height: number;
}

export interface InstagramPost {
  position: number;
  id: string;
  permalink: string;
  type: 'reel' | 'carousel' | 'image' | string;
  link: string;
  width: number;
  height: number;
  views?: number;
  has_audio?: boolean;
  caption?: string;
  likes?: number;
  comments?: number;
  iso_date?: string;
  music?: InstagramPostMusic;
  carousel_items?: InstagramCarouselItem[];
  thumbnail?: string;
}

export interface InstagramSearchProfile {
  username: string;
  name: string;
  bio: string;
  avatar: string;
  avatar_hd: string;
  is_verified: boolean;
  is_business: boolean;
  posts: number;
  followers: number;
  following: number;
  category: string;
}

export interface SearchApiData {
  instagram?: {
    profile?: InstagramSearchProfile;
    posts?: InstagramPost[];
  };
}

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
  instagram_followers: number | null;
  instagram_following: number | null;
  instagram_posts: number | null;
  instagram_engagement_rate: number | null;
  instagram_avg_likes: number | null;
  instagram_avg_comments: number | null;
  instagram_url: string;
  tiktok_handle: string;
  tiktok_followers: number | null;
  tiktok_following: number | null;
  tiktok_videos: number | null;
  tiktok_likes: number | null;
  tiktok_engagement_rate: number | null;
  tiktok_avg_views: number | null;
  tiktok_url: string;
  youtube_subscribers: number | null;
  youtube_videos: number | null;
  youtube_views: number | null;
  youtube_engagement_rate: number | null;
  youtube_avg_views: number | null;
  youtube_url: string;
  follower_count: number | null;
  engagement_rate: number | null;
  is_verified?: boolean;
  is_business?: boolean;
  status: string;
  searchapi_data?: SearchApiData;
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
  recommendation_score?: number | null;
  selection_reason?: string;
  profile: InfluencerProfile;
}

export interface CreatorsResponse {
  creators: CreatorItem[];
  total: number;
}

// ── Content review ───────────────────────────────────────────────────────

export interface ClientContentLink {
  content_id: string;
  lead_id: string;
  creator_id: string;
  creator_name: string;
  platform: string;
  content_url: string;
  caption: string | null;
  status: string;
  submitted_by: string | null;
  submitted_at: string | null;
  cm_approved_at: string | null;
  cm_note: string | null;
  cm_reviewed_by: string | null;
  client_approved_at: string | null;
  client_note: string | null;
  client_reviewed_by?: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientContentLinksResponse {
  lead_id: string;
  creator_id: string;
  creator_name: string;
  brand_name: string;
  content: ClientContentLink[];
  total: number;
}

export type ClientReviewStatus = 'client_approved' | 'client_rejected';

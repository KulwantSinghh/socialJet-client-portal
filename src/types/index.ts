// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  access_token: string;
  token_type: string;
  role: string;
}

export interface ApproveRejectRequest {
  note?: string;
}

export interface ApproveRejectResponse {
  success: boolean;
  message: string;
}

// ─── Campaign ────────────────────────────────────────────────────────────────

export interface Campaign {
  id: string;
  name: string;
  brand: string;
  status: string;
  start_date: string;
  end_date: string;
  budget: number;
  currency: string;
  description: string;
  objectives: string[];
  created_at: string;
  updated_at: string;
}

export interface CampaignListResponse {
  campaigns: Campaign[];
  total: number;
}

// ─── Creator ─────────────────────────────────────────────────────────────────

export type CreatorStatus =
  | 'cm_approved'
  | 'client_approved'
  | 'client_rejected'
  | 'assigned';

export interface Creator {
  id: string;
  name: string;
  handle: string;
  platform: string;
  followers: number;
  engagement_rate: number;
  profile_image_url: string;
  niche: string[];
  status: CreatorStatus;
  assigned_at: string;
}

export interface CreatorsResponse {
  creators: Creator[];
  total: number;
}

// ─── Content ─────────────────────────────────────────────────────────────────

export type ContentStatus =
  | 'cm_approved'
  | 'client_approved'
  | 'client_rejected'
  | 'scheduled';

export interface Content {
  id: string;
  campaign_id: string;
  creator_id: string;
  creator_name: string;
  platform: string;
  type: string;
  caption: string;
  media_url: string;
  thumbnail_url: string;
  status: ContentStatus;
  submitted_at: string;
  scheduled_at: string | null;
}

export interface ContentResponse {
  content: Content[];
  total: number;
}

// ─── Progress ────────────────────────────────────────────────────────────────

export interface PhaseTimeline {
  phase: string;
  label: string;
  start_date: string;
  end_date: string;
  status: 'completed' | 'in_progress' | 'upcoming';
}

export interface CreatorStats {
  total: number;
  assigned: number;
  cm_approved: number;
  client_approved: number;
  client_rejected: number;
}

export interface ContentStats {
  total: number;
  submitted: number;
  cm_approved: number;
  client_approved: number;
  client_rejected: number;
  scheduled: number;
}

export interface CampaignProgress {
  campaign_id: string;
  overall_completion_percentage: number;
  timeline: PhaseTimeline[];
  creator_stats: CreatorStats;
  content_stats: ContentStats;
  milestones: {
    label: string;
    completed: boolean;
    date: string;
  }[];
}

import apiClient from './axios';
import { ENDPOINTS } from './endpoints';
import type {
  OverviewResponse,
  ProposalsResponse,
  OnboardingDocumentsResponse,
  InfluencersResponse,
  CreatorsResponse,
  ClientContentLinksResponse,
  ClientReviewStatus,
} from '@/types/overview.types';

export async function fetchSelectedCreators(): Promise<CreatorsResponse> {
  const { data } = await apiClient.get<CreatorsResponse>(ENDPOINTS.SELECTED_CREATORS);
  return data;
}

export async function fetchOverview(): Promise<OverviewResponse> {
  const { data } = await apiClient.get<OverviewResponse>(ENDPOINTS.OVERVIEW);
  return data;
}

export async function fetchProposals(): Promise<ProposalsResponse> {
  const { data } = await apiClient.get<ProposalsResponse>(ENDPOINTS.PROPOSALS);
  return data;
}

export async function fetchOnboardingDocuments(): Promise<OnboardingDocumentsResponse> {
  const { data } = await apiClient.get<OnboardingDocumentsResponse>(ENDPOINTS.ONBOARDING_DOCUMENTS);
  return data;
}

export async function fetchInfluencers(): Promise<InfluencersResponse> {
  const { data } = await apiClient.get<InfluencersResponse>(ENDPOINTS.INFLUENCERS);
  return data;
}

export async function approveInfluencer(creatorId: string): Promise<void> {
  await apiClient.patch(ENDPOINTS.INFLUENCER_UPDATE(creatorId), { status: 'accepted' });
}

export async function rejectInfluencer(creatorId: string): Promise<void> {
  await apiClient.patch(ENDPOINTS.INFLUENCER_UPDATE(creatorId), { status: 'rejected' });
}

/** The lead id lives on the overview response; field name tolerant. */
export async function fetchLeadId(): Promise<string | null> {
  const { data } = await apiClient.get<OverviewResponse>(ENDPOINTS.OVERVIEW);
  const root = data as unknown as Record<string, unknown>;
  const lead = (data.lead ?? {}) as unknown as Record<string, unknown>;
  const candidate = root.lead_id ?? lead.lead_id ?? lead.id;
  return typeof candidate === 'string' && candidate ? candidate : null;
}

export async function fetchClientContentLinks(
  leadId: string,
  creatorId: string,
): Promise<ClientContentLinksResponse> {
  const { data } = await apiClient.get<ClientContentLinksResponse>(
    ENDPOINTS.CLIENT_CONTENT_LINKS(leadId, creatorId),
  );
  return data;
}

export async function reviewContentLink(
  leadId: string,
  contentId: string,
  status: ClientReviewStatus,
  note?: string,
): Promise<void> {
  await apiClient.patch(ENDPOINTS.CLIENT_CONTENT_REVIEW(leadId, contentId), {
    status,
    ...(note?.trim() ? { note: note.trim() } : {}),
  });
}

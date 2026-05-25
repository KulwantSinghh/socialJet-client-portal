import apiClient from './axios';
import { ENDPOINTS } from './endpoints';
import type { OverviewResponse, ProposalsResponse, OnboardingDocumentsResponse, InfluencersResponse, CreatorsResponse } from '@/types/overview.types';

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

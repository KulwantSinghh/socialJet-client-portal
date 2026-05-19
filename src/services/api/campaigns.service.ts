import apiClient from './axios';
import { ENDPOINTS } from './endpoints';
import type { Campaign, CampaignListResponse } from '@/types';

export async function getCampaigns(): Promise<CampaignListResponse> {
  const { data } = await apiClient.get<CampaignListResponse>(ENDPOINTS.CAMPAIGNS);
  return data;
}

export async function getCampaign(campaignId: string): Promise<Campaign> {
  const { data } = await apiClient.get<Campaign>(ENDPOINTS.CAMPAIGN(campaignId));
  return data;
}

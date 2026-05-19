import apiClient from './api/axios';
import { ENDPOINTS } from './api/endpoints';
import type { CampaignProgress } from '@/types';

export async function getCampaignProgress(campaignId: string): Promise<CampaignProgress> {
  const { data } = await apiClient.get<CampaignProgress>(
    ENDPOINTS.CAMPAIGN_PROGRESS(campaignId)
  );
  return data;
}

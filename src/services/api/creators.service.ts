import apiClient from './axios';
import { ENDPOINTS } from './endpoints';
import type { CreatorsResponse, ApproveRejectRequest, ApproveRejectResponse } from '@/types';

export async function getCreators(campaignId: string): Promise<CreatorsResponse> {
  const { data } = await apiClient.get<CreatorsResponse>(ENDPOINTS.CREATORS(campaignId));
  return data;
}

export async function approveCreator(
  campaignId: string,
  creatorId: string,
  body: ApproveRejectRequest = {}
): Promise<ApproveRejectResponse> {
  const { data } = await apiClient.post<ApproveRejectResponse>(
    ENDPOINTS.CREATOR_APPROVE(campaignId, creatorId),
    body
  );
  return data;
}

export async function rejectCreator(
  campaignId: string,
  creatorId: string,
  body: ApproveRejectRequest = {}
): Promise<ApproveRejectResponse> {
  const { data } = await apiClient.post<ApproveRejectResponse>(
    ENDPOINTS.CREATOR_REJECT(campaignId, creatorId),
    body
  );
  return data;
}

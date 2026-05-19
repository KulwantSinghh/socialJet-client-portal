import apiClient from './axios';
import { ENDPOINTS } from './endpoints';
import type { ContentResponse, ApproveRejectRequest, ApproveRejectResponse } from '@/types';

export async function getContent(campaignId: string): Promise<ContentResponse> {
  const { data } = await apiClient.get<ContentResponse>(ENDPOINTS.CONTENT(campaignId));
  return data;
}

export async function approveContent(
  campaignId: string,
  contentId: string,
  body: ApproveRejectRequest = {}
): Promise<ApproveRejectResponse> {
  const { data } = await apiClient.post<ApproveRejectResponse>(
    ENDPOINTS.CONTENT_APPROVE(campaignId, contentId),
    body
  );
  return data;
}

export async function rejectContent(
  campaignId: string,
  contentId: string,
  body: ApproveRejectRequest = {}
): Promise<ApproveRejectResponse> {
  const { data } = await apiClient.post<ApproveRejectResponse>(
    ENDPOINTS.CONTENT_REJECT(campaignId, contentId),
    body
  );
  return data;
}

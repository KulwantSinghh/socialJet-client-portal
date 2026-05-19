'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getContent,
  approveContent,
  rejectContent,
} from '@/services/api/content.service';
import type { ApproveRejectRequest } from '@/types';

export function useContent(campaignId: string) {
  return useQuery({
    queryKey: ['content', campaignId],
    queryFn: () => getContent(campaignId),
    enabled: Boolean(campaignId),
  });
}

export function useApproveContent(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contentId,
      body,
    }: {
      contentId: string;
      body?: ApproveRejectRequest;
    }) => approveContent(campaignId, contentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', campaignId] });
    },
  });
}

export function useRejectContent(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      contentId,
      body,
    }: {
      contentId: string;
      body?: ApproveRejectRequest;
    }) => rejectContent(campaignId, contentId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content', campaignId] });
    },
  });
}

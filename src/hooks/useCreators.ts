'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getCreators,
  approveCreator,
  rejectCreator,
} from '@/services/api/creators.service';
import type { ApproveRejectRequest } from '@/types';

export function useCreators(campaignId: string) {
  return useQuery({
    queryKey: ['creators', campaignId],
    queryFn: () => getCreators(campaignId),
    enabled: Boolean(campaignId),
  });
}

export function useApproveCreator(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      creatorId,
      body,
    }: {
      creatorId: string;
      body?: ApproveRejectRequest;
    }) => approveCreator(campaignId, creatorId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creators', campaignId] });
    },
  });
}

export function useRejectCreator(campaignId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      creatorId,
      body,
    }: {
      creatorId: string;
      body?: ApproveRejectRequest;
    }) => rejectCreator(campaignId, creatorId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['creators', campaignId] });
    },
  });
}

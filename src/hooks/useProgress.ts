'use client';

import { useQuery } from '@tanstack/react-query';
import { getCampaignProgress } from '@/services/progress.service';

export function useProgress(campaignId: string) {
  return useQuery({
    queryKey: ['progress', campaignId],
    queryFn: () => getCampaignProgress(campaignId),
    enabled: Boolean(campaignId),
  });
}

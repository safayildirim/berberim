import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminService } from '@/src/services/admin.service';
import { queryKeys } from '@/src/lib/query/keys';

export type RetentionRange = '30d' | '60d' | '90d' | '180d' | '365d';
export type NoShowRange = 'monthly' | 'quarterly' | 'yearly';
export type LTVSegment = 'cohort' | 'acquisition_channel' | 'service_category';

const STALE_TIME = 1000 * 60 * 5; // 5 minutes

export const useCohortAnalysis = (monthsBack: number = 6) => {
  return useQuery({
    queryKey: queryKeys.analytics.cohorts(monthsBack),
    queryFn: () => adminService.getCohortAnalysis(monthsBack),
    staleTime: STALE_TIME,
  });
};

export const useRetentionAnalysis = () => {
  const [range, setRange] = useState<RetentionRange>('90d');

  const query = useQuery({
    queryKey: queryKeys.analytics.retention(range),
    queryFn: () => adminService.getRetentionAnalysis(range),
    staleTime: STALE_TIME,
  });

  return { ...query, range, setRange };
};

export const useCustomerLTV = () => {
  const [segmentBy, setSegmentBy] = useState<LTVSegment>('cohort');

  const query = useQuery({
    queryKey: queryKeys.analytics.ltv(segmentBy),
    queryFn: () => adminService.getCustomerLTV(segmentBy),
    staleTime: STALE_TIME,
  });

  return { ...query, segmentBy, setSegmentBy };
};

export const useNoShowAnalysis = () => {
  const [range, setRange] = useState<NoShowRange>('monthly');

  const query = useQuery({
    queryKey: queryKeys.analytics.noShows(range),
    queryFn: () => adminService.getNoShowAnalysis(range),
    staleTime: STALE_TIME,
  });

  return { ...query, range, setRange };
};

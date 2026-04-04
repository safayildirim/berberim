import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { adminService } from '@/src/services/admin.service';

export type TimeRange = 'daily' | 'weekly' | 'monthly';

export const useAnalytics = () => {
  const [range, setRange] = useState<TimeRange>('monthly');

  const { data, isLoading, error } = useQuery({
    queryKey: ['analytics', range],
    queryFn: () => adminService.getAnalyticsOverview(range),
  });

  return {
    range,
    setRange,
    isLoading,
    error,
    metrics: {
      totalAppointments: data?.total_appointments ?? 0,
      completed: data?.completed_appointments ?? 0,
      cancelled: data?.cancelled_appointments ?? 0,
      noShowRate: data?.no_show_rate != null ? `${data.no_show_rate}%` : '0%',
      noShowRateChange: data?.no_show_rate_change ?? '0%',
      revenue: data?.total_revenue ?? '0',
      appointmentsChange: data?.appointments_change ?? '0%',
    },
    shopStatus: {
      chairsActive: 0,
      waitlist: 0,
    },
    customerInsights: {
      activeCustomers: data?.active_customers ?? 0,
      returningRate: data?.returning_rate ?? 0,
      visitFrequency: data?.visit_frequency ?? 0,
    },
    operationalPerformance: {
      staffUtilization: data?.staff_utilization ?? 0,
      popularServices: (data?.popular_services ?? []).map((s) => ({
        name: s.name,
        count: s.count,
        progress: s.progress,
      })),
    },
    loyaltyEngagement: {
      rewardsRedeemed: data?.rewards_redeemed ?? 0,
      redeemedChange: data?.redeemed_change ?? '0%',
      progress: data?.loyalty_progress ?? 0,
    },
  };
};

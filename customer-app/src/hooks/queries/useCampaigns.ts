import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/lib/api/client';
import { queryKeys } from '@/src/lib/query/keys';
import { Campaign, AppNotification } from '@/src/types';

export const useCampaigns = () => {
  return useQuery({
    queryKey: queryKeys.campaigns.all, // need to add this key or use list
    queryFn: async (): Promise<Campaign[]> => {
      // Endpoint might not exist yet, but for architecture's sake:
      const response = await api.get<{ campaigns: Campaign[] }>(
        '/public/campaigns',
      );
      return response.campaigns || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

export const useNotifications = () => {
  return useQuery({
    queryKey: queryKeys.customer.notifications,
    queryFn: async (): Promise<AppNotification[]> => {
      const response = await api.get<{ notifications: AppNotification[] }>(
        '/customer/notifications',
      );
      return response.notifications || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCampaignDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.campaigns.detail(id),
    queryFn: async (): Promise<Campaign> => {
      const response = await api.get<{ campaign: Campaign }>(
        `/public/campaigns/${id}`,
      );
      return response.campaign;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
};

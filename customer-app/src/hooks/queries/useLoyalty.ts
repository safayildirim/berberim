import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/lib/api/client';
import { queryKeys } from '@/src/lib/query/keys';
import { LoyaltyTransaction, LoyaltyWallet, Reward } from '@/src/types';

export const useLoyaltyWallet = () => {
  return useQuery({
    queryKey: queryKeys.loyalty.wallet,
    queryFn: async (): Promise<LoyaltyWallet> => {
      return api.get('/customer/loyalty/balance');
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useLoyaltyTransactions = () => {
  return useQuery({
    queryKey: queryKeys.loyalty.transactions,
    queryFn: async (): Promise<LoyaltyTransaction[]> => {
      const response = await api.get<{ transactions: LoyaltyTransaction[] }>(
        '/customer/loyalty/transactions',
      );
      return response.transactions || [];
    },
    staleTime: 1000 * 60 * 5,
  });
};

export const useRewards = () => {
  return useQuery({
    queryKey: queryKeys.loyalty.rewards,
    queryFn: async (): Promise<Reward[]> => {
      const response = await api.get<{ rewards: Reward[] }>(
        '/customer/loyalty/rewards',
      );
      return response.rewards || [];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
};

import { api } from '@/src/lib/api/client';
import { CustomerProfile } from '@/src/types';

export const profileService = {
  updateProfile: async (
    updates: Partial<CustomerProfile['profile']>,
  ): Promise<CustomerProfile> => {
    return api.patch<CustomerProfile>('/customer/me', updates);
  },
};

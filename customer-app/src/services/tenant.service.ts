import { api } from '@/src/lib/api/client';
import { TenantConfig } from '@/src/types';

export const tenantService = {
  getBootstrapConfig: async (tenantIdOrSlug: string): Promise<TenantConfig> => {
    return api.get(`/public/tenants/${tenantIdOrSlug}/bootstrap`);
  },
};

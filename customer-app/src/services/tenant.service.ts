import { api } from '@/src/lib/api/client';
import { TenantConfig, TenantMembership } from '@/src/types';

export const tenantService = {
  getBootstrapConfig: async (tenantIdOrSlug: string): Promise<TenantConfig> => {
    return api.get(`/public/tenants/${tenantIdOrSlug}/bootstrap`);
  },

  listMyTenants: async (): Promise<TenantMembership[]> => {
    return api
      .get<{ tenants: TenantMembership[] }>('/customer/tenants')
      .then((res: any) => res.tenants || []);
  },

  claimLinkCode: async (code: string): Promise<TenantMembership> => {
    return api
      .post<{ membership: TenantMembership }>('/customer/tenants/link', {
        code,
      })
      .then((res: any) => res.membership);
  },
};

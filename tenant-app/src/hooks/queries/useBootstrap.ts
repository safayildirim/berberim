import { useQuery } from '@tanstack/react-query';
import { tokenStorage } from '@/src/lib/auth/token-storage';
import { authService } from '@/src/services/auth.service';
import { tenantService } from '@/src/services/tenant.service';
import { useSessionStore } from '@/src/store/useSessionStore';
import { useTenantStore } from '@/src/store/useTenantStore';

const DEFAULT_TENANT_ID = 'a1000000-0000-0000-0000-000000000001'; // This should eventually come from app config or a mapping

export const useBootstrap = () => {
  const bootstrap = useSessionStore((state) => state.bootstrap);
  const setTenantConfig = useTenantStore((state) => state.setConfig);

  return useQuery({
    queryKey: ['bootstrap'],
    queryFn: async () => {
      // 1. Get Tenant Config
      const tenant = await tenantService.getBootstrapConfig(DEFAULT_TENANT_ID);
      console.log('tenant', tenant);
      setTenantConfig(tenant);

      // 2. Persist tenant ID for API headers
      if (tenant?.id) {
        await tokenStorage.setTenantId(tenant.id);
      }

      // 3. Check for existing session
      const token = await tokenStorage.getAccessToken();
      let user = null;

      if (token) {
        try {
          user = await authService.me();
        } catch {
          await tokenStorage.clearAll();
        }
      }

      // 4. Initialize Auth store
      bootstrap(tenant, user);

      return { tenant, user };
    },
    staleTime: Infinity,
  });
};

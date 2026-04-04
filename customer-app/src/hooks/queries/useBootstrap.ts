import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/src/lib/auth/session-store';
import { tokenStorage } from '@/src/lib/auth/token-storage';
import { authService } from '@/src/services/auth.service';
import { tenantService } from '@/src/services/tenant.service';
import { useTenantStore } from '@/src/store/useTenantStore';

const DEFAULT_TENANT_ID = 'a1000000-0000-0000-0000-000000000001'; // Should come from environmental variable

export const useBootstrap = () => {
  const bootstrap = useSessionStore((state) => state.bootstrap);
  const setTenantConfig = useTenantStore((state) => state.setConfig);

  return useQuery({
    queryKey: ['bootstrap'],
    queryFn: async () => {
      // 1. Get Tenant Slug (could be from app config/constants)
      const slug = DEFAULT_TENANT_ID;

      // 2. Load Tenant Config
      const tenant = await tenantService.getBootstrapConfig(slug);

      // 3. Update Tenant Store with branding/contact info
      setTenantConfig(tenant);

      // 4. Persist tenant ID for API headers
      if (tenant?.id) {
        await tokenStorage.setTenantId(String(tenant.id));
      }

      // 4. Check for existing session
      const token = await tokenStorage.getAccessToken();
      let user = null;

      if (token) {
        try {
          // If we have a token, attempt to fetch user info
          user = await authService.me();
        } catch {
          // Token might be invalid or expired, clear it
          await tokenStorage.clearAll();
        }
      }

      // 5. Initialize Zustand store
      bootstrap(tenant, user);

      return { tenant, user };
    },
    staleTime: Infinity, // Bootstrap config rarely changes within a session
  });
};

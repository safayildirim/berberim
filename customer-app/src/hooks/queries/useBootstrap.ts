import { useQuery } from '@tanstack/react-query';
import { useSessionStore } from '@/src/lib/auth/session-store';
import { tokenStorage } from '@/src/lib/auth/token-storage';
import { authService } from '@/src/services/auth.service';
import { tenantService } from '@/src/services/tenant.service';
import { useTenantStore } from '@/src/store/useTenantStore';
import { TenantMembership } from '@/src/types';

export const useBootstrap = () => {
  const setTenants = useSessionStore((state) => state.setTenants);
  const setActiveTenant = useSessionStore((state) => state.setActiveTenant);
  const setTenantConfig = useTenantStore((state) => state.setConfig);
  const bootstrap = useSessionStore((state) => state.bootstrap);

  return useQuery({
    queryKey: ['bootstrap'],
    queryFn: async () => {
      // 1. Check for existing session
      const token = await tokenStorage.getAccessToken();
      let user = null;
      let tenants: TenantMembership[] = [];

      if (token) {
        try {
          user = await authService.me();
        } catch {
          await tokenStorage.clearAll();
        }
      }

      // 2. If authenticated, load tenants BEFORE calling bootstrap
      //    so the store is fully populated when navigation reads it.
      if (user) {
        try {
          tenants = await tenantService.listMyTenants();
          setTenants(tenants);

          // Restore previously active tenant, or auto-select if only one
          const savedTenantId = await tokenStorage.getActiveTenantId();
          const targetTenantId =
            savedTenantId && tenants.some((t) => t.tenant_id === savedTenantId)
              ? savedTenantId
              : tenants.length === 1
                ? tenants[0].tenant_id
                : null;

          if (targetTenantId) {
            const config =
              await tenantService.getBootstrapConfig(targetTenantId);
            setTenantConfig(config);
            await setActiveTenant(targetTenantId, config);
          }
        } catch {
          // Tenant loading failure is non-fatal — user can still link tenants
        }
      }

      // 3. Now mark bootstrapped — tenants and active tenant are already set
      bootstrap(user);

      return { user };
    },
    staleTime: Infinity,
  });
};

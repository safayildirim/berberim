import { create } from 'zustand';
import { CustomerProfile, TenantConfig, TenantMembership } from '@/src/types';
import { tokenStorage } from '@/src/lib/auth/token-storage';

interface SessionState {
  isAuthenticated: boolean;
  isBootstrapped: boolean;
  user: CustomerProfile | null;
  loading: boolean;
  error: string | null;

  // Multi-tenant state
  tenants: TenantMembership[];
  activeTenantId: string | null;
  activeTenantConfig: TenantConfig | null;

  // Actions
  setSession: (
    user: CustomerProfile,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  updateUser: (user: Partial<CustomerProfile>) => void;
  setTenants: (tenants: TenantMembership[]) => void;
  setActiveTenant: (tenantId: string, config: TenantConfig) => Promise<void>;
  clearActiveTenant: () => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  bootstrap: (user?: CustomerProfile | null) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  isAuthenticated: false,
  isBootstrapped: false,
  user: null,
  loading: true,
  error: null,
  tenants: [],
  activeTenantId: null,
  activeTenantConfig: null,

  setSession: async (user, accessToken, refreshToken) => {
    await tokenStorage.setAccessToken(accessToken);
    await tokenStorage.setRefreshToken(refreshToken);
    set({ isAuthenticated: true, user });
  },

  updateUser: (userUpdates) => {
    const currentUser = get().user;
    if (currentUser) {
      set({ user: { ...currentUser, ...userUpdates } });
    }
  },

  setTenants: (tenants) => {
    set({ tenants });
  },

  setActiveTenant: async (tenantId, config) => {
    await tokenStorage.setActiveTenantId(tenantId);
    set({ activeTenantId: tenantId, activeTenantConfig: config });
  },

  clearActiveTenant: async () => {
    await tokenStorage.clearActiveTenantId();
    set({ activeTenantId: null, activeTenantConfig: null });
  },

  bootstrap: (user = null) => {
    set({
      user,
      isAuthenticated: !!user,
      isBootstrapped: true,
      loading: false,
    });
  },

  logout: async () => {
    await tokenStorage.clearAll();
    set({
      isAuthenticated: false,
      user: null,
      tenants: [],
      activeTenantId: null,
      activeTenantConfig: null,
    });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

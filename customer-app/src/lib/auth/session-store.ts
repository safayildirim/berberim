import { create } from 'zustand';
import { CustomerProfile, TenantConfig } from '@/src/types';
import { tokenStorage } from '@/src/lib/auth/token-storage';

interface SessionState {
  isAuthenticated: boolean;
  isBootstrapped: boolean;
  user: CustomerProfile | null;
  tenant: TenantConfig | null;
  loading: boolean;
  error: string | null;

  // Actions
  setSession: (
    user: CustomerProfile,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  updateUser: (user: Partial<CustomerProfile>) => void;
  setTenant: (tenant: TenantConfig) => Promise<void>;
  logout: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  bootstrap: (tenant: TenantConfig, user?: CustomerProfile | null) => void;
}

export const useSessionStore = create<SessionState>((set, get) => ({
  isAuthenticated: false,
  isBootstrapped: false,
  user: null,
  tenant: null,
  loading: true,
  error: null,

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

  setTenant: async (tenant) => {
    await tokenStorage.setTenantId(tenant.id);
    set({ tenant, isBootstrapped: true });
  },

  bootstrap: (tenant, user = null) => {
    set({
      tenant,
      user,
      isAuthenticated: !!user,
      isBootstrapped: true,
      loading: false,
    });
  },

  logout: async () => {
    await tokenStorage.clearAll();
    set({ isAuthenticated: false, user: null });
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
}));

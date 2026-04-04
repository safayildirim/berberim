import { create } from 'zustand';
import { tokenStorage } from '../lib/auth/token-storage';
import { TenantConfig, User } from '../types';

interface AuthState {
  isAuthenticated: boolean;
  isBootstrapped: boolean;
  user: User | null;
  tenant: TenantConfig | null;
  setUser: (user: User | null) => void;
  setTenant: (tenant: TenantConfig | null) => void;
  setSession: (
    user: User,
    accessToken: string,
    refreshToken: string,
  ) => Promise<void>;
  bootstrap: (tenant: TenantConfig | null, user: User | null) => void;
  logout: () => Promise<void>;
  isAdmin: () => boolean;
}

export const useSessionStore = create<AuthState>((set, get) => ({
  isAuthenticated: false,
  isBootstrapped: false,
  user: null,
  tenant: null,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setTenant: (tenant) => set({ tenant }),
  setSession: async (user, accessToken, refreshToken) => {
    await tokenStorage.setAccessToken(accessToken);
    await tokenStorage.setRefreshToken(refreshToken);
    set({ user, isAuthenticated: true });
  },
  bootstrap: (tenant, user) =>
    set({
      tenant,
      user,
      isBootstrapped: true,
      isAuthenticated: !!user,
    }),
  logout: async () => {
    await tokenStorage.clearAll();
    set({ user: null, isAuthenticated: false });
  },
  isAdmin: () => get().user?.role === 'admin',
}));

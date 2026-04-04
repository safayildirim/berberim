import { create } from 'zustand';
import { COLORS } from '@/src/constants/theme';
import { TenantConfig } from '@/src/types';

interface TenantState {
  config: TenantConfig | null;
  isLoading: boolean;
  error: Error | null;
  setConfig: (config: TenantConfig) => void;
  getBranding: () => {
    name: string;
    primaryColor: string;
    secondaryColor: string;
    tertiaryColor: string;
    logoUrl: string;
  };
}

export const useTenantStore = create<TenantState>((set, get) => ({
  config: null,
  isLoading: true,
  error: null,
  setConfig: (config) => set({ config, isLoading: false }),
  getBranding: () => {
    const { config } = get();
    return {
      name: config?.name || 'Berberim',
      primaryColor: config?.branding?.primary_color || COLORS.primary,
      secondaryColor: config?.branding?.secondary_color || COLORS.secondary,
      tertiaryColor: config?.branding?.tertiary_color || COLORS.tertiary,
      logoUrl: config?.branding?.logo_url || '',
    };
  },
}));

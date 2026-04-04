import { create } from 'zustand';
import { COLORS } from '../constants/theme';
import { TenantConfig } from '../types';

interface TenantState {
  config: TenantConfig | null;
  isLoading: boolean;
  error: Error | null;
  setConfig: (config: TenantConfig) => void;
  getBranding: () => {
    id: string;
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
      id: config?.id || '',
      name: config?.name || 'The Master Barber',
      primaryColor: config?.branding?.primary_color || COLORS.primary,
      secondaryColor: config?.branding?.secondary_color || COLORS.secondary,
      tertiaryColor: config?.branding?.tertiary_color || COLORS.tertiary,
      logoUrl: config?.branding?.logo_url || '',
    };
  },
}));

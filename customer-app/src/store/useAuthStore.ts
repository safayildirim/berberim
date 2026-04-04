import { create } from 'zustand';
import { CustomerProfile } from '@/src/types';

interface AuthState {
  user: CustomerProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: CustomerProfile) => void;
  logout: () => void;
  updateUser: (user: Partial<CustomerProfile>) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
  updateUser: (partialUser) =>
    set((state) => ({
      user: state.user ? { ...state.user, ...partialUser } : null,
    })),
}));

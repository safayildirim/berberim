import React, { createContext, useContext, useEffect } from 'react';
import { View } from 'react-native';
import { useSessionStore } from '@/src/lib/auth/session-store';
import { syncPushDeviceRegistration } from '@/src/lib/device/push-registration';
import { useBootstrap } from '@/src/hooks/queries/useBootstrap';
import { authService } from '@/src/services/auth.service';
import * as SplashScreen from 'expo-splash-screen';

// Prevent splash screen from hiding until bootstrapped
SplashScreen.preventAutoHideAsync();

interface AuthContextType {
  initialized: boolean;
  isLoggedIn: boolean;
  user: any;
  activeTenantId: string | null;
  hasTenants: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoading, isError } = useBootstrap();
  const { isAuthenticated, user, isBootstrapped, tenants, activeTenantId } =
    useSessionStore();

  useEffect(() => {
    if ((!isLoading && isBootstrapped) || isError) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, isBootstrapped, isError]);

  useEffect(() => {
    if (!isAuthenticated || !user?.profile?.id) {
      return;
    }

    syncPushDeviceRegistration({
      registerPushDevice: authService.registerPushDevice,
      deletePushDevice: authService.deletePushDevice,
    });
  }, [isAuthenticated, user?.profile?.id]);

  const value = {
    initialized: isBootstrapped,
    isLoggedIn: isAuthenticated,
    user,
    activeTenantId,
    hasTenants: tenants.length > 0,
  };

  if (isLoading && !isBootstrapped) {
    return <View style={{ flex: 1, backgroundColor: '#ffffff' }} />;
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

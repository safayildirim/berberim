import * as SplashScreen from 'expo-splash-screen';
import React, { createContext, useContext, useEffect } from 'react';
import { useBootstrap } from '../hooks/queries/useBootstrap';
import { syncPushDeviceRegistration } from '../lib/device/push-registration';
import { authService } from '../services/auth.service';
import { useSessionStore } from '../store/useSessionStore';

// Prevent splash screen from hiding until bootstrapped
SplashScreen.preventAutoHideAsync();

interface AuthContextType {
  initialized: boolean;
  isLoggedIn: boolean;
  user: any;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { isLoading, isError } = useBootstrap();
  const { user, isBootstrapped } = useSessionStore();

  useEffect(() => {
    if (!isLoading || isError) {
      SplashScreen.hideAsync();
    }
  }, [isLoading, isError]);

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    syncPushDeviceRegistration({
      registerPushDevice: authService.registerPushDevice,
      deletePushDevice: authService.deletePushDevice,
    });
  }, [user?.id]);

  const value = {
    initialized: isBootstrapped,
    isLoggedIn: !!user,
    user,
  };

  if (isLoading && !isBootstrapped) {
    return null; // Keep splash screen visible
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};

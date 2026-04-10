import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/src/lib/auth/session-store';
import { unregisterPushDevice } from '@/src/lib/device/push-registration';
import { tokenStorage } from '@/src/lib/auth/token-storage';
import { queryKeys } from '@/src/lib/query/keys';
import {
  authService,
  OtpRequest,
  OtpVerifyRequest,
} from '@/src/services/auth.service';
import { authLogger } from '@/src/lib/logger';

export const useRequestOtp = () => {
  return useMutation({
    mutationFn: (data: OtpRequest) => authService.requestOtp(data),
  });
};

export const useVerifyOtp = () => {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: (data: OtpVerifyRequest) => authService.verifyOtp(data),
    onSuccess: async (data) => {
      // 1. Store tokens first so authService.me() can use them
      await tokenStorage.setAccessToken(data.access_token);
      await tokenStorage.setRefreshToken(data.refresh_token);

      // 2. Fetch user data (includes tenant memberships)
      const user = await authService.me();

      // 3. Populate tenants so index.tsx redirect logic works
      const setTenants = useSessionStore.getState().setTenants;
      setTenants(user?.tenants ?? []);

      // 4. Update Zustand store (tokens already in SecureStore)
      await setSession(user, data.access_token, data.refresh_token);

      // Pre-seed query cache
      queryClient.setQueryData(queryKeys.auth.me, user);
      queryClient.invalidateQueries();
    },
    onError: (error) => {
      authLogger.error('OTP verification failed', error);
    },
  });
};

export const useCurrentCustomer = (options = {}) => {
  const isAuthenticated = useSessionStore((state) => state.isAuthenticated);

  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: () => authService.me(),
    enabled: isAuthenticated,
    staleTime: 1000 * 60 * 5, // 5 minutes
    ...options,
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  const logout = useSessionStore((state) => state.logout);

  return useMutation({
    mutationFn: async () => {
      await unregisterPushDevice({
        deletePushDevice: authService.deletePushDevice,
      });
      await authService.logout();
    },
    onSettled: async () => {
      await logout();
      queryClient.clear();
    },
  });
};

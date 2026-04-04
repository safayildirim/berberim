import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@/src/lib/auth/token-storage';
import { unregisterPushDevice } from '@/src/lib/device/push-registration';
import { queryKeys } from '@/src/lib/query/keys';
import { authService, LoginParams } from '@/src/services/auth.service';
import { useSessionStore } from '@/src/store/useSessionStore';

export const useLogin = () => {
  const queryClient = useQueryClient();
  const setSession = useSessionStore((state) => state.setSession);

  return useMutation({
    mutationFn: (params: LoginParams) => authService.login(params),
    onSuccess: async (data, variables) => {
      // 1. Store tokens first so authService.me() can use them (via axios interceptors)
      await tokenStorage.setAccessToken(data.access_token);
      await tokenStorage.setRefreshToken(data.refresh_token);

      // 2. Fetch authenticated user profile
      const user = await authService.me();

      // 3. Update Zustand store
      await setSession(user, data.access_token, data.refresh_token);

      // 4. Pre-seed/invalidate query cache
      queryClient.setQueryData(queryKeys.auth.me, user);
      queryClient.invalidateQueries();
    },
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

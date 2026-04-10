import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/src/lib/auth/session-store';
import { avatarService } from '@/src/services/avatar.service';
import { authService } from '@/src/services/auth.service';
import { profileService } from '@/src/services/profile.service';
import { CustomerProfile } from '@/src/types';
import { queryKeys } from '@/src/lib/query/keys';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useSessionStore();

  return useMutation({
    mutationFn: (updates: Partial<CustomerProfile['profile']>) =>
      profileService.updateProfile(updates),
    onSuccess: async () => {
      // Re-fetch full profile to get consistent state
      const fresh = await authService.me();
      updateUser(fresh);
      queryClient.setQueryData(queryKeys.auth.me, fresh);
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useSessionStore();

  return useMutation({
    mutationFn: (imageUri: string) => avatarService.upload(imageUri),
    onSuccess: async () => {
      // Re-fetch full profile so avatar_url is populated from backend
      const fresh = await authService.me();
      updateUser(fresh);
      queryClient.setQueryData(queryKeys.auth.me, fresh);
    },
  });
};

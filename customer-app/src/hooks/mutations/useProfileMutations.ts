import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/src/lib/auth/session-store';
import { avatarService } from '@/src/services/avatar.service';
import { profileService } from '@/src/services/profile.service';
import { CustomerProfile } from '@/src/types';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useSessionStore();

  return useMutation({
    mutationFn: (updates: Partial<CustomerProfile['profile']>) =>
      profileService.updateProfile(updates),
    onSuccess: (data) => {
      updateUser(data);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useSessionStore();

  return useMutation({
    mutationFn: (imageUri: string) => avatarService.upload(imageUri),
    onSuccess: (avatarUrl) => {
      updateUser({ profile: { avatar_url: avatarUrl } } as CustomerProfile);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

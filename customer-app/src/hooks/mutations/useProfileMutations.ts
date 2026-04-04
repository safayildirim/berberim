import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useSessionStore } from '@/src/lib/auth/session-store';
import { profileService } from '@/src/services/profile.service';
import { CustomerProfile } from '@/src/types';

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  const { updateUser } = useSessionStore();

  return useMutation({
    mutationFn: (updates: Partial<CustomerProfile['profile']>) =>
      profileService.updateProfile(updates),
    onSuccess: (data) => {
      // Sync local state in session store
      updateUser(data);
      // Invalidate relevant queries (if any)
      queryClient.invalidateQueries({ queryKey: ['profile'] });
    },
  });
};

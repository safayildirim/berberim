import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/query/keys';
import { tenantService } from '@/src/services/tenant.service';
import { AvailabilitySettings } from '@/src/types';

export function useAvailabilitySettings() {
  return useQuery({
    queryKey: queryKeys.availabilitySettings.detail(),
    queryFn: tenantService.getAvailabilitySettings,
  });
}

export function useUpdateAvailabilitySettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: AvailabilitySettings) =>
      tenantService.updateAvailabilitySettings(data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.availabilitySettings.detail(),
      });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
}

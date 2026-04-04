import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateServiceRequest,
  tenantService,
} from '@/src/services/tenant.service';
import { queryKeys } from '../queries/useServices';

export function useCreateService() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateServiceRequest) =>
      tenantService.createService(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.services.all });
    },
  });
}

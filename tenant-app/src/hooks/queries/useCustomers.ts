import { useQuery } from '@tanstack/react-query';
import { tenantService } from '@/src/services/tenant.service';

export const useCustomers = (params?: { search?: string }) => {
  return useQuery({
    queryKey: ['customers', params],
    queryFn: () => tenantService.listCustomers(params),
  });
};

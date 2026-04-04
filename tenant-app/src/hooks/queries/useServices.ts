import { useQuery } from '@tanstack/react-query';
import { tenantService } from '@/src/services/tenant.service';

export const queryKeys = {
  services: {
    all: ['services'] as const,
    list: (params?: any) =>
      [...queryKeys.services.all, 'list', params] as const,
    detail: (id: string) => [...queryKeys.services.all, 'detail', id] as const,
  },
};

export function useServices(params?: { is_active?: boolean }) {
  return useQuery({
    queryKey: queryKeys.services.list(params),
    queryFn: () => tenantService.listServices(params),
  });
}

export function useService(id: string) {
  return useQuery({
    queryKey: queryKeys.services.detail(id),
    queryFn: () => tenantService.getService(id),
    enabled: !!id,
  });
}

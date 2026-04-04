import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/lib/api/client';
import { Service, Staff } from '@/src/types';
import { queryKeys } from '@/src/lib/query/keys';

export const useServices = (category?: string) => {
  return useQuery({
    queryKey: queryKeys.services.list(category),
    queryFn: async (): Promise<Service[]> => {
      // In a real app, this should probably be in a service file but for briefity:
      const response = await api.get<{ services: Service[] }>(
        '/public/services',
        {
          params: { category },
        },
      );
      return response.services || [];
    },
    staleTime: 1000 * 60 * 60, // Services list is very stable (1 hr)
  });
};

export const useStaff = (tenantId?: string) => {
  return useQuery({
    queryKey: queryKeys.staff.list,
    queryFn: async (): Promise<Staff[]> => {
      const response = await api.get<{ staff: Staff[] }>('/public/staff', {
        params: { tenant_id: tenantId },
      });
      return response.staff || [];
    },
    staleTime: 1000 * 60 * 60, // Staff list is stable
  });
};

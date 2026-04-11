import { useQuery } from '@tanstack/react-query';
import { api } from '@/src/lib/api/client';
import { Service, Staff } from '@/src/types';
import { queryKeys } from '@/src/lib/query/keys';

export const useServices = (category?: string, enabled = true) => {
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
    enabled,
  });
};

export const useStaffServices = (staffId?: string | null, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.services.staff(staffId || 'none'),
    queryFn: async (): Promise<Service[]> => {
      const response = await api.get<{ services: Service[] }>(
        `/public/staff/${staffId}/services`,
      );
      return response.services || [];
    },
    staleTime: 1000 * 60 * 60,
    enabled: enabled && !!staffId,
  });
};

export const useStaff = (tenantId?: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.staff.list(tenantId),
    queryFn: async (): Promise<Staff[]> => {
      const response = await api.get<{ staff: Staff[] }>('/public/staff', {
        params: { tenant_id: tenantId },
      });
      return response.staff || [];
    },
    staleTime: 1000 * 60 * 60, // Staff list is stable
    enabled: enabled && !!tenantId,
  });
};

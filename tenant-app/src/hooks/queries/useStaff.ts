import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/query/keys';
import { staffService } from '@/src/services/staff.service';
import { UserRole } from '@/src/types';

export const staffKeys = {
  all: ['staff'] as const,
  lists: () => [...staffKeys.all, 'list'] as const,
  list: (role?: UserRole) => [...staffKeys.lists(), { role }] as const,
  details: () => [...staffKeys.all, 'detail'] as const,
  detail: (id: string) => [...staffKeys.details(), id] as const,
};

export function useStaff(params?: { role?: UserRole }) {
  return useQuery({
    queryKey: staffKeys.list(params?.role),
    queryFn: () => staffService.list(params),
  });
}

export function useStaffDetail(id: string) {
  return useQuery({
    queryKey: staffKeys.detail(id),
    queryFn: () => staffService.detail(id),
    enabled: !!id,
  });
}

export function useStaffSchedule(staffId: string) {
  return useQuery({
    queryKey: [...staffKeys.all, staffId, 'schedule'],
    queryFn: () => staffService.getSchedule(staffId),
    enabled: !!staffId,
  });
}

export function useStaffTimeOff(staffId: string) {
  return useQuery({
    queryKey: [...staffKeys.all, staffId, 'timeOff'],
    queryFn: () => staffService.getTimeOff(staffId),
    enabled: !!staffId,
  });
}

export function useStaffReviews(staffId: string, page: number = 1) {
  return useQuery({
    queryKey: queryKeys.staff.reviews(staffId, page),
    queryFn: () => staffService.listReviews(staffId, { page }),
    enabled: !!staffId,
  });
}

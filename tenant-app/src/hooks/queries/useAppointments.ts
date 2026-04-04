import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/query/keys';
import { tenantService } from '@/src/services/tenant.service';
import { AppointmentStatus } from '@/src/types';

export const useAppointments = (params: {
  status?: AppointmentStatus;
  date?: string;
  staff_id?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.appointments.list(params.status, params.date),
    queryFn: () => tenantService.listAppointments(params),
    staleTime: 1000 * 60, // 1 minute
  });
};

export const useAppointmentDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => tenantService.getAppointment(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

export const useCustomerAppointments = (customerId: string) => {
  return useQuery({
    queryKey: queryKeys.appointments.customer(customerId),
    queryFn: () => tenantService.getCustomerAppointments(customerId),
    enabled: !!customerId,
  });
};

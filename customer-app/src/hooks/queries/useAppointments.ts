import { useQuery } from '@tanstack/react-query';
import { appointmentService } from '@/src/services/appointment.service';
import { queryKeys } from '@/src/lib/query/keys';
import { AppointmentStatus } from '@/src/types';

export const useAppointments = (status?: AppointmentStatus) => {
  return useQuery({
    queryKey: queryKeys.appointments.list(status),
    queryFn: () => appointmentService.list(status),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useBookingLimitStatus = () => {
  return useQuery({
    queryKey: queryKeys.appointments.bookingLimit,
    queryFn: () => appointmentService.getBookingLimitStatus(),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });
};

export const useAppointmentDetail = (id: string) => {
  return useQuery({
    queryKey: queryKeys.appointments.detail(id),
    queryFn: () => appointmentService.detail(id),
    enabled: !!id,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

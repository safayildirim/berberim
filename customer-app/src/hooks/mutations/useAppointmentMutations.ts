import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  appointmentService,
  CreateAppointmentRequest,
} from '@/src/services/appointment.service';
import { queryKeys } from '@/src/lib/query/keys';
import { useBookingStore } from '@/src/store/useBookingStore';

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  const resetBooking = useBookingStore((state) => state.reset); // Local booking state reset

  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) =>
      appointmentService.create(data),
    onSuccess: () => {
      resetBooking();

      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.all,
      });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => appointmentService.cancel(id),
    onSuccess: (_, id) => {
      // Invalidate appointments list
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      // Invalidate the detail query for this specific appointment
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(id),
      });
      // Re-search availability on that day
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.all,
      });
    },
  });
};

export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, starts_at }: { id: string; starts_at: string }) =>
      appointmentService.reschedule(id, starts_at),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.appointments.all });
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(id),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.availability.all,
      });
    },
  });
};

export const useRebookAppointment = () => {
  const setBookingFromExisting = useBookingStore(
    (state) => state.setFromExisting,
  ); // Function to seed local state

  return useMutation({
    mutationFn: async (appointmentId: string) => {
      const existing = await appointmentService.detail(appointmentId);
      // Seed the local store with existing appointment details
      setBookingFromExisting(existing);
      return existing;
    },
    // No direct API call here if rebooking is a multi-step UI flow (it usually is)
    // The actual "booking" will happen through useCreateAppointment after refinement
  });
};

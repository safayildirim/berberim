import { useMutation, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/lib/query/keys';
import {
  CreateAppointmentRequest,
  tenantService,
  UpdateAppointmentRequest,
} from '@/src/services/tenant.service';

export const useCreateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAppointmentRequest) =>
      tenantService.createAppointment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useUpdateAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: UpdateAppointmentRequest;
    }) => tenantService.updateAppointment(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useRescheduleAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      new_starts_at,
    }: {
      id: string;
      new_starts_at: string;
    }) => tenantService.rescheduleAppointment(id, new_starts_at),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useMarkCompleted = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantService.markCompleted(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useMarkPaymentReceived = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantService.markPaymentReceived(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useMarkNoShow = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantService.markNoShow(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tenantService.cancelAppointment(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(id),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });
};

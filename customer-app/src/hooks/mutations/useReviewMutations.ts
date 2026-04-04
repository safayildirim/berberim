import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  reviewService,
  CreateReviewRequest,
  UpdateReviewRequest,
} from '@/src/services/review.service';
import { queryKeys } from '@/src/lib/query/keys';

export const useCreateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateReviewRequest) => reviewService.create(data),
    onSuccess: (_, variables) => {
      // Invalidate appointment detail since it might now have a review
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(variables.appointment_id),
      });
      // Invalidate the review query for this appointment
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.forAppointment(variables.appointment_id),
      });
    },
  });
};

export const useUpdateReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateReviewRequest }) =>
      reviewService.update(id, data),
    onSuccess: (data) => {
      // Invalidate the review query for this appointment
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.forAppointment(data.appointment_id),
      });
    },
  });
};

export const useDeleteReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      appointmentId,
    }: {
      id: string;
      appointmentId: string;
    }) => reviewService.remove(id),
    onSuccess: (_, { appointmentId }) => {
      // Invalidate appointment detail
      queryClient.invalidateQueries({
        queryKey: queryKeys.appointments.detail(appointmentId),
      });
      // Invalidate the review query for this appointment
      queryClient.invalidateQueries({
        queryKey: queryKeys.reviews.forAppointment(appointmentId),
      });
    },
  });
};

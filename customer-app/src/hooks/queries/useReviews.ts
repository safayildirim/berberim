import { useQuery } from '@tanstack/react-query';
import { reviewService } from '@/src/services/review.service';
import { queryKeys } from '@/src/lib/query/keys';

export const useMyReview = (appointmentId: string) => {
  return useQuery({
    queryKey: queryKeys.reviews.forAppointment(appointmentId),
    queryFn: () => reviewService.getForAppointment(appointmentId),
    enabled: !!appointmentId,
  });
};

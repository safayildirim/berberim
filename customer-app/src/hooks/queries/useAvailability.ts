import { useQuery } from '@tanstack/react-query';
import {
  appointmentService,
  AvailabilitySearchRequest,
} from '@/src/services/appointment.service';
import { queryKeys } from '@/src/lib/query/keys';

export const useAvailabilitySearch = (params: AvailabilitySearchRequest) => {
  return useQuery({
    queryKey: queryKeys.availability.search(params),
    queryFn: () => appointmentService.searchAvailability(params),
    enabled: !!params.date && params.service_ids.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes (it's volatile)
  });
};

export const useAvailableDays = (params: any) => {
  return useQuery({
    queryKey: queryKeys.availability.days(params),
    queryFn: () => appointmentService.getAvailableDays(params),
    enabled: !!params.from && !!params.to && params.service_ids.length > 0,
    staleTime: 1000 * 60 * 60, // 1 hour (daily availability list stable)
  });
};

export const useSlotRecommendations = (params: {
  service_ids: string[];
  staff_user_id?: string;
}) => {
  return useQuery({
    queryKey: queryKeys.availability.recommendations(params),
    queryFn: () => appointmentService.getSlotRecommendations(params),
    enabled: params.service_ids.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes (volatile)
  });
};

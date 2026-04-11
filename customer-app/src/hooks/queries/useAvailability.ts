import { useQuery } from '@tanstack/react-query';
import {
  appointmentService,
  MultiDayAvailabilityRequest,
} from '@/src/services/appointment.service';
import { queryKeys } from '@/src/lib/query/keys';

export const useMultiDayAvailability = (
  params: MultiDayAvailabilityRequest,
) => {
  return useQuery({
    queryKey: queryKeys.availability.multiDay({
      tenantId: params.tenant_id,
      serviceIds: params.service_ids,
      staffUserId: params.staff_user_id,
      fromDate: params.from_date,
      toDate: params.to_date,
    }),
    queryFn: () => appointmentService.searchAvailability(params),
    enabled:
      !!params.tenant_id &&
      !!params.from_date &&
      !!params.to_date &&
      params.service_ids.length > 0,
    staleTime: 1000 * 60 * 2, // 2 minutes (it's volatile)
    placeholderData: (previousData) => previousData,
  });
};

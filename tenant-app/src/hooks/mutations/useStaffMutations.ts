import { useMutation, useQueryClient } from '@tanstack/react-query';
import { staffService } from '@/src/services/staff.service';
import { TimeOff } from '@/src/types';
import { staffKeys } from '@/src/hooks/queries/useStaff';

export function useStaffMutations() {
  const queryClient = useQueryClient();

  const addTimeOffMutation = useMutation({
    mutationFn: ({
      staffId,
      data,
    }: {
      staffId: string;
      data: Omit<TimeOff, 'id'>;
    }) => staffService.addTimeOff(staffId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({
        queryKey: [...staffKeys.all, staffId, 'timeOff'],
      });
      // Also invalidate appointments for that day since timeoff might affect it
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const removeTimeOffMutation = useMutation({
    mutationFn: ({
      staffId,
      timeOffId,
    }: {
      staffId: string;
      timeOffId: string;
    }) => staffService.removeTimeOff(staffId, timeOffId),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({
        queryKey: [...staffKeys.all, staffId, 'timeOff'],
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  return {
    addTimeOff: addTimeOffMutation,
    removeTimeOff: removeTimeOffMutation,
  };
}

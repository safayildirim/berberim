import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CreateScheduleBreakRequest,
  staffService,
  UpdateScheduleBreakRequest,
} from '@/src/services/staff.service';
import { ScheduleRule, TimeOff } from '@/src/types';
import { queryKeys } from '@/src/lib/query/keys';

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
        queryKey: queryKeys.staff.timeOff(staffId),
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
        queryKey: queryKeys.staff.timeOff(staffId),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
    },
  });

  const createScheduleBreakMutation = useMutation({
    mutationFn: ({
      staffId,
      data,
    }: {
      staffId: string;
      data: CreateScheduleBreakRequest;
    }) => staffService.createScheduleBreak(staffId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.scheduleBreaks(staffId),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  const updateScheduleBreakMutation = useMutation({
    mutationFn: ({
      staffId,
      breakId,
      data,
    }: {
      staffId: string;
      breakId: string;
      data: UpdateScheduleBreakRequest;
    }) => staffService.updateScheduleBreak(staffId, breakId, data),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.scheduleBreaks(staffId),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  const deleteScheduleBreakMutation = useMutation({
    mutationFn: ({ staffId, breakId }: { staffId: string; breakId: string }) =>
      staffService.deleteScheduleBreak(staffId, breakId),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.scheduleBreaks(staffId),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  const updateScheduleRuleMutation = useMutation({
    mutationFn: ({ staffId, rule }: { staffId: string; rule: ScheduleRule }) =>
      staffService.updateScheduleRule(staffId, rule.id, {
        start_time: rule.start_time,
        end_time: rule.end_time,
        slot_interval_minutes: rule.slot_interval_minutes,
        is_working_day: rule.is_working_day,
      }),
    onSuccess: (_, { staffId }) => {
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.schedule(staffId),
      });
      queryClient.invalidateQueries({
        queryKey: queryKeys.staff.scheduleBreaks(staffId),
      });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });

  return {
    addTimeOff: addTimeOffMutation,
    removeTimeOff: removeTimeOffMutation,
    createScheduleBreak: createScheduleBreakMutation,
    updateScheduleBreak: updateScheduleBreakMutation,
    deleteScheduleBreak: deleteScheduleBreakMutation,
    updateScheduleRule: updateScheduleRuleMutation,
  };
}

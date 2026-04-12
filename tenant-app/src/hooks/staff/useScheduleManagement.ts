import { useMemo } from 'react';
import {
  useStaffSchedule,
  useStaffScheduleBreaks,
  useStaffTimeOff,
} from '@/src/hooks/queries/useStaff';
import { ScheduleBreak } from '@/src/types';

export const useScheduleManagement = (staffId: string) => {
  const timeOffQuery = useStaffTimeOff(staffId);
  const scheduleQuery = useStaffSchedule(staffId);
  const breaksQuery = useStaffScheduleBreaks(staffId);
  const timeOffEntries = timeOffQuery.data;

  const stats = useMemo(() => {
    if (!timeOffEntries)
      return { total: 0, totalDays: 0, upcoming: 0, past: 0 };

    const now = new Date();
    let upcoming = 0;
    let past = 0;
    let totalDays = 0;

    for (const entry of timeOffEntries) {
      const start = new Date(entry.start_at);
      const end = new Date(entry.end_at);
      const days = Math.max(
        1,
        Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)),
      );
      totalDays += days;

      if (start > now) {
        upcoming++;
      } else {
        past++;
      }
    }

    return {
      total: timeOffEntries.length,
      totalDays,
      upcoming,
      past,
    };
  }, [timeOffEntries]);

  const breaksByDay = useMemo(() => {
    const scheduleBreaks = breaksQuery.data || [];
    const rulesByDay = new Map(
      (scheduleQuery.data || []).map((rule) => [rule.day_of_week, rule]),
    );

    return scheduleBreaks.reduce(
      (acc, scheduleBreak) => {
        const rule = rulesByDay.get(scheduleBreak.day_of_week);
        const isInert =
          !rule ||
          !rule.is_working_day ||
          scheduleBreak.start_time < rule.start_time ||
          scheduleBreak.end_time > rule.end_time;

        const dayBreak = {
          ...scheduleBreak,
          is_inert: isInert,
          inert_reason:
            !rule || !rule.is_working_day
              ? ('non_working_day' as const)
              : isInert
                ? ('outside_working_hours' as const)
                : undefined,
        };

        acc[scheduleBreak.day_of_week] = [
          ...(acc[scheduleBreak.day_of_week] || []),
          dayBreak,
        ].sort((a, b) => a.start_time.localeCompare(b.start_time));
        return acc;
      },
      {} as Record<number, ScheduleBreak[]>,
    );
  }, [breaksQuery.data, scheduleQuery.data]);

  return {
    entries: timeOffEntries || [],
    scheduleRules: scheduleQuery.data || [],
    breaks: breaksQuery.data || [],
    breaksByDay,
    stats,
    isLoading:
      timeOffQuery.isLoading ||
      scheduleQuery.isLoading ||
      breaksQuery.isLoading,
    actions: {
      refresh: () => {
        timeOffQuery.refetch();
        scheduleQuery.refetch();
        breaksQuery.refetch();
      },
    },
  };
};

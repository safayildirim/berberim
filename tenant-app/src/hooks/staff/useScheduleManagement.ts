import { useMemo } from 'react';
import { useStaffTimeOff } from '@/src/hooks/queries/useStaff';

export const useScheduleManagement = (staffId: string) => {
  const { data: timeOffEntries, isLoading, refetch } = useStaffTimeOff(staffId);

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

  return {
    entries: timeOffEntries || [],
    stats,
    isLoading,
    actions: {
      refresh: refetch,
    },
  };
};

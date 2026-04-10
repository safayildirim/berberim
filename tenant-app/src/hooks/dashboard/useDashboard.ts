import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { adminService } from '@/src/services/admin.service';
import { useAppointments } from '@/src/hooks/queries/useAppointments';

export function useDashboard() {
  const today = format(new Date(), 'yyyy-MM-dd');
  const {
    data: appointments,
    isLoading,
    isError,
  } = useAppointments({
    date: today,
  });

  const { data: dailyAnalytics } = useQuery({
    queryKey: ['analytics', 'daily'],
    queryFn: () => adminService.getAnalyticsOverview('daily'),
  });

  const appointmentsArray = Array.isArray(appointments) ? appointments : [];

  const stats = {
    completed:
      appointmentsArray.filter((a) => a.status === 'completed').length || 0,
    upcoming:
      appointmentsArray.filter((a) => a.status === 'confirmed').length || 0,
    noShows:
      appointmentsArray.filter((a) => a.status === 'no_show').length || 0,
  };

  const nextAppointment = appointmentsArray.find(
    (a) => a.status === 'confirmed',
  );

  const insights = {
    revenue: dailyAnalytics?.total_revenue ?? null,
    utilization:
      dailyAnalytics != null ? `${dailyAnalytics.staff_utilization}%` : null,
  };

  return {
    appointments: appointmentsArray,
    stats,
    nextAppointment,
    insights,
    isLoading,
    isError,
  };
}

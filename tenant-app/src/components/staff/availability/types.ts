import { ScheduleBreak } from '@/src/types';

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const DAY_LABELS = [
  'Sunday',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
];
export const WEEK_STARTS_ON_MONDAY = [1, 2, 3, 4, 5, 6, 0] as const;

export type BreakForm = {
  id?: string;
  day_of_week: ScheduleBreak['day_of_week'];
  start_time: string;
  end_time: string;
  label: string;
};

export const defaultBreakForm: BreakForm = {
  day_of_week: 1,
  start_time: '12:00',
  end_time: '13:00',
  label: '',
};

export type AvailabilitySettingsDraft = {
  buffer_minutes: string;
  same_day_booking_enabled: boolean;
  min_advance_minutes: string;
  max_advance_days: string;
  max_weekly_bookings: string;
};

import { api } from '@/src/lib/api/client';
import {
  ScheduleBreak,
  ScheduleRule,
  Staff,
  StaffReview,
  TimeOff,
  UserRole,
} from '../types';

export interface CreateStaffRequest {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
}

export interface UpdateStaffRequest extends Partial<CreateStaffRequest> {
  is_active?: boolean;
}

export interface CreateScheduleBreakRequest {
  day_of_week: ScheduleBreak['day_of_week'];
  start_time: string;
  end_time: string;
  label?: string;
}

export type UpdateScheduleBreakRequest = Omit<
  CreateScheduleBreakRequest,
  'day_of_week'
>;

export const staffService = {
  list: async (params?: { role?: UserRole }): Promise<Staff[]> => {
    const data = (await api.get('/tenant/staff', {
      params,
    })) as any;
    return data.users as any[];
  },

  detail: async (id: string): Promise<Staff> => {
    return api.get(`/tenant/staff/${id}`).then((res: any) => res.staff);
  },

  create: async (data: CreateStaffRequest): Promise<Staff> => {
    return api.post('/tenant/staff/users', data).then((res: any) => res.user);
  },

  update: async (id: string, data: UpdateStaffRequest): Promise<Staff> => {
    return api
      .patch(`/tenant/staff/users/${id}`, data)
      .then((res: any) => res.user);
  },

  getSchedule: async (staffId: string): Promise<ScheduleRule[]> => {
    return api
      .get(`/tenant/staff/${staffId}/schedule-rules`)
      .then((res: any) => res.rules ?? []);
  },

  updateSchedule: async (
    staffId: string,
    rules: ScheduleRule[],
  ): Promise<ScheduleRule[]> => {
    return api.put(`/tenant/staff/${staffId}/schedule-rules`, { rules });
  },

  updateScheduleRule: async (
    staffId: string,
    ruleId: string,
    data: Pick<
      ScheduleRule,
      'start_time' | 'end_time' | 'slot_interval_minutes' | 'is_working_day'
    >,
  ): Promise<ScheduleRule> => {
    return api
      .patch<{
        rule: ScheduleRule;
      }>(`/tenant/staff/${staffId}/schedule-rules/${ruleId}`, data)
      .then((res: any) => res.rule ?? res);
  },

  getScheduleBreaks: async (staffId: string): Promise<ScheduleBreak[]> => {
    return api
      .get<{
        breaks: ScheduleBreak[];
      }>(`/tenant/staff/${staffId}/schedule-breaks`)
      .then((res: any) => res.breaks ?? []);
  },

  createScheduleBreak: async (
    staffId: string,
    data: CreateScheduleBreakRequest,
  ): Promise<ScheduleBreak> => {
    return api
      .post<{
        break: ScheduleBreak;
      }>(`/tenant/staff/${staffId}/schedule-breaks`, data)
      .then((res: any) => res.schedule_break ?? res.break ?? res);
  },

  updateScheduleBreak: async (
    staffId: string,
    breakId: string,
    data: UpdateScheduleBreakRequest,
  ): Promise<ScheduleBreak> => {
    return api
      .patch<{
        break: ScheduleBreak;
      }>(`/tenant/staff/${staffId}/schedule-breaks/${breakId}`, data)
      .then((res: any) => res.schedule_break ?? res.break ?? res);
  },

  deleteScheduleBreak: async (
    staffId: string,
    breakId: string,
  ): Promise<void> => {
    return api.delete(`/tenant/staff/${staffId}/schedule-breaks/${breakId}`);
  },

  getTimeOff: async (staffId: string): Promise<TimeOff[]> => {
    return api
      .get(`/tenant/staff/${staffId}/time-offs`)
      .then((res: any) => res.time_offs ?? []);
  },

  addTimeOff: async (
    staffId: string,
    data: Omit<TimeOff, 'id'>,
  ): Promise<TimeOff> => {
    return api.post(`/tenant/staff/${staffId}/time-offs`, data);
  },

  removeTimeOff: async (staffId: string, timeOffId: string): Promise<void> => {
    return api.delete(`/tenant/staff/${staffId}/time-offs/${timeOffId}`);
  },

  updateAssignedServices: async (
    staffId: string,
    serviceIds: string[],
  ): Promise<void> => {
    return api.put(`/tenant/staff/${staffId}/services`, {
      service_ids: serviceIds,
    });
  },

  listReviews: async (
    staffId: string,
    params?: { page?: number; page_size?: number },
  ): Promise<{
    reviews: StaffReview[];
    total: number;
    total_pages: number;
  }> => {
    return api.get(`/tenant/staff/${staffId}/reviews`, { params });
  },
};

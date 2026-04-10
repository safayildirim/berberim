import { api } from '@/src/lib/api/client';
import { ScheduleRule, Staff, StaffReview, TimeOff, UserRole } from '../types';

export interface CreateStaffRequest {
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
}

export interface UpdateStaffRequest extends Partial<CreateStaffRequest> {
  is_active?: boolean;
}

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

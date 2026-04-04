import { api } from '@/src/lib/api/client';
import {
  Appointment,
  AppointmentStatus,
  AvailabilitySlot,
  FilledSlot,
  RecommendedSlot,
} from '@/src/types';

export interface BookingLimitStatus {
  bookings_this_week: number;
  max_weekly_bookings: number;
  can_book: boolean;
}

export interface CreateAppointmentRequest {
  service_ids: string[];
  staff_user_id: string;
  starts_at: string;
  notes_customer?: string;
  tenant_id: string;
}

export interface AvailabilitySearchRequest {
  date: string;
  service_ids: string[];
  staff_user_id?: string;
  tenant_id: string;
}

export interface AppointmentListResponse {
  appointments: Appointment[];
  total: number;
  total_pages: number;
}

export const appointmentService = {
  list: async (
    status?: AppointmentStatus,
  ): Promise<AppointmentListResponse> => {
    return api.get('/customer/appointments', { params: { status } });
  },

  detail: async (id: string): Promise<Appointment> => {
    return api
      .get<{ appointment: Appointment }>(`/customer/appointments/${id}`)
      .then((res) => res.appointment);
  },

  cancel: async (id: string): Promise<void> => {
    return api.post(`/customer/appointments/${id}/cancel`, {});
  },

  create: async (data: CreateAppointmentRequest): Promise<Appointment> => {
    return api.post('/customer/appointments', data);
  },

  reschedule: async (id: string, starts_at: string): Promise<Appointment> => {
    return api.post(`/customer/appointments/${id}/reschedule`, {
      new_starts_at: starts_at,
    });
  },

  searchAvailability: async (
    params: AvailabilitySearchRequest,
  ): Promise<{ slots: AvailabilitySlot[]; filled_slots: FilledSlot[] }> => {
    return api.post('/public/availability/search', params);
  },

  getAvailableDays: async (params: {
    from: string;
    to: string;
    service_ids: string[];
    staff_id?: string;
    tenant_id: string;
  }): Promise<string[]> => {
    return api.get('/public/availability/days', { params });
  },

  getBookingLimitStatus: async (): Promise<BookingLimitStatus> => {
    return api.get('/customer/booking-limit');
  },

  getSlotRecommendations: async (params: {
    service_ids: string[];
    staff_user_id?: string;
  }): Promise<RecommendedSlot[]> => {
    const res = await api.get<{ recommendations: RecommendedSlot[] }>(
      '/customer/slot-recommendations',
      {
        params: {
          service_ids: params.service_ids.join(','),
          staff_user_id: params.staff_user_id,
        },
      },
    );
    return res.recommendations || [];
  },
};

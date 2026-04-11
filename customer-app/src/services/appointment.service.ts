import { api } from '@/src/lib/api/client';
import {
  Appointment,
  AppointmentStatus,
  MultiDayAvailabilityResponse,
} from '@/src/types';

export interface BookingLimitStatus {
  bookings_this_week: number;
  max_weekly_bookings: number;
  can_book: boolean;
}

export interface CreateAppointmentRequest {
  service_ids: string[];
  staff_user_id?: string;
  starts_at: string;
  notes_customer?: string;
  idempotency_key?: string;
}

export interface MultiDayAvailabilityRequest {
  service_ids: string[];
  from_date: string;
  to_date: string;
  staff_user_id?: string;
  tenant_id: string;
  customer_id?: string;
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
    return api
      .post<{ appointment: Appointment }>('/customer/appointments', data)
      .then((res) => res.appointment);
  },

  reschedule: async (id: string, starts_at: string): Promise<Appointment> => {
    return api.post(`/customer/appointments/${id}/reschedule`, {
      new_starts_at: starts_at,
    });
  },

  searchAvailability: async (
    params: MultiDayAvailabilityRequest,
  ): Promise<MultiDayAvailabilityResponse> => {
    return api.post('/customer/availability/search-multi-day', params);
  },

  getBookingLimitStatus: async (): Promise<BookingLimitStatus> => {
    return api.get('/customer/booking-limit');
  },
};

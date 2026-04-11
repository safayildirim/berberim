import { api } from '@/src/lib/api/client';
import {
  Appointment,
  AppointmentStatus,
  Customer,
  Reward,
  Service,
  Staff,
  TenantConfig,
  User,
  AvailabilitySettings,
} from '../types';

export interface CreateAppointmentRequest {
  customer_id?: string;
  customer_info?: {
    first_name: string;
    last_name: string;
    phone: string;
  };
  service_ids: string[];
  staff_user_id: string;
  starts_at: string; // RFC3339
  notes?: string;
}

export interface UpdateAppointmentRequest {
  status?: AppointmentStatus;
  payment_status?: 'pending' | 'received';
  notes?: string;
}

export interface CreateCustomerRequest {
  first_name: string;
  last_name: string;
  phone: string;
  email?: string;
}

export type UpdateCustomerRequest = Partial<CreateCustomerRequest>;

export interface CreateServiceRequest {
  name: string;
  category_name: string;
  description?: string;
  base_price: string;
  duration_minutes: number;
  points_reward: number;
  is_active: boolean;
}

export const tenantService = {
  // Public / Bootstrap
  getBootstrapConfig: async (slug: string): Promise<TenantConfig> => {
    return api.get(`/public/tenants/${slug}/bootstrap`);
  },

  // Profile
  getMe: async (): Promise<User> => {
    return api
      .get<{ profile: User }>('/tenant/me')
      .then((res: any) => res.profile);
  },

  // Calendar & Availability
  getCalendar: async (params: {
    start_date: string;
    end_date: string;
    staff_id?: string;
  }): Promise<any> => {
    return api.get('/tenant/calendar', { params });
  },

  searchAvailability: async (data: any): Promise<any> => {
    return api.post('/tenant/availability/search', data);
  },

  getAvailabilitySettings: async (): Promise<AvailabilitySettings> => {
    return api
      .get<{ settings: AvailabilitySettings }>('/tenant/settings')
      .then((res: any) => res.settings ?? res);
  },

  updateAvailabilitySettings: async (
    data: AvailabilitySettings,
  ): Promise<AvailabilitySettings> => {
    return api
      .patch<{ settings: AvailabilitySettings }>(
        '/tenant/settings',
        { settings: data },
      )
      .then((res: any) => res.settings ?? res);
  },

  listServices: async (params?: {
    is_active?: boolean;
  }): Promise<Service[]> => {
    return api
      .get<{ services: Service[] }>('/tenant/services', { params })
      .then((res: any) => res.services || []);
  },

  createService: async (data: CreateServiceRequest): Promise<Service> => {
    return api.post('/tenant/services', data);
  },

  getService: async (id: string): Promise<Service> => {
    return api
      .get<{ service: Service }>(`/tenant/services/${id}`)
      .then((res: any) => res.service);
  },

  // Staff (Read-only for staff members - typically to see colleagues)
  listStaff: async (params?: { is_active?: boolean }): Promise<Staff[]> => {
    return api
      .get<{ staff: Staff[] }>('/tenant/staff', { params })
      .then((res: any) => res.staff || []);
  },

  getStaff: async (id: string): Promise<Staff> => {
    return api
      .get<{ staff: Staff }>(`/tenant/staff/${id}`)
      .then((res: any) => res.staff);
  },

  // Appointments (Full management for staff)
  listAppointments: async (params: {
    status?: AppointmentStatus;
    date?: string;
    staff_id?: string;
  }): Promise<Appointment[]> => {
    const { date, ...rest } = params;
    const query: Record<string, string | undefined> = { ...rest };
    if (date) {
      query.date_from = date;
      query.date_to = date; // backend adds 24h to date_to internally
    }
    return api
      .get<{
        appointments: Appointment[];
      }>('/tenant/appointments', { params: query })
      .then((res: any) => res.appointments || []);
  },

  getAppointment: async (id: string): Promise<Appointment> => {
    return api
      .get<{ appointment: Appointment }>(`/tenant/appointments/${id}`)
      .then((res: any) => res.appointment);
  },

  createAppointment: async (
    data: CreateAppointmentRequest,
  ): Promise<Appointment> => {
    return api.post('/tenant/appointments', data);
  },

  updateAppointment: async (
    id: string,
    data: UpdateAppointmentRequest,
  ): Promise<Appointment> => {
    return api.patch(`/tenant/appointments/${id}`, data);
  },

  rescheduleAppointment: async (
    id: string,
    new_starts_at: string,
  ): Promise<Appointment> => {
    return api.post(`/tenant/appointments/${id}/reschedule`, { new_starts_at });
  },

  markCompleted: async (id: string): Promise<Appointment> => {
    return api.post(`/tenant/appointments/${id}/complete`);
  },

  markPaymentReceived: async (id: string): Promise<Appointment> => {
    return api.post(`/tenant/appointments/${id}/mark-payment-received`);
  },

  markNoShow: async (id: string): Promise<Appointment> => {
    return api.post(`/tenant/appointments/${id}/mark-no-show`);
  },

  cancelAppointment: async (id: string): Promise<void> => {
    return api.post(`/tenant/appointments/${id}/cancel`);
  },

  // Customers (Management for staff)
  listCustomers: async (params?: { search?: string }): Promise<Customer[]> => {
    return api
      .get<{ customers: Customer[] }>('/tenant/customers', { params })
      .then((res: any) => res.customers || []);
  },

  getCustomer: async (id: string): Promise<Customer> => {
    return api
      .get<{ customer: Customer }>(`/tenant/customers/${id}`)
      .then((res: any) => res.customer);
  },

  getCustomerAppointments: async (id: string): Promise<Appointment[]> => {
    return api
      .get<{
        appointments: Appointment[];
      }>(`/tenant/customers/${id}/appointments`)
      .then((res: any) => res.appointments || []);
  },

  // Rewards (Read-only for staff - to inform customers)
  listRewards: async (params?: { is_active?: boolean }): Promise<Reward[]> => {
    return api
      .get<{ rewards: Reward[] }>('/tenant/rewards', { params })
      .then((res: any) => res.rewards || []);
  },

  getReward: async (id: string): Promise<Reward> => {
    return api
      .get<{ reward: Reward }>(`/tenant/rewards/${id}`)
      .then((res: any) => res.reward);
  },
};

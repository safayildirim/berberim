import { api } from '../lib/api/client';
import {
  AnalyticsOverview,
  CohortAnalysis,
  Customer,
  CustomerLTV,
  NoShowAnalysis,
  NotificationSettings,
  RetentionAnalysis,
  Reward,
  Service,
  Staff,
} from '../types';

export const adminService = {
  // Analytics
  getAnalyticsOverview: async (
    range: 'daily' | 'weekly' | 'monthly' = 'monthly',
  ): Promise<AnalyticsOverview> => {
    return api
      .get<{
        overview: AnalyticsOverview;
      }>(`/tenant/analytics/overview?range=${range}`)
      .then((res: any) => res.overview);
  },

  getCohortAnalysis: async (
    monthsBack: number = 6,
  ): Promise<CohortAnalysis> => {
    return api.get(`/tenant/analytics/cohorts?months_back=${monthsBack}`);
  },

  getRetentionAnalysis: async (
    range: string = '90d',
  ): Promise<RetentionAnalysis> => {
    return api.get(`/tenant/analytics/retention?range=${range}`);
  },

  getCustomerLTV: async (
    segmentBy: string = 'cohort',
  ): Promise<CustomerLTV> => {
    return api.get(`/tenant/analytics/ltv?segment_by=${segmentBy}`);
  },

  getNoShowAnalysis: async (
    range: string = 'monthly',
  ): Promise<NoShowAnalysis> => {
    return api.get(`/tenant/analytics/no-shows?range=${range}`);
  },

  // Settings
  getSettings: async (): Promise<any> => {
    return api
      .get<{ settings: any }>('/tenant/settings')
      .then((res: any) => res.settings);
  },

  updateSettings: async (data: any): Promise<any> => {
    return api.patch('/tenant/settings', data);
  },

  getNotificationSettings: async (): Promise<NotificationSettings> => {
    return api
      .get<{ settings: NotificationSettings }>('/tenant/notification-settings')
      .then((res: any) => res.settings);
  },

  updateNotificationSettings: async (
    data: NotificationSettings,
  ): Promise<NotificationSettings> => {
    return api
      .patch<{
        settings: NotificationSettings;
      }>('/tenant/notification-settings', { settings: data })
      .then((res: any) => res.settings);
  },

  getLoyaltySettings: async (): Promise<any> => {
    return api
      .get<{ settings: any }>('/tenant/loyalty/settings')
      .then((res: any) => res.settings);
  },

  updateLoyaltySettings: async (data: any): Promise<any> => {
    return api.patch('/tenant/loyalty/settings', data);
  },

  // Services Admin
  createService: async (data: Partial<Service>): Promise<Service> => {
    return api
      .post<{ service: Service }>('/tenant/services', data)
      .then((res: any) => res.service);
  },

  updateService: async (
    id: string,
    data: Partial<Service>,
  ): Promise<Service> => {
    return api
      .patch<{ service: Service }>(`/tenant/services/${id}`, data)
      .then((res: any) => res.service);
  },

  deleteService: async (id: string): Promise<void> => {
    return api.delete(`/tenant/services/${id}`);
  },

  // Staff Admin
  createStaff: async (
    data: Partial<Staff> & { password?: string },
  ): Promise<Staff> => {
    return api
      .post<{ user: Staff }>('/tenant/staff', data)
      .then((res: any) => res.user);
  },

  updateStaff: async (id: string, data: Partial<Staff>): Promise<Staff> => {
    return api
      .patch<{ user: Staff }>(`/tenant/staff/${id}`, data)
      .then((res: any) => res.user);
  },

  deleteStaff: async (id: string): Promise<void> => {
    return api.delete(`/tenant/staff/${id}`);
  },

  setStaffStatus: async (id: string, active: boolean): Promise<void> => {
    return api.patch(`/tenant/staff/${id}/status`, { is_active: active });
  },

  // Rewards Admin
  createReward: async (data: Partial<Reward>): Promise<Reward> => {
    return api
      .post<{ reward: Reward }>('/tenant/rewards', data)
      .then((res: any) => res.reward);
  },

  updateReward: async (id: string, data: Partial<Reward>): Promise<Reward> => {
    return api
      .patch<{ reward: Reward }>(`/tenant/rewards/${id}`, data)
      .then((res: any) => res.reward);
  },

  deleteReward: async (id: string): Promise<void> => {
    return api.delete(`/tenant/rewards/${id}`);
  },

  setRewardStatus: async (id: string, active: boolean): Promise<void> => {
    return api.patch(`/tenant/rewards/${id}/status`, { is_active: active });
  },

  // Customer Admin
  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    return api
      .post<{ customer: Customer }>('/tenant/customers', data)
      .then((res: any) => res.customer);
  },

  updateCustomer: async (
    id: string,
    data: Partial<Customer>,
  ): Promise<Customer> => {
    return api
      .patch<{ customer: Customer }>(`/tenant/customers/${id}`, data)
      .then((res: any) => res.customer);
  },

  setCustomerStatus: async (id: string, active: boolean): Promise<void> => {
    return api.patch(`/tenant/customers/${id}/status`, { is_active: active });
  },
};

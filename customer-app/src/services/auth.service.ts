import { api } from '@/src/lib/api/client';
import { CustomerProfile } from '@/src/types';

export interface OtpRequest {
  phone_number: string;
}

export interface OtpVerifyRequest {
  phone_number: string;
  code: string;
}

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  customer_id: string;
  is_new_customer: boolean;
}

export interface RegisterPushDeviceRequest {
  platform: 'ios' | 'android' | 'web';
  provider: 'expo' | 'fcm';
  device_token: string;
  app_version?: string;
  locale?: string;
  timezone?: string;
  installation_id?: string;
}

export const authService = {
  requestOtp: async (
    data: OtpRequest,
  ): Promise<{ expires_in_seconds: number }> => {
    return api.post('/auth/customers/login', data);
  },

  verifyOtp: async (data: OtpVerifyRequest): Promise<AuthResponse> => {
    return api.post('/auth/customers/login/verify', data);
  },

  me: async (): Promise<CustomerProfile> => {
    return api.get('/customer/me');
  },

  logout: async (): Promise<void> => {
    const { tokenStorage } = await import('@/src/lib/auth/token-storage');
    const refreshToken = await tokenStorage.getRefreshToken();
    await api.post('/auth/logout', {
      refresh_token: refreshToken ?? '',
    });
  },

  refresh: async (
    refreshToken: string,
  ): Promise<{ token: string; refreshToken: string }> => {
    return api.post('/auth/refresh', { refresh_token: refreshToken });
  },

  registerPushDevice: async (
    data: RegisterPushDeviceRequest,
  ): Promise<{ device_id: string }> => {
    return api.post('/customer/push-devices', data);
  },

  deletePushDevice: async (deviceId: string): Promise<void> => {
    await api.delete(`/customer/push-devices/${deviceId}`);
  },
};

import { api } from '../lib/api/client';
import { tokenStorage } from '../lib/auth/token-storage';
import { User } from '../types';

export interface LoginParams {
  email: string;
  password: string;
  tenant_id: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  user_id: string;
  role: string;
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
  login: async (params: LoginParams): Promise<LoginResponse> => {
    return api.post('/auth/tenant/login', params);
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } finally {
      await tokenStorage.clearAll();
    }
  },

  me: async (): Promise<User> => {
    return api
      .get<{ profile: User }>('/tenant/me')
      .then((res: any) => res.profile);
  },

  registerPushDevice: async (
    data: RegisterPushDeviceRequest,
  ): Promise<{ device_id: string }> => {
    return api.post('/tenant/push-devices', data);
  },

  deletePushDevice: async (deviceId: string): Promise<void> => {
    await api.delete(`/tenant/push-devices/${deviceId}`);
  },
};

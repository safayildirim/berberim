import * as SecureStore from 'expo-secure-store';
import { authLogger } from '@/src/lib/logger';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'staff_token',
  REFRESH_TOKEN: 'staff_refresh_token',
  TENANT_ID: 'tenant_id',
} as const;

export const tokenStorage = {
  async getAccessToken() {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch (e) {
      authLogger.error('Failed to get access token', e);
      return null;
    }
  },

  async setAccessToken(token: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch (e) {
      authLogger.error('Failed to set access token', e);
    }
  },

  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch (e) {
      authLogger.error('Failed to get refresh token', e);
      return null;
    }
  },

  async setRefreshToken(token: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch (e) {
      authLogger.error('Failed to set refresh token', e);
    }
  },

  async getTenantId() {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.TENANT_ID);
    } catch (e) {
      authLogger.error('Failed to get tenant id', e);
      return null;
    }
  },

  async setTenantId(tenantId: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.TENANT_ID, tenantId);
    } catch (e) {
      authLogger.error('Failed to set tenant id', e);
    }
  },

  async clearAll() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
      await SecureStore.deleteItemAsync(STORAGE_KEYS.TENANT_ID);
    } catch (e) {
      authLogger.error('Failed to clear storage', e);
    }
  },
};

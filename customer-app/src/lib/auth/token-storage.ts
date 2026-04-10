import * as SecureStore from 'expo-secure-store';
import { authLogger } from '@/src/lib/logger';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  ACTIVE_TENANT_ID: 'active_tenant_id',
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

  async getActiveTenantId() {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACTIVE_TENANT_ID);
    } catch (e) {
      authLogger.error('Failed to get active tenant id', e);
      return null;
    }
  },

  async setActiveTenantId(tenantId: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACTIVE_TENANT_ID, tenantId);
    } catch (e) {
      authLogger.error('Failed to set active tenant id', e);
    }
  },

  async clearActiveTenantId() {
    try {
      await SecureStore.deleteItemAsync(STORAGE_KEYS.ACTIVE_TENANT_ID);
    } catch (e) {
      authLogger.error('Failed to clear active tenant id', e);
    }
  },

  async clearAll() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      for (const key of keys) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch (e) {
      authLogger.error('Failed to clear storage', e);
    }
  },
};

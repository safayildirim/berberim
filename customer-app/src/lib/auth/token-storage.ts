import * as SecureStore from 'expo-secure-store';

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'auth_access_token',
  REFRESH_TOKEN: 'auth_refresh_token',
  TENANT_ID: 'app_tenant_id',
} as const;

export const tokenStorage = {
  async getAccessToken() {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.ACCESS_TOKEN, token);
    } catch {
      console.error('Error setting access token');
    }
  },

  async getRefreshToken() {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.REFRESH_TOKEN, token);
    } catch {
      console.error('Error setting refresh token');
    }
  },

  async getTenantId() {
    try {
      return await SecureStore.getItemAsync(STORAGE_KEYS.TENANT_ID);
    } catch {
      return null;
    }
  },

  async setTenantId(tenantId: string) {
    try {
      await SecureStore.setItemAsync(STORAGE_KEYS.TENANT_ID, tenantId);
    } catch {
      console.error('Error setting tenant id');
    }
  },

  async clearAll() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      for (const key of keys) {
        await SecureStore.deleteItemAsync(key);
      }
    } catch {
      console.error('Error clearing storage');
    }
  },
};

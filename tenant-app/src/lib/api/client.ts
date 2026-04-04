import axios from 'axios';
import { tokenStorage } from '../auth/token-storage';
import { getDeviceHeaders } from '../device/device-metadata';

const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:8080/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor
api.interceptors.request.use(async (config) => {
  const token = await tokenStorage.getAccessToken();
  const tenantId = await tokenStorage.getTenantId();
  const deviceHeaders = await getDeviceHeaders();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (tenantId) {
    config.headers['X-Tenant-ID'] = tenantId;
  }

  for (const [key, value] of Object.entries(deviceHeaders)) {
    config.headers[key] = value;
  }

  return config;
});

// Response Interceptor: Handle errors and potentially token refresh
api.interceptors.response.use(
  (response) => response.data, // Simplify response data
  async (error) => {
    const originalRequest = error.config;

    // Handle Token Refresh (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
          // Attempt refresh
          const deviceHeaders = await getDeviceHeaders();
          const { data } = await axios.post(
            `${API_BASE_URL}/auth/refresh`,
            {
              refresh_token: refreshToken,
            },
            {
              headers: deviceHeaders,
            },
          );

          const { access_token, refresh_token } = data;
          await tokenStorage.setAccessToken(access_token);
          await tokenStorage.setRefreshToken(refresh_token);

          // Retry original request with new token
          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          return api(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout
          await tokenStorage.clearAll();
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout
        await tokenStorage.clearAll();
      }
    }

    return Promise.reject(error);
  },
);

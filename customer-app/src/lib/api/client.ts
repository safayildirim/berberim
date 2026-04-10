import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { tokenStorage } from '@/src/lib/auth/token-storage';
import { getDeviceHeaders } from '@/src/lib/device/device-metadata';
import { handleError } from '@/src/lib/api/errors';
import { apiLogger, redact } from '@/src/lib/logger';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

type TrackedConfig = InternalAxiosRequestConfig & {
  _requestId?: string;
  _startTime?: number;
};

const REQUEST_ID_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateRequestId(): string {
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += REQUEST_ID_CHARSET[Math.floor(Math.random() * 52)];
  }
  return id;
}

if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not set');
}

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

apiClient.interceptors.request.use(
  async (config: TrackedConfig) => {
    const accessToken = await tokenStorage.getAccessToken();
    const activeTenantId = await tokenStorage.getActiveTenantId();
    const deviceHeaders = await getDeviceHeaders();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (activeTenantId) {
      config.headers['X-Tenant-ID'] = activeTenantId;
      const isPublicRoute =
        config.url?.startsWith('/public/') || config.url?.startsWith('public/');
      if (isPublicRoute) {
        const params = config.params || {};
        if (!params.tenant_id) {
          config.params = {
            ...params,
            tenant_id: activeTenantId,
          };
        }
      }
    }

    for (const [key, value] of Object.entries(deviceHeaders)) {
      config.headers[key] = value;
    }

    const requestId = generateRequestId();
    config._requestId = requestId;
    config._startTime = Date.now();
    config.headers['X-Request-ID'] = requestId;

    const method = (config.method ?? 'GET').toUpperCase();
    apiLogger.debug('Request started', {
      method,
      url: config.url,
      requestId,
      params: config.params,
      headers: redact(config.headers) as Record<string, unknown>,
      body: redact(config.data) as Record<string, unknown>,
    });

    return config;
  },
  (error: AxiosError) => Promise.reject(error),
);

apiClient.interceptors.response.use(
  (response) => {
    const cfg = response.config as TrackedConfig;
    apiLogger.debug('Request succeeded', {
      method: cfg.method?.toUpperCase(),
      url: cfg.url,
      requestId: cfg._requestId,
      status: response.status,
      durationMs: cfg._startTime ? Date.now() - cfg._startTime : undefined,
      data: redact(response.data),
    });
    return response;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as TrackedConfig & {
      _retry?: boolean;
    };

    const cfg = error.config as TrackedConfig;
    const durationMs = cfg?._startTime
      ? Date.now() - cfg._startTime
      : undefined;

    const logContext = {
      method: cfg?.method?.toUpperCase(),
      url: cfg?.url,
      requestId: cfg?._requestId,
      durationMs,
    };

    // Handle Token Refresh (401 Unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = await tokenStorage.getRefreshToken();
      if (refreshToken) {
        try {
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

          originalRequest.headers.Authorization = `Bearer ${access_token}`;
          apiLogger.debug('Token refreshed, retrying request', logContext);
          return apiClient(originalRequest);
        } catch (refreshError) {
          apiLogger.error('Token refresh failed', refreshError, logContext);
          await tokenStorage.clearAll();
          return Promise.reject(refreshError);
        }
      } else {
        apiLogger.warn('No refresh token available', logContext);
        await tokenStorage.clearAll();
      }
    } else {
      apiLogger.error('Request failed', error, logContext);
    }

    return handleError(error);
  },
);

export const api = {
  get: <T>(url: string, config?: any) =>
    apiClient.get<T>(url, config).then((res) => res.data),
  post: <T>(url: string, data?: any, config?: any) =>
    apiClient.post<T>(url, data, config).then((res) => res.data),
  put: <T>(url: string, data?: any, config?: any) =>
    apiClient.put<T>(url, data, config).then((res) => res.data),
  patch: <T>(url: string, data?: any, config?: any) =>
    apiClient.patch<T>(url, data, config).then((res) => res.data),
  delete: <T>(url: string, config?: any) =>
    apiClient.delete<T>(url, config).then((res) => res.data),
};

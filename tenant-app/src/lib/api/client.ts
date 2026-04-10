import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '@/src/lib/auth/token-storage';
import { getDeviceHeaders } from '@/src/lib/device/device-metadata';
import { apiLogger, redact } from '@/src/lib/logger';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not set');
}

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

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(async (config: TrackedConfig) => {
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
});

api.interceptors.response.use(
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
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as TrackedConfig & {
      _retry?: boolean;
    };

    const cfg = error.config as TrackedConfig;
    const durationMs = cfg?._startTime
      ? Date.now() - cfg._startTime
      : undefined;

    apiLogger.error('Request failed', error, {
      method: cfg?.method?.toUpperCase(),
      url: cfg?.url,
      requestId: cfg?._requestId,
      durationMs,
    });

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
          return api(originalRequest);
        } catch (refreshError) {
          await tokenStorage.clearAll();
          return Promise.reject(refreshError);
        }
      } else {
        await tokenStorage.clearAll();
      }
    }

    return Promise.reject(error);
  },
);

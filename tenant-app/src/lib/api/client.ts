import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { tokenStorage } from '../auth/token-storage';
import { getDeviceHeaders } from '../device/device-metadata';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;
if (!API_BASE_URL) {
  throw new Error('EXPO_PUBLIC_API_BASE_URL is not set');
}

// ─── Logger ──────────────────────────────────────────────────────────────────

type TrackedConfig = InternalAxiosRequestConfig & {
  _requestId?: string;
  _startTime?: number;
};

const REDACTED_HEADERS = new Set(['authorization', 'cookie', 'x-api-key']);

function sanitizeHeaders(
  headers: Record<string, unknown>,
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).map(([k, v]) => [
      k,
      REDACTED_HEADERS.has(k.toLowerCase()) ? '[REDACTED]' : String(v ?? ''),
    ]),
  );
}

const REQUEST_ID_CHARSET =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';

function generateRequestId(): string {
  let id = '';
  for (let i = 0; i < 32; i++) {
    id += REQUEST_ID_CHARSET[Math.floor(Math.random() * 52)];
  }
  return id;
}

function elapsed(startTime?: number): string {
  return startTime != null ? `${Date.now() - startTime}ms` : '?ms';
}

// ─────────────────────────────────────────────────────────────────────────────

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Auth tokens, Tenant ID, and logging metadata
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

  // Attach correlation ID and start time for response logging
  const requestId = generateRequestId();
  config._requestId = requestId;
  config._startTime = Date.now();
  config.headers['X-Request-ID'] = requestId;

  if (__DEV__) {
    const method = (config.method ?? 'GET').toUpperCase();
    console.debug(`[API →] ${method} ${config.url}`, {
      requestId,
      params: config.params,
      headers: sanitizeHeaders(config.headers as Record<string, unknown>),
      body: config.data,
    });
  }

  return config;
});

// Response Interceptor: Log response, handle errors and token refresh
api.interceptors.response.use(
  (response) => {
    if (__DEV__) {
      const cfg = response.config as TrackedConfig;
      console.debug(
        `[API ←] ${response.status} ${cfg.url} (${elapsed(cfg._startTime)})`,
        {
          requestId: cfg._requestId,
          status: response.status,
          body: response.data,
        },
      );
    }
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as TrackedConfig & {
      _retry?: boolean;
    };

    const cfg = error.config as TrackedConfig;
    console.error(
      `[API ✗] ${error.response?.status ?? 'ERR'} ${cfg?.url ?? ''} (${elapsed(cfg?._startTime)})`,
      {
        requestId: cfg?._requestId,
        status: error.response?.status,
        body: error.response?.data,
        message: error.message,
      },
    );

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

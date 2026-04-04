import axios, {
  AxiosError,
  AxiosInstance,
  InternalAxiosRequestConfig,
} from 'axios';
import { tokenStorage } from '@/src/lib/auth/token-storage';
import { getDeviceHeaders } from '@/src/lib/device/device-metadata';
import { handleError } from '@/src/lib/api/errors';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL;

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

// Matches Echo's RequestID middleware format: 32 chars from [A-Za-z].
// Echo reuses the incoming X-Request-ID header, so this ID flows into gateway logs unchanged.
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

// Request Interceptor: Attach Auth tokens, Tenant ID, and logging metadata
apiClient.interceptors.request.use(
  async (config: TrackedConfig) => {
    const accessToken = await tokenStorage.getAccessToken();
    const tenantId = await tokenStorage.getTenantId();
    const deviceHeaders = await getDeviceHeaders();

    if (accessToken) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
      // Only public routes expect tenant_id as a query param;
      // authenticated routes get it from the JWT claim.
      const isPublicRoute =
        config.url?.startsWith('/public/') || config.url?.startsWith('public/');
      if (isPublicRoute) {
        const params = config.params || {};
        if (!params.tenant_id) {
          config.params = {
            ...params,
            tenant_id: tenantId,
          };
        }
      }
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
  },
  (error: AxiosError) => Promise.reject(error),
);

// Response Interceptor: Log response, handle errors and token refresh
apiClient.interceptors.response.use(
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
    return response;
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
          return apiClient(originalRequest);
        } catch (refreshError) {
          // Refresh failed, logout
          await tokenStorage.clearAll();
          // Ideally trigger a global event or redirect to login
          return Promise.reject(refreshError);
        }
      } else {
        // No refresh token, logout
        await tokenStorage.clearAll();
      }
    }

    // Wrap and map error
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

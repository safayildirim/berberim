import { AxiosError } from 'axios';

import type { ErrorClassification, NormalizedError } from './types';

interface TrackedAxiosConfig {
  _requestId?: string;
  url?: string;
}

function classifyAxiosError(error: AxiosError): ErrorClassification {
  if (error.code === 'ECONNABORTED') return 'timeout';
  if (error.code === 'ERR_CANCELED') return 'cancelled';
  if (!error.response) return 'network';
  const status = error.response.status;
  if (status >= 400 && status < 500) return 'client_error';
  if (status >= 500) return 'server_error';
  return 'unknown';
}

export function normalizeError(error: unknown): NormalizedError {
  if (error instanceof AxiosError) {
    const cfg = error.config as TrackedAxiosConfig | undefined;
    return {
      name: 'AxiosError',
      message: error.message,
      code: error.code,
      httpStatus: error.response?.status,
      classification: classifyAxiosError(error),
      url: cfg?.url,
      requestId: cfg?._requestId,
      stack: error.stack,
    };
  }

  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  return {
    name: 'UnknownError',
    message: String(error),
  };
}

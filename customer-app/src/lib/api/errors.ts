import { AxiosError } from 'axios';
import { apiLogger } from '@/src/lib/logger';

export interface ApiErrorResponse {
  code?: string;
  message: string;
  errors?: Record<string, string[]>;
}

export class AppError extends Error {
  code?: string;
  status?: number;
  originalError?: any;
  validationErrors?: Record<string, string[]>;

  constructor(
    message: string,
    options: {
      code?: string;
      status?: number;
      originalError?: any;
      validationErrors?: Record<string, string[]>;
    } = {},
  ) {
    super(message);
    this.name = 'AppError';
    this.code = options.code;
    this.status = options.status;
    this.originalError = options.originalError;
    this.validationErrors = options.validationErrors;
  }
}

export const handleError = (error: unknown): never => {
  if (error instanceof AppError) {
    throw error;
  }

  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
    const status = error.response?.status;

    apiLogger.error('API error response', error, {
      status,
      code: data?.code,
    });

    // Mapping some common statuses to friendly messages if backend doesn't provide them
    let message = data?.message || error.message;
    if (status === 401)
      message = 'Oturum sona erdi. Lütfen tekrar giriş yapın.';
    if (status === 403) message = 'Bu yetkiye sahip değilsiniz.';
    if (status === 404) message = 'Aradığınız kaynak bulunamadı.';
    if (status === 500)
      message = 'Sunucu hatası oluştu. Lütfen daha sonra tekrar deneyin.';

    throw new AppError(message, {
      status,
      code: data?.code,
      validationErrors: data?.errors,
      originalError: error,
    });
  }

  if (error instanceof Error) {
    throw new AppError(error.message, { originalError: error });
  }

  throw new AppError('Beklenmedik bir hata oluştu.');
};

import { getEnvironmentConfig } from './environment';
import { Logger } from './logger';

export type {
  LogEntry,
  LogLevelName,
  LogTransport,
  LoggerConfig,
  NormalizedError,
  ErrorClassification,
  AppEnvironment,
  RedactConfig,
} from './types';
export { LogLevel } from './types';
export { normalizeError } from './error-normalizer';
export { redact } from './redact';
export { Logger } from './logger';

const config = getEnvironmentConfig();

export const rootLogger = new Logger('app', config);

export function createLogger(
  feature: string,
  context?: Record<string, unknown>,
): Logger {
  return new Logger(feature, config, context);
}

export const apiLogger = createLogger('api');
export const authLogger = createLogger('auth');
export const pushLogger = createLogger('push');
export const i18nLogger = createLogger('i18n');

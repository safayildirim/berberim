export const LogLevel = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
} as const;

export type LogLevelName = keyof typeof LogLevel;
export type LogLevelValue = (typeof LogLevel)[LogLevelName];

export type AppEnvironment = 'development' | 'staging' | 'production';

export interface LogEntry {
  timestamp: string;
  level: LogLevelName;
  message: string;
  feature: string;
  environment: AppEnvironment;
  appVersion: string;
  platform: 'ios' | 'android' | 'web';
  correlationId?: string;
  data?: Record<string, unknown>;
  error?: NormalizedError;
}

export interface NormalizedError {
  name: string;
  message: string;
  code?: string;
  stack?: string;
  classification?: ErrorClassification;
  httpStatus?: number;
  requestId?: string;
  url?: string;
}

export type ErrorClassification =
  | 'network'
  | 'timeout'
  | 'cancelled'
  | 'client_error'
  | 'server_error'
  | 'unknown';

export interface LogTransport {
  readonly name: string;
  log(entry: LogEntry): void;
}

export interface LoggerConfig {
  minLevel: LogLevelValue;
  transports: LogTransport[];
  redact: boolean;
  includeStack: boolean;
}

export interface RedactConfig {
  patterns: RegExp[];
  replacement: string;
  maxDepth: number;
}

import { LogLevel } from './types';
import type {
  LogEntry,
  LogLevelName,
  LogLevelValue,
  LoggerConfig,
} from './types';
import { normalizeError } from './error-normalizer';
import { redact } from './redact';
import { detectEnvironment, getAppVersion, getPlatform } from './environment';

export class Logger {
  private feature: string;
  private config: LoggerConfig;
  private baseContext: Record<string, unknown>;

  constructor(
    feature: string,
    config: LoggerConfig,
    baseContext?: Record<string, unknown>,
  ) {
    this.feature = feature;
    this.config = config;
    this.baseContext = baseContext ?? {};
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this._log('DEBUG', message, undefined, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this._log('INFO', message, undefined, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this._log('WARN', message, undefined, data);
  }

  error(
    message: string,
    error?: unknown,
    data?: Record<string, unknown>,
  ): void {
    this._log('ERROR', message, error, data);
  }

  child(feature: string, context?: Record<string, unknown>): Logger {
    return new Logger(feature, this.config, {
      ...this.baseContext,
      ...context,
    });
  }

  private _log(
    level: LogLevelName,
    message: string,
    error?: unknown,
    data?: Record<string, unknown>,
  ): void {
    const levelValue: LogLevelValue = LogLevel[level];
    if (levelValue < this.config.minLevel) return;

    const mergedData =
      data || Object.keys(this.baseContext).length > 0
        ? { ...this.baseContext, ...data }
        : undefined;

    const normalized = error != null ? normalizeError(error) : undefined;
    if (normalized && !this.config.includeStack) {
      delete normalized.stack;
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      feature: this.feature,
      environment: detectEnvironment(),
      appVersion: getAppVersion(),
      platform: getPlatform(),
      correlationId: (mergedData?.requestId as string) ?? undefined,
      data: mergedData
        ? this.config.redact
          ? (redact(mergedData) as Record<string, unknown>)
          : mergedData
        : undefined,
      error: normalized,
    };

    for (const transport of this.config.transports) {
      try {
        transport.log(entry);
      } catch {
        // Transport failure must never crash the app
      }
    }
  }
}

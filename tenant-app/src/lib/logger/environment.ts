import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { LogLevel } from './types';
import type { AppEnvironment, LoggerConfig } from './types';
import { ConsoleTransport } from './transports';

export function detectEnvironment(): AppEnvironment {
  const explicit = process.env.EXPO_PUBLIC_APP_ENV;
  if (
    explicit === 'staging' ||
    explicit === 'production' ||
    explicit === 'development'
  ) {
    return explicit;
  }
  return __DEV__ ? 'development' : 'production';
}

export function getAppVersion(): string {
  return Constants.expoConfig?.version ?? 'unknown';
}

export function getPlatform(): 'ios' | 'android' | 'web' {
  if (Platform.OS === 'ios' || Platform.OS === 'android') return Platform.OS;
  return 'web';
}

export function getEnvironmentConfig(): LoggerConfig {
  const env = detectEnvironment();

  switch (env) {
    case 'development':
      return {
        minLevel: LogLevel.DEBUG,
        transports: [new ConsoleTransport(true)],
        redact: false,
        includeStack: true,
      };
    case 'staging':
      return {
        minLevel: LogLevel.DEBUG,
        transports: [new ConsoleTransport(false)],
        redact: true,
        includeStack: true,
      };
    case 'production':
      return {
        minLevel: LogLevel.INFO,
        transports: [new ConsoleTransport(false)],
        redact: true,
        includeStack: false,
      };
  }
}

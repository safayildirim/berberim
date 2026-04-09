import { DEFAULT_REDACT_CONFIG } from './constants';
import type { RedactConfig } from './types';

function looksLikeJwt(value: string): boolean {
  return value.startsWith('eyJ') && value.includes('.');
}

function shouldRedactKey(key: string, patterns: RegExp[]): boolean {
  return patterns.some((p) => p.test(key));
}

function redactValue(
  value: unknown,
  config: RedactConfig,
  depth: number,
  seen: WeakSet<object>,
): unknown {
  if (depth > config.maxDepth) return config.replacement;

  if (value === null || value === undefined) return value;

  if (typeof value === 'string') {
    return looksLikeJwt(value) ? config.replacement : value;
  }

  if (typeof value !== 'object') return value;

  if (seen.has(value as object)) return '[Circular]';
  seen.add(value as object);

  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item, config, depth + 1, seen));
  }

  const result: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
    if (shouldRedactKey(key, config.patterns)) {
      result[key] = config.replacement;
    } else {
      result[key] = redactValue(val, config, depth + 1, seen);
    }
  }
  return result;
}

export function redact(
  value: unknown,
  overrides?: Partial<RedactConfig>,
): unknown {
  const config: RedactConfig = overrides
    ? { ...DEFAULT_REDACT_CONFIG, ...overrides }
    : DEFAULT_REDACT_CONFIG;

  return redactValue(value, config, 0, new WeakSet());
}

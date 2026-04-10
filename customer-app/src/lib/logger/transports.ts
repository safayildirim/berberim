import type { LogEntry, LogLevelName, LogTransport } from './types';

type ConsoleMethod = (...args: unknown[]) => void;

const LEVEL_CONSOLE_MAP: Record<LogLevelName, ConsoleMethod> = {
  DEBUG: console.debug,
  INFO: console.info,
  WARN: console.warn,
  ERROR: console.error,
};

function prettyFormat(value: unknown, indent: number = 0): string {
  const pad = '  '.repeat(indent);
  const innerPad = '  '.repeat(indent + 1);

  if (value === null || value === undefined) return String(value);
  if (typeof value === 'string') return `"${value}"`;
  if (typeof value !== 'object') return String(value);

  if (Array.isArray(value)) {
    if (value.length === 0) return '[]';
    const items = value.map((v) => `${innerPad}${prettyFormat(v, indent + 1)}`);
    return `[\n${items.join(',\n')}\n${pad}]`;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  if (entries.length === 0) return '{}';
  const lines = entries
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `${innerPad}${k}: ${prettyFormat(v, indent + 1)}`);
  return `{\n${lines.join(',\n')}\n${pad}}`;
}

export class ConsoleTransport implements LogTransport {
  readonly name = 'console';

  constructor(private prettyPrint: boolean) {}

  log(entry: LogEntry): void {
    const method = LEVEL_CONSOLE_MAP[entry.level];

    if (this.prettyPrint) {
      const prefix = `[${entry.feature}]`;
      const hasData = entry.data && Object.keys(entry.data).length > 0;
      const dataStr = hasData ? `\n${prettyFormat(entry.data)}` : '';
      let errorStr = '';
      if (entry.error) {
        const { stack: _stack, ...errorWithoutStack } = entry.error;
        errorStr = `\n${prettyFormat(errorWithoutStack)}`;
      }
      method(`${prefix} ${entry.message}${dataStr}${errorStr}`);
    } else {
      method(JSON.stringify(entry));
    }
  }
}

// Future transports:
// export class SentryTransport implements LogTransport { ... }
// export class DatadogTransport implements LogTransport { ... }

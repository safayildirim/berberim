import type { RedactConfig } from './types';

export const DEFAULT_REDACT_PATTERNS: RegExp[] = [
  /token/i,
  /password/i,
  /passwd/i,
  /secret/i,
  /credential/i,
  /^authorization$/i,
  /^cookie$/i,
  /^x-api-key$/i,
  /^set-cookie$/i,
  /phone/i,
  /email/i,
  /^tc$/i,
  /tckn/i,
  /national.?id/i,
  /card.?number/i,
  /cvv/i,
  /cvc/i,
  /iban/i,
  /mnemonic/i,
  /private.?key/i,
  /^pin$/i,
  /session.?id/i,
  /signature/i,
];

export const DEFAULT_REDACT_CONFIG: RedactConfig = {
  patterns: DEFAULT_REDACT_PATTERNS,
  replacement: '[REDACTED]',
  maxDepth: 10,
};

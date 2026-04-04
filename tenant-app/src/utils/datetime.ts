/**
 * Builds a RFC3339 timestamp from a local date string ("YYYY-MM-DD") and a
 * local time string ("HH:MM"), appending the device's current UTC offset so
 * the server can convert to UTC correctly.
 *
 * Example (device at UTC+3):
 *   toLocalRFC3339("2026-04-06", "09:00") → "2026-04-06T09:00:00+03:00"
 */
export function toLocalRFC3339(date: string, time: string): string {
  const offsetMinutes = -new Date().getTimezoneOffset();
  const sign = offsetMinutes >= 0 ? '+' : '-';
  const abs = Math.abs(offsetMinutes);
  const hh = String(Math.floor(abs / 60)).padStart(2, '0');
  const mm = String(abs % 60).padStart(2, '0');
  return `${date}T${time}:00${sign}${hh}:${mm}`;
}

const REFERENCE_YEAR = 2026;
const REFERENCE_MONTH = 0;
const REFERENCE_DAY = 5;

type TimeParts = {
  hours: number;
  minutes: number;
};

export const normalizeScheduleTime = (time: string) => {
  const parts = parseTimeParts(time);
  if (!parts) return time;
  return formatTimeParts(parts.hours, parts.minutes);
};

export const formatUtcScheduleTimeForZone = (
  time: string,
  timeZone?: string | null,
) => {
  if (!timeZone) return normalizeScheduleTime(time);
  const parts = parseTimeParts(time);
  if (!parts) return time;

  try {
    const date = new Date(
      Date.UTC(
        REFERENCE_YEAR,
        REFERENCE_MONTH,
        REFERENCE_DAY,
        parts.hours,
        parts.minutes,
      ),
    );
    return new Intl.DateTimeFormat('en-GB', {
      timeZone,
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).format(date);
  } catch {
    return normalizeScheduleTime(time);
  }
};

export const convertZoneScheduleTimeToUtc = (
  time: string,
  timeZone?: string | null,
) => {
  if (!timeZone) return normalizeScheduleTime(time);
  const parts = parseTimeParts(time);
  if (!parts) return time;

  try {
    const utcOffsetMinutes = getTimeZoneOffsetMinutes(timeZone);
    const utcMinutes = wrapMinutes(
      parts.hours * 60 + parts.minutes - utcOffsetMinutes,
    );
    return formatTimeParts(Math.floor(utcMinutes / 60), utcMinutes % 60);
  } catch {
    return normalizeScheduleTime(time);
  }
};

const getTimeZoneOffsetMinutes = (timeZone: string) => {
  const utcReference = new Date(
    Date.UTC(REFERENCE_YEAR, REFERENCE_MONTH, REFERENCE_DAY, 12, 0),
  );
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  });
  const parts = formatter.formatToParts(utcReference).reduce(
    (acc, part) => {
      acc[part.type] = Number(part.value);
      return acc;
    },
    {} as Record<string, number>,
  );

  const localAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
  );
  return (localAsUtc - utcReference.getTime()) / 60000;
};

const parseTimeParts = (time: string): TimeParts | null => {
  const [hours, minutes] = time.split(':').map(Number);
  if (
    Number.isNaN(hours) ||
    Number.isNaN(minutes) ||
    hours < 0 ||
    hours > 23 ||
    minutes < 0 ||
    minutes > 59
  ) {
    return null;
  }
  return { hours, minutes };
};

const wrapMinutes = (minutes: number) => ((minutes % 1440) + 1440) % 1440;

const formatTimeParts = (hours: number, minutes: number) =>
  `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

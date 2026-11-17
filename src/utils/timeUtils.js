const WAT_TIME_ZONE = 'Africa/Lagos';
const WAT_OFFSET_MILLISECONDS = 60 * 60 * 1000;

const getWATParts = (date) => {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: WAT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(date);

  return Object.fromEntries(parts.map(({ type, value }) => [type, value]));
};

const formatWATDateKey = (date) => {
  const { year, month, day } = getWATParts(date);
  return `${year}-${month}-${day}`;
};

/**
 * Returns a datetime-local value representing the given instant in West Africa Time.
 */
export const toWATDatetimeLocal = (date = new Date()) => {
  const value = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const validDate = isNaN(value.getTime()) ? new Date() : value;
  const { year, month, day, hour, minute } = getWATParts(validDate);
  return `${year}-${month}-${day}T${hour}:${minute}`;
};

/**
 * Parses an ISO timestamp or a datetime-local value interpreted as West Africa Time.
 */
export const parseWATDatetimeToMillis = (datetimeStr) => {
  if (!datetimeStr) return NaN;
  if (typeof datetimeStr === 'number') return datetimeStr;

  const str = String(datetimeStr).trim();
  if (/T.*(?:[zZ]|[+-]\d{2}(?::?\d{2})?)$/i.test(str)) {
    return new Date(str).getTime();
  }

  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/);
  if (!match) return new Date(str).getTime();

  const [, year, month, day, hour = '0', minute = '0', second = '0', millisecond = '0'] = match;
  const wallTime = new Date(0);
  wallTime.setUTCFullYear(Number(year), Number(month) - 1, Number(day));
  wallTime.setUTCHours(
    Number(hour),
    Number(minute),
    Number(second),
    Number(millisecond.padEnd(3, '0'))
  );
  const parsed = wallTime.getTime();
  const normalized = new Date(parsed);

  if (
    normalized.getUTCFullYear() !== Number(year) ||
    normalized.getUTCMonth() !== Number(month) - 1 ||
    normalized.getUTCDate() !== Number(day) ||
    normalized.getUTCHours() !== Number(hour) ||
    normalized.getUTCMinutes() !== Number(minute) ||
    normalized.getUTCSeconds() !== Number(second)
  ) {
    return NaN;
  }

  return parsed - WAT_OFFSET_MILLISECONDS;
};

/**
 * Formats a date or timestamp using the device locale and West Africa Time.
 */
export const formatWATDate = (
  dateInput,
  { includeYear = false, includeSeconds = false, includeWeekday = false } = {}
) => {
  if (!dateInput) return '';

  const millis =
    typeof dateInput === 'string' ? parseWATDatetimeToMillis(dateInput) : new Date(dateInput).getTime();
  const date = new Date(millis);
  if (isNaN(date.getTime())) return String(dateInput);

  return date
    .toLocaleString(undefined, {
      timeZone: WAT_TIME_ZONE,
      ...(includeWeekday ? { weekday: 'short' } : {}),
      day: 'numeric',
      month: 'short',
      ...(includeYear ? { year: 'numeric' } : {}),
      hour: '2-digit',
      minute: '2-digit',
      ...(includeSeconds ? { second: '2-digit' } : {}),
      hour12: true,
    })
    .replace(/\b(am|pm)\b/i, (value) => value.toUpperCase());
};

/**
 * Returns today's date in West Africa Time.
 */
export const getWATTodayFormatted = (date = new Date()) => {
  const value = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const validDate = isNaN(value.getTime()) ? new Date() : value;
  return validDate.toLocaleDateString(undefined, {
    timeZone: WAT_TIME_ZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Calculates a quick reminder preset from the current instant and returns it in WAT.
 */
export const getWATPresetMinutes = (minutes, now = new Date()) => {
  return toWATDatetimeLocal(new Date(now.getTime() + minutes * 60 * 1000));
};

/**
 * Calculates tomorrow at targetHour in West Africa Time.
 */
export const getWATTomorrowMorning = (targetHour = 9, now = new Date()) => {
  const { year, month, day } = getWATParts(now);
  const tomorrowAtWAT = new Date(0);
  tomorrowAtWAT.setUTCFullYear(Number(year), Number(month) - 1, Number(day) + 1);
  tomorrowAtWAT.setUTCHours(targetHour, 0, 0, 0);
  return toWATDatetimeLocal(new Date(tomorrowAtWAT.getTime() - WAT_OFFSET_MILLISECONDS));
};

/**
 * Formats the current time in West Africa Time.
 */
export const getWATCurrentTimeFormatted = () => {
  return formatWATDate(new Date(), { includeYear: false });
};

export const getWATDateKey = (date) => formatWATDateKey(date);

export const getWATTimezoneName = () => 'West Africa Time (WAT)';

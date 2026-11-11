/**
 * Time and timezone utilities using the user's device date and local timezone.
 */

/**
 * Returns the device's local timezone name (e.g. "America/Los_Angeles", "Europe/London", etc.)
 */
export const getDeviceTimezoneName = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Device Local Time';
  } catch {
    return 'Device Local Time';
  }
};

/**
 * Converts a Date object or timestamp into YYYY-MM-DDTHH:mm string in device local time
 * suitable for <input type="datetime-local" />.
 */
export const toDeviceDatetimeLocal = (date = new Date()) => {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const validDate = isNaN(d.getTime()) ? new Date() : d;

  const pad = (n) => String(n).padStart(2, '0');
  const year = validDate.getFullYear();
  const month = pad(validDate.getMonth() + 1);
  const day = pad(validDate.getDate());
  const hours = pad(validDate.getHours());
  const minutes = pad(validDate.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Parses a date or datetime string into epoch milliseconds using the device's local time.
 */
export const parseDeviceDatetimeToMillis = (datetimeStr) => {
  if (!datetimeStr) return NaN;
  if (typeof datetimeStr === 'number') return datetimeStr;

  const str = String(datetimeStr).trim();
  // If string already has a UTC indicator (Z) or explicit offset (+XX:XX or -XX:XX)
  if (/[zZ]$|[+-]\d{2}(:?\d{2})?$/.test(str)) {
    return new Date(str).getTime();
  }

  // If standard YYYY-MM-DDTHH:mm or YYYY-MM-DDTHH:mm:ss without timezone offset
  const match = str.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?/);
  if (match) {
    const [, y, m, d, h, min, s] = match;
    return new Date(Number(y), Number(m) - 1, Number(d), Number(h), Number(min), Number(s || 0)).getTime();
  }

  return new Date(str).getTime();
};

/**
 * Formats a date/timestamp or datetime string into a clean string using the device's date and locale.
 * e.g. "Wed, 11 Nov 2026, 02:30 AM" or "11 Nov, 02:30 AM".
 */
export const formatDeviceDate = (
  dateInput,
  { includeYear = false, includeSeconds = false, includeWeekday = false } = {}
) => {
  if (!dateInput) return '';

  let dateObj;
  if (typeof dateInput === 'string') {
    const millis = parseDeviceDatetimeToMillis(dateInput);
    dateObj = new Date(millis);
  } else {
    dateObj = new Date(dateInput);
  }

  if (isNaN(dateObj.getTime())) {
    return String(dateInput);
  }

  const formatted = dateObj.toLocaleString(undefined, {
    ...(includeWeekday ? { weekday: 'short' } : {}),
    day: 'numeric',
    month: 'short',
    ...(includeYear ? { year: 'numeric' } : {}),
    hour: '2-digit',
    minute: '2-digit',
    ...(includeSeconds ? { second: '2-digit' } : {}),
    hour12: true,
  });

  return formatted.replace(/\b(am|pm)\b/i, (m) => m.toUpperCase());
};

/**
 * Returns today's device date only formatted (e.g. "Wed, 11 Nov 2026").
 */
export const getDeviceTodayFormatted = (date = new Date()) => {
  const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
  const valid = isNaN(d.getTime()) ? new Date() : d;
  return valid.toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Calculates a quick preset (e.g. +15m, +60m) based on current device date and returns datetime-local string.
 */
export const getDevicePresetMinutes = (minutes) => {
  const future = new Date(Date.now() + minutes * 60 * 1000);
  return toDeviceDatetimeLocal(future);
};

/**
 * Calculates tomorrow at targetHour (default 09:00 AM) based on the device date.
 */
export const getDeviceTomorrowMorning = (targetHour = 9) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(targetHour, 0, 0, 0);
  return toDeviceDatetimeLocal(tomorrow);
};

/**
 * Formats current device date and time for live banner display.
 */
export const getDeviceCurrentTimeFormatted = () => {
  return formatDeviceDate(new Date(), { includeYear: false, includeSeconds: false });
};

// Aliases for compatibility
export const formatGmtPlusOne = formatDeviceDate;
export const toGmtPlusOneDatetimeLocal = toDeviceDatetimeLocal;
export const parseGmtPlusOneToMillis = parseDeviceDatetimeToMillis;
export const getGmtPlusOnePresetMinutes = getDevicePresetMinutes;
export const getGmtPlusOneTomorrowMorning = getDeviceTomorrowMorning;
export const getCurrentGmtPlusOneFormatted = getDeviceCurrentTimeFormatted;

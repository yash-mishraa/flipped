/**
 * Pure calendar-date helpers.
 *
 * These functions operate on civil `YYYY-MM-DD` strings only. They never read
 * the host clock, the host timezone, or UTC, so date arithmetic can never drift
 * across DST boundaries or change depending on where the code runs.
 */

const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function daysInMonth(year: number, month: number): number {
  switch (month) {
    case 2:
      return isLeapYear(year) ? 29 : 28;
    case 4:
    case 6:
    case 9:
    case 11:
      return 30;
    default:
      return 31;
  }
}

/**
 * Validates a strict `YYYY-MM-DD` civil date (including real month lengths).
 */
export function isValidCalendarDate(value: string): boolean {
  const match = DATE_PATTERN.exec(value);
  if (!match) return false;

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return month >= 1 && month <= 12 && day >= 1 && day <= daysInMonth(year, month);
}

/**
 * Converts a civil date to a day number (days since 1970-01-01).
 * Uses Howard Hinnant's proleptic Gregorian algorithm, which is pure integer
 * arithmetic and is therefore independent of timezone and DST.
 */
export function calendarDateToDayNumber(dateStr: string): number {
  const [year, month, day] = dateStr.split("-").map(Number) as [number, number, number];
  const adjustedYear = year - (month <= 2 ? 1 : 0);
  const era = Math.floor(adjustedYear / 400);
  const yearOfEra = adjustedYear - era * 400;
  const dayOfYear = Math.floor((153 * (month + (month > 2 ? -3 : 9)) + 2) / 5) + day - 1;
  const dayOfEra =
    yearOfEra * 365 + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100) + dayOfYear;
  return era * 146097 + dayOfEra - 719468;
}

/**
 * Converts a day number (days since 1970-01-01) back to a civil date.
 */
export function dayNumberToCalendarDate(dayNumber: number): string {
  const shifted = dayNumber + 719468;
  const era = Math.floor(shifted / 146097);
  const dayOfEra = shifted - era * 146097;
  const yearOfEra = Math.floor(
    (dayOfEra -
      Math.floor(dayOfEra / 1460) +
      Math.floor(dayOfEra / 36524) -
      Math.floor(dayOfEra / 146096)) /
      365
  );
  const year = yearOfEra + era * 400;
  const dayOfYear =
    dayOfEra - (365 * yearOfEra + Math.floor(yearOfEra / 4) - Math.floor(yearOfEra / 100));
  const monthPrime = Math.floor((5 * dayOfYear + 2) / 153);
  const day = dayOfYear - Math.floor((153 * monthPrime + 2) / 5) + 1;
  const month = monthPrime + (monthPrime < 10 ? 3 : -9);

  return `${year + (month <= 2 ? 1 : 0)}-${pad2(month)}-${pad2(day)}`;
}

/**
 * Adds (or subtracts) whole calendar days from a civil date.
 */
export function addCalendarDays(dateStr: string, days: number): string {
  if (!isValidCalendarDate(dateStr)) return dateStr;
  return dayNumberToCalendarDate(calendarDateToDayNumber(dateStr) + days);
}

/**
 * Increments a `YYYY-MM-DD` date string by one calendar day.
 */
export function nextCalendarDate(dateStr: string): string {
  return addCalendarDays(dateStr, 1);
}

/**
 * Decrements a `YYYY-MM-DD` date string by one calendar day.
 */
export function previousCalendarDate(dateStr: string): string {
  return addCalendarDays(dateStr, -1);
}

/**
 * Calculates the number of calendar days from `fromDate` to `toDate`.
 */
export function daysBetweenCalendarDates(fromDate: string, toDate: string): number {
  if (!isValidCalendarDate(fromDate) || !isValidCalendarDate(toDate)) return 0;
  return calendarDateToDayNumber(toDate) - calendarDateToDayNumber(fromDate);
}

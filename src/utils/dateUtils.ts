/**
 * Date Utilities
 * 
 * Helper functions for date calculations and formatting.
 */

/**
 * Calculates number of weeks between two dates
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of weeks (rounded up), or 0 if endDate < startDate
 */
export function calculateWeeksBetweenDates(startDate: Date, endDate: Date): number {
  // Guard against invalid date ranges
  if (endDate < startDate) {
    console.warn('[calculateWeeksBetweenDates] End date is before start date. Returning 0.');
    return 0;
  }
  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
  return Math.ceil(daysDiff / 7);
}

/**
 * Formats a date as YYYY-MM-DD
 */
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a date string (YYYY-MM-DD) to Date object
 */
export function parseDate(dateString: string): Date {
  return new Date(dateString);
}

/**
 * Checks if a date is valid
 */
export function isValidDate(date: Date): boolean {
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * Gets the current date without time
 */
export function getTodayDate(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Adds days to a date
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * Adds weeks to a date
 */
export function addWeeks(date: Date, weeks: number): Date {
  return addDays(date, weeks * 7);
}

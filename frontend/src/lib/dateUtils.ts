/**
 * Utility functions for consistent date handling across the app
 * Ensures timezone-aware date comparisons
 */

/**
 * Get today's date at midnight (00:00:00) in local timezone
 * Used as the baseline for comparing event dates
 */
export function getTodayAtMidnight(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

/**
 * Parse a date string (YYYY-MM-DD or ISO format) as a local date, not UTC
 * Also handles Date objects from the database
 * Prevents timezone offset issues
 */
export function parseLocalDate(dateString: string | Date): Date {
  // If it's already a Date object from the database, convert to YYYY-MM-DD string
  if (dateString instanceof Date) {
    // Use toISOString() to get a consistent format, then extract the date part
    const isoString = dateString.toISOString();
    dateString = isoString.split('T')[0];
  }

  if (!dateString || typeof dateString !== 'string') {
    console.warn('Invalid date provided to parseLocalDate:', dateString);
    return new Date(NaN);
  }

  // Handle ISO format (2026-04-03T00:00:00Z or 2026-04-03T00:00:00)
  if (dateString.includes('T')) {
    dateString = dateString.split('T')[0];
  }

  const parts = dateString.split('-').map(p => parseInt(p, 10));
  
  if (parts.length !== 3 || parts.some(isNaN)) {
    console.warn('Invalid date format:', dateString);
    return new Date(NaN);
  }

  const [year, month, day] = parts;
  const date = new Date(year, month - 1, day);
  date.setHours(0, 0, 0, 0);
  return date;
}

/**
 * Calculate days until/since an event
 * Negative = event has passed
 * 0 = today
 * Positive = days until event
 * Large positive number (999) = invalid date or error
 */
export function getDaysFromToday(eventDateString: string | Date): number {
  if (!eventDateString) {
    console.warn('getDaysFromToday called with empty date');
    return 999;
  }

  const today = getTodayAtMidnight();
  const eventDate = parseLocalDate(eventDateString);
  
  // Check if parsing failed
  if (isNaN(eventDate.getTime())) {
    console.warn('Failed to parse event date:', eventDateString);
    return 999;
  }

  const diffTime = eventDate.getTime() - today.getTime();
  // Use round() to properly handle boundary cases:
  // - If event is today (±12 hours), it rounds to 0
  // - If event was yesterday, it rounds to -1
  // - If event is tomorrow, it rounds to 1
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  // Debug logging (remove in production)
  if ((typeof eventDateString === 'string' && (eventDateString.includes('2026-04') || eventDateString.includes('2026-05'))) || eventDateString instanceof Date) {
    console.debug('Date calc:', {
      eventDateInput: eventDateString,
      today: today.toISOString(),
      eventDate: eventDate.toISOString(),
      diffTime,
      diffDays
    });
  }
  
  return diffDays;
}

/**
 * Get human-readable status label for an event
 */
export function getEventStatusLabel(eventDateString: string | Date): string {
  const daysFromToday = getDaysFromToday(eventDateString);
  
  // Handle error case (invalid date)
  if (daysFromToday === 999) {
    return 'Invalid Date';
  }
  
  // Handle passed events (strictly less than 0)
  if (daysFromToday < 0) {
    const daysPassed = Math.abs(daysFromToday);
    return daysPassed === 1 ? 'Yesterday' : `${daysPassed} days ago`;
  }
  
  if (daysFromToday === 0) return 'Today';
  if (daysFromToday === 1) return 'Tomorrow';
  if (daysFromToday <= 7) return `In ${daysFromToday} days`;
  if (daysFromToday <= 30) return `In ${Math.ceil(daysFromToday / 7)} weeks`;
  return `In ${Math.ceil(daysFromToday / 30)} months`;
}

/**
 * Check if an event has passed
 */
export function hasEventPassed(eventDateString: string | Date): boolean {
  const days = getDaysFromToday(eventDateString);
  return days < 0; // Only return true if explicitly negative
}

/**
 * Check if an event is today
 */
export function isEventToday(eventDateString: string | Date): boolean {
  return getDaysFromToday(eventDateString) === 0;
}

/**
 * Check if an event is in the future
 */
export function isEventUpcoming(eventDateString: string | Date): boolean {
  return getDaysFromToday(eventDateString) > 0;
}

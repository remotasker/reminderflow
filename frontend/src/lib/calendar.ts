interface CalendarEvent {
  title: string;
  description: string;
  date: string;
  time: string;
  timezone: string;
  meetingLink: string;
}

/**
 * Generate Google Calendar link
 */
export function generateGoogleCalendarLink(event: CalendarEvent): string {
  const eventDate = new Date(`${event.date}T${event.time}`);
  const startTime = eventDate.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');
  const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000); // 1 hour duration
  const endTime = endDate.toISOString().replace(/[-:]/g, '').replace(/\.\d+/, '');

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: event.title,
    details: event.description,
    dates: `${startTime}/${endTime}`,
    location: event.meetingLink || '',
    ctz: event.timezone,
  });

  return `https://www.google.com/calendar/render?${params.toString()}`;
}

/**
 * Generate Outlook calendar link
 */
export function generateOutlookCalendarLink(event: CalendarEvent): string {
  const eventDate = new Date(`${event.date}T${event.time}`);
  const startTime = eventDate.toISOString();
  const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000);
  const endTime = endDate.toISOString();

  const params = new URLSearchParams({
    path: '/calendar/action/compose',
    rru: 'addevent',
    startdt: startTime,
    enddt: endTime,
    subject: event.title,
    body: event.description,
    location: event.meetingLink || '',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

/**
 * Generate iCalendar (.ics) file content
 */
export function generateICalendar(event: CalendarEvent): string {
  const eventDate = new Date(`${event.date}T${event.time}`);
  const startTime = formatICalendarDate(eventDate);
  const endDate = new Date(eventDate.getTime() + 60 * 60 * 1000);
  const endTime = formatICalendarDate(endDate);

  const uid = `reminderflow-${Date.now()}@reminderflow.app`;

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//ReminderFlow//Event Calendar//EN
CALSCALE:GREGORIAN
METHOD:PUBLISH
BEGIN:VEVENT
UID:${uid}
DTSTAMP:${formatICalendarDate(new Date())}
DTSTART:${startTime}
DTEND:${endTime}
SUMMARY:${escapeICalendarText(event.title)}
DESCRIPTION:${escapeICalendarText(event.description)}
LOCATION:${escapeICalendarText(event.meetingLink || 'Online')}
TZID:${event.timezone}
STATUS:CONFIRMED
SEQUENCE:0
END:VEVENT
END:VCALENDAR`;
}

/**
 * Download iCalendar file
 */
export function downloadCalendarFile(event: CalendarEvent): void {
  const icsContent = generateICalendar(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', `${event.title.replace(/\s+/g, '_')}.ics`);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Format date for iCalendar
 */
function formatICalendarDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Escape special characters for iCalendar format
 */
function escapeICalendarText(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

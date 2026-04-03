// utils/emailThemes.ts

export interface EmailData {
  attendeeName:   string;
  eventTitle:     string;
  eventDate:      string;   // display string e.g. "April 17, 2026"
  eventTime:      string;   // display string e.g. "2:30 PM"
  rawDate?:       string;   // ISO date "2026-04-17" — used for calendar links
  rawTime?:       string;   // 24-hr time "14:30"    — used for calendar links
  location:       string;
  joinLink:       string;
  customMessage?: string;
  brandPrimary:   string;
  brandSecondary: string;
  organizerName:  string;
  emailType?:     string;
}

// ── Per email-type copy ────────────────────────────────────────────────────

interface EmailTypeCopy {
  headline:   string;
  subheading: string;
  body:       string;
  cta:        string;
}

function getTypeCopy(emailType: string, data: EmailData): EmailTypeCopy {
  switch (emailType) {
    case '24h':
      return {
        headline:   'Your event is tomorrow',
        subheading: `A friendly reminder about ${data.eventTitle}`,
        body:       `Just a heads-up — <strong>${data.eventTitle}</strong> is happening tomorrow, <strong>${data.eventDate}</strong> at <strong>${data.eventTime}</strong>. Make sure you have everything ready to go!`,
        cta:        'View Event Details',
      };
    case '1h':
      return {
        headline:   'Starting in 1 hour',
        subheading: `${data.eventTitle} is almost here`,
        body:       `<strong>${data.eventTitle}</strong> kicks off in just one hour at <strong>${data.eventTime}</strong>. Click the button below to join when you are ready.`,
        cta:        'Join Now',
      };
    case '10m':
      return {
        headline:   'Starting in 10 minutes!',
        subheading: `Time to join ${data.eventTitle}`,
        body:       `<strong>${data.eventTitle}</strong> is starting in 10 minutes. Do not be late — click the link below to join right now.`,
        cta:        'Join Now',
      };
    case 'confirmation':
    default:
      return {
        headline:   `You're registered for ${data.eventTitle}!`,
        subheading: 'We look forward to seeing you',
        body:       `Hi ${data.attendeeName}, your spot is confirmed. Here are your event details — add it to your calendar so you do not miss it.`,
        cta:        'Access Event',
      };
  }
}

// ── Calendar link helpers ──────────────────────────────────────────────────
// rawDate (YYYY-MM-DD) + rawTime (HH:MM) are always parseable.
// Display strings like "April 17, 2026" cannot reliably be turned back
// into Date objects — hence the separate raw fields.

function buildDateRange(data: EmailData): { start: Date; end: Date } | null {
  try {
    const dateStr = data.rawDate ?? '';
    const timeStr = data.rawTime ?? '00:00';
    if (!dateStr) return null;
    const start = new Date(`${dateStr}T${timeStr}:00`);
    if (isNaN(start.getTime())) return null;
    return { start, end: new Date(start.getTime() + 60 * 60 * 1000) };
  } catch {
    return null;
  }
}

function fmtIso(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
}

function escIcal(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, '\\;')
    .replace(/\n/g, '\\n');
}

function buildGoogleCalLink(data: EmailData): string {
  const range = buildDateRange(data);
  if (!range) return 'https://calendar.google.com';

  const params = new URLSearchParams({
    action:   'TEMPLATE',
    text:     data.eventTitle,
    dates:    `${fmtIso(range.start)}/${fmtIso(range.end)}`,
    details:  data.joinLink ? `Join here: ${data.joinLink}` : '',
    location: data.location || data.joinLink || '',
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookCalLink(data: EmailData): string {
  const range = buildDateRange(data);
  if (!range) return 'https://outlook.live.com/calendar';

  const params = new URLSearchParams({
    path:     '/calendar/action/compose',
    rru:      'addevent',
    startdt:  range.start.toISOString(),
    enddt:    range.end.toISOString(),
    subject:  data.eventTitle,
    body:     data.joinLink ? `Join here: ${data.joinLink}` : '',
    location: data.location || data.joinLink || '',
  });

  return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`;
}

function buildIcsDataUri(data: EmailData): string {
  const range = buildDateRange(data);
  if (!range) return '#';

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//ReminderFlow//Event//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:reminderflow-${Date.now()}@reminderflow.app`,
    `DTSTAMP:${fmtIso(new Date())}`,
    `DTSTART:${fmtIso(range.start)}`,
    `DTEND:${fmtIso(range.end)}`,
    `SUMMARY:${escIcal(data.eventTitle)}`,
    `DESCRIPTION:${escIcal(data.joinLink ? `Join here: ${data.joinLink}` : '')}`,
    `LOCATION:${escIcal(data.location || data.joinLink || 'Online')}`,
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return `data:text/calendar;charset=utf8,${encodeURIComponent(ics)}`;
}

// ── Calendar buttons HTML ──────────────────────────────────────────────────

function calendarButtonsHtml(data: EmailData, darkMode = false): string {
  const googleLink  = buildGoogleCalLink(data);
  const outlookLink = buildOutlookCalLink(data);
  const appleLink   = buildIcsDataUri(data);

  const bg     = darkMode ? '#1e293b' : '#ffffff';
  const border  = darkMode ? '#334155' : '#e2e8f0';
  const color   = darkMode ? '#e2e8f0' : '#374151';
  const label   = darkMode ? '#94a3b8' : '#64748b';

  const btn = `display:inline-flex;align-items:center;gap:6px;padding:10px 16px;background-color:${bg};color:${color};border:1px solid ${border};border-radius:8px;text-decoration:none;font-size:13px;font-weight:600;margin:0 8px 8px 0;`;

  return `
<div style="margin-top:28px;">
  <p style="margin:0 0 12px 0;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.07em;color:${label};">
    Add to your calendar
  </p>
  <div>
    <a href="${googleLink}" target="_blank" style="${btn}">
      <img src="https://ssl.gstatic.com/calendar/images/dynamiclogo_2020q4/calendar_20_2x.png"
           width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;" />
      Google Calendar
    </a>
    <a href="${outlookLink}" target="_blank" style="${btn}">
      <img src="https://res.cdn.office.net/assets/mail/pwa/v1/t3/icons/logo/img-outlook-logo-blue.png"
           width="16" height="16" alt="" style="display:inline-block;vertical-align:middle;" />
      Outlook
    </a>
    <a href="${appleLink}" style="${btn}">
      <span style="font-size:15px;line-height:1;vertical-align:middle;">🗓</span>
      Apple Calendar
    </a>
  </div>
</div>`;
}

// ── Urgency bar ────────────────────────────────────────────────────────────

function urgencyBarHtml(emailType: string): string {
  if (emailType === '10m') {
    return `<div style="padding:10px 32px;background-color:#ef4444;text-align:center;">
  <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.05em;">&#9200; STARTING IN 10 MINUTES</p>
</div>`;
  }
  if (emailType === '1h') {
    return `<div style="padding:10px 32px;background-color:#f59e0b;text-align:center;">
  <p style="margin:0;color:#ffffff;font-size:13px;font-weight:700;letter-spacing:0.05em;">&#9200; STARTING IN 1 HOUR</p>
</div>`;
  }
  return '';
}

// ── Main export ────────────────────────────────────────────────────────────

export const getThemeHtml = (themeId: string, data: EmailData): string => {
  const emailType      = data.emailType || 'confirmation';
  const copy           = getTypeCopy(emailType, data);
  const isConfirmation = emailType === 'confirmation';
  const urgencyBar     = urgencyBarHtml(emailType);

  const customMessageHtml = data.customMessage
    ? `<div style="margin-bottom:24px;padding:16px;background-color:#f8fafc;border-left:4px solid ${data.brandPrimary};border-radius:4px;">
  <p style="margin:0;color:#334155;font-style:italic;font-size:15px;">"${data.customMessage}"</p>
</div>`
    : '';

  const themes: Record<string, string> = {

    // ── MINIMAL LIGHT ──────────────────────────────────────────────────
    minimal_light: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 20px;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;border:1px solid #e2e8f0;overflow:hidden;">
    <div style="padding:24px 32px;border-bottom:1px solid #f1f5f9;text-align:center;">
      <h2 style="margin:0;color:#0f172a;font-size:20px;">${data.organizerName}</h2>
    </div>
    ${urgencyBar}
    <div style="padding:32px;color:#334155;line-height:1.6;">
      <h1 style="margin:0 0 8px 0;color:#0f172a;font-size:24px;">${copy.headline}</h1>
      <p style="margin:0 0 24px 0;color:#64748b;font-size:15px;">${copy.subheading}</p>
      ${customMessageHtml}
      <p style="font-size:15px;margin:0 0 24px 0;">${copy.body}</p>
      <div style="background:#f8fafc;padding:24px;border-radius:8px;margin-bottom:24px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 10px 0;">&#128197; <strong>Date:</strong> ${data.eventDate}</p>
        <p style="margin:0 0 10px 0;">&#9200; <strong>Time:</strong> ${data.eventTime}</p>
        <p style="margin:0;">&#128205; <strong>Location:</strong> ${data.location}</p>
      </div>
      <div style="text-align:center;margin-bottom:8px;">
        <a href="${data.joinLink}" style="display:inline-block;background-color:${data.brandPrimary};color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
          ${copy.cta}
        </a>
      </div>
      ${isConfirmation ? calendarButtonsHtml(data, false) : ''}
    </div>
  </div>
</body>
</html>`,

    // ── MODERN DARK ────────────────────────────────────────────────────
    modern_dark: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 20px;background-color:#020617;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#0f172a;border-radius:12px;border:1px solid #1e293b;overflow:hidden;">
    <div style="padding:24px 32px;border-bottom:1px solid #1e293b;text-align:center;">
      <h2 style="margin:0;color:#f8fafc;font-size:20px;">${data.organizerName}</h2>
    </div>
    ${urgencyBar}
    <div style="padding:32px;color:#cbd5e1;line-height:1.6;">
      <h1 style="margin:0 0 8px 0;color:#f8fafc;font-size:24px;">${copy.headline}</h1>
      <p style="margin:0 0 24px 0;color:#94a3b8;font-size:15px;">${copy.subheading}</p>
      ${customMessageHtml}
      <p style="font-size:15px;margin:0 0 24px 0;">${copy.body}</p>
      <div style="background:#1e293b;padding:24px;border-radius:8px;margin-bottom:24px;border:1px solid #334155;">
        <p style="margin:0 0 10px 0;color:#f8fafc;">&#128197; <strong>Date:</strong> ${data.eventDate}</p>
        <p style="margin:0 0 10px 0;color:#f8fafc;">&#9200; <strong>Time:</strong> ${data.eventTime}</p>
        <p style="margin:0;color:#f8fafc;">&#128205; <strong>Location:</strong> ${data.location}</p>
      </div>
      <div style="text-align:center;margin-bottom:8px;">
        <a href="${data.joinLink}" style="display:inline-block;background-color:${data.brandPrimary};color:#ffffff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;">
          ${copy.cta}
        </a>
      </div>
      ${isConfirmation ? calendarButtonsHtml(data, true) : ''}
    </div>
  </div>
</body>
</html>`,

    // ── BRAND HEAVY ────────────────────────────────────────────────────
    brand_heavy: `<!DOCTYPE html>
<html>
<body style="margin:0;padding:40px 20px;background-color:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;">
    <div style="padding:40px 32px;background-color:${data.brandPrimary};text-align:center;">
      <h2 style="margin:0 0 8px 0;color:#ffffff;font-size:28px;line-height:1.2;">${copy.headline}</h2>
      <p style="margin:0;color:rgba(255,255,255,0.8);font-size:15px;">Hosted by ${data.organizerName}</p>
    </div>
    ${urgencyBar}
    <div style="padding:32px;color:#334155;line-height:1.6;">
      ${customMessageHtml}
      <p style="font-size:15px;margin:0 0 24px 0;">${copy.body}</p>
      <div style="background:#f8fafc;padding:20px;border-radius:8px;margin-bottom:24px;border:1px solid #e2e8f0;">
        <p style="margin:0 0 10px 0;">&#128197; <strong>Date:</strong> ${data.eventDate}</p>
        <p style="margin:0 0 10px 0;">&#9200; <strong>Time:</strong> ${data.eventTime}</p>
        <p style="margin:0;">&#128205; <strong>Location:</strong> ${data.location}</p>
      </div>
      <div style="text-align:center;margin-bottom:8px;">
        <a href="${data.joinLink}" style="display:inline-block;background-color:${data.brandSecondary};color:#ffffff;padding:16px 40px;text-decoration:none;border-radius:50px;font-weight:600;font-size:16px;">
          ${copy.cta}
        </a>
      </div>
      ${isConfirmation ? calendarButtonsHtml(data, false) : ''}
    </div>
  </div>
</body>
</html>`,
  };

  return themes[themeId] ?? themes.minimal_light;
};
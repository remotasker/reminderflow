// services/emailThemes.ts

export interface EmailData {
  attendeeName: string;
  eventTitle: string;
  eventDate: string;
  eventTime: string;
  rawDate: string;   // "YYYY-MM-DD"  — used for calendar link
  rawTime: string;   // "HH:MM"       — used for calendar link
  location: string;
  joinLink: string;
  customMessage?: string;
  brandPrimary: string;
  brandSecondary: string;
  organizerName: string;
  emailType?: string; // 'confirmation' | '24h' | '1h' | '10m'
}

// ---------------------------------------------------------------------------
// Google Calendar link helper
// ---------------------------------------------------------------------------
function buildGoogleCalendarLink(data: EmailData): string {
  // Build a naive UTC datetime string from raw date + time
  const start = `${data.rawDate}T${data.rawTime}:00`.replace(/[-:]/g, '');
  // Default 1-hour duration
  const [h, m] = data.rawTime.split(':').map(Number);
  const endH = String(h + 1).padStart(2, '0');
  const end = `${data.rawDate}T${endH}:${String(m).padStart(2, '0')}:00`.replace(/[-:]/g, '');
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: data.eventTitle,
    dates: `${start}/${end}`,
    details: data.joinLink || '',
    location: data.location || '',
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ---------------------------------------------------------------------------
// Intro text based on email type
// ---------------------------------------------------------------------------
function getIntroLine(emailType: string | undefined, organizerName: string): string {
  switch (emailType) {
    case '24h':
      return `This is a reminder that your event starts <strong>tomorrow</strong>.`;
    case '1h':
      return `Your event is starting in <strong>1 hour</strong>. Get ready!`;
    case '10m':
      return `Your event begins in <strong>10 minutes</strong>. Join now!`;
    default:
      return `You are invited to our ${organizerName} webinar:`;
  }
}

// ---------------------------------------------------------------------------
// Urgency label for reminders
// ---------------------------------------------------------------------------
function getUrgencyBadge(emailType: string | undefined, primaryColor: string): string {
  const labels: Record<string, string> = {
    '24h':  '⏰ Reminder: Tomorrow',
    '1h':   '⚡ Starting in 1 Hour',
    '10m':  '🔴 Starting in 10 Minutes',
  };
  const label = emailType ? labels[emailType] : null;
  if (!label) return '';
  return `
    <div style="text-align:center; margin-bottom: 20px;">
      <span style="display:inline-block; background-color:${primaryColor}1a; color:${primaryColor};
                   border:1px solid ${primaryColor}4d; border-radius:999px;
                   padding:6px 18px; font-size:13px; font-weight:700; letter-spacing:0.02em;">
        ${label}
      </span>
    </div>`;
}

// ---------------------------------------------------------------------------
// Shared shared HTML blocks (buttons, sign-off, footer)
// ---------------------------------------------------------------------------
function buildButtons(
  data: EmailData,
  joinBg: string,
  calBg: string,
  joinTextColor: string,
  calTextColor: string
): string {
  const calLink = buildGoogleCalendarLink(data);
  return `
    <div style="text-align: center; margin: 28px 0 8px 0;">
      <a href="${data.joinLink}"
         style="display:inline-block; background-color:${joinBg}; color:${joinTextColor};
                padding:14px 36px; text-decoration:none; border-radius:8px;
                font-weight:700; font-size:15px; margin-bottom:12px;">
        Join Meeting
      </a>
    </div>
    <div style="text-align: center; margin-bottom: 8px;">
      <a href="${calLink}"
         style="display:inline-block; background-color:${calBg}; color:${calTextColor};
                padding:12px 30px; text-decoration:none; border-radius:8px;
                font-weight:600; font-size:14px;">
        Add to Google Calendar
      </a>
    </div>`;
}

function buildFallback(joinLink: string, linkColor: string): string {
  return `
    <p style="margin: 20px 0 0 0; font-size:13px; color:#64748b;">
      If button fails, open:<br>
      <a href="${joinLink}" style="color:${linkColor}; word-break:break-all;">${joinLink}</a>
    </p>`;
}

function buildSignOff(organizerName: string, orgColor: string): string {
  return `
    <p style="margin: 28px 0 4px 0; font-size:15px; color: inherit;">Warm regards,</p>
    <p style="margin: 0; font-weight: 700; font-size:15px; color:${orgColor};">${organizerName}</p>`;
}

function buildFooter(organizerName: string, textColor: string): string {
  return `
    <div style="padding: 16px 32px; text-align: center;">
      <p style="margin:0; font-size:12px; color:${textColor};">
        You received this because you subscribed to ${organizerName} updates.
      </p>
    </div>`;
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------
export const getThemeHtml = (themeId: string, data: EmailData): string => {
  const introLine = getIntroLine(data.emailType, data.organizerName);

  const customMessageHtml = data.customMessage
    ? `<div style="margin-bottom:20px; padding:14px 16px; background-color:#f8fafc;
                   border-left:4px solid ${data.brandPrimary}; border-radius:4px;">
         <p style="margin:0; color:#334155; font-style:italic; font-size:14px;">"${data.customMessage}"</p>
       </div>`
    : '';

  const themes: Record<string, string> = {
    // -----------------------------------------------------------------------
    // THEME 1: MINIMAL LIGHT (default)
    // -----------------------------------------------------------------------
    minimal_light: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0; padding:40px 20px; background-color:#f1f5f9;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px;
              border:1px solid #e2e8f0; overflow:hidden;">

    <!-- HEADER -->
    <div style="background: linear-gradient(135deg, ${data.brandPrimary} 0%, ${data.brandSecondary} 100%);
                padding: 36px 32px; text-align:center;">
      <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:700; letter-spacing:0.01em;">
        ${data.eventTitle}
      </h1>
    </div>

    <!-- BODY -->
    <div style="padding:32px 32px 8px 32px; color:#334155; line-height:1.7; font-size:15px;">
      ${getUrgencyBadge(data.emailType, data.brandPrimary)}

      <p style="margin:0 0 6px 0;">Hi <strong>${data.attendeeName}</strong>,</p>
      <p style="margin:0 0 20px 0;">${introLine}</p>

      ${customMessageHtml}

      <h2 style="margin:0 0 16px 0; color:${data.brandPrimary}; font-size:20px; font-weight:800;
                 text-transform:uppercase; letter-spacing:0.03em;">
        ${data.eventTitle}
      </h2>

      <!-- DETAILS CARD -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:8px;
                  padding:20px 24px; margin-bottom:4px;">
        <p style="margin:0 0 8px 0;"><strong>Speaker:</strong> ${data.organizerName}</p>
        <p style="margin:0 0 8px 0;"><strong>Date:</strong> ${data.eventDate}</p>
        <p style="margin:0 0 8px 0;"><strong>Time:</strong> ${data.eventTime}</p>
        <p style="margin:0;"><strong>Location:</strong> ${data.location}</p>
      </div>

      ${buildButtons(data, data.brandPrimary, data.brandSecondary, '#ffffff', '#ffffff')}
      ${buildFallback(data.joinLink, data.brandPrimary)}
      ${buildSignOff(data.organizerName, data.brandPrimary)}
    </div>

    ${buildFooter(data.organizerName, '#94a3b8')}
  </div>
</body>
</html>`,

    // -----------------------------------------------------------------------
    // THEME 2: MODERN DARK
    // -----------------------------------------------------------------------
    modern_dark: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0; padding:40px 20px; background-color:#020617;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#0f172a; border-radius:12px;
              border:1px solid #1e293b; overflow:hidden;">

    <!-- HEADER -->
    <div style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%);
                border-bottom: 1px solid ${data.brandPrimary}40;
                padding: 36px 32px; text-align:center;">
      <h1 style="margin:0; color:#f8fafc; font-size:22px; font-weight:700; letter-spacing:0.01em;">
        ${data.eventTitle}
      </h1>
    </div>

    <!-- BODY -->
    <div style="padding:32px 32px 8px 32px; color:#cbd5e1; line-height:1.7; font-size:15px;">
      ${getUrgencyBadge(data.emailType, data.brandPrimary)}

      <p style="margin:0 0 6px 0; color:#f8fafc;">Hi <strong>${data.attendeeName}</strong>,</p>
      <p style="margin:0 0 20px 0;">${introLine}</p>

      ${customMessageHtml}

      <h2 style="margin:0 0 16px 0; color:${data.brandPrimary}; font-size:20px; font-weight:800;
                 text-transform:uppercase; letter-spacing:0.03em;">
        ${data.eventTitle}
      </h2>

      <!-- DETAILS CARD -->
      <div style="background:#1e293b; border:1px solid #334155; border-radius:8px;
                  padding:20px 24px; margin-bottom:4px; color:#f8fafc;">
        <p style="margin:0 0 8px 0;"><strong>Speaker:</strong> ${data.organizerName}</p>
        <p style="margin:0 0 8px 0;"><strong>Date:</strong> ${data.eventDate}</p>
        <p style="margin:0 0 8px 0;"><strong>Time:</strong> ${data.eventTime}</p>
        <p style="margin:0;"><strong>Location:</strong> ${data.location}</p>
      </div>

      ${buildButtons(data, data.brandPrimary, '#334155', '#ffffff', '#f8fafc')}
      ${buildFallback(data.joinLink, data.brandPrimary)}
      ${buildSignOff(data.organizerName, data.brandPrimary)}
    </div>

    <div style="padding:16px 32px; text-align:center;">
      <p style="margin:0; font-size:12px; color:#475569;">
        You received this because you subscribed to ${data.organizerName} updates.
      </p>
    </div>
  </div>
</body>
</html>`,

    // -----------------------------------------------------------------------
    // THEME 3: BRAND HEAVY
    // -----------------------------------------------------------------------
    brand_heavy: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0; padding:40px 20px; background-color:#f1f5f9;
             font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:16px;
              overflow:hidden; box-shadow:0 10px 25px -5px rgba(0,0,0,0.1);">

    <!-- HEADER -->
    <div style="background: linear-gradient(135deg, ${data.brandPrimary} 0%, ${data.brandSecondary} 100%);
                padding: 40px 32px; text-align:center;">
      <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:800; letter-spacing:0.01em;
                 line-height:1.3;">
        ${data.eventTitle}
      </h1>
    </div>

    <!-- BODY -->
    <div style="padding:32px 32px 8px 32px; color:#334155; line-height:1.7; font-size:15px;">
      ${getUrgencyBadge(data.emailType, data.brandPrimary)}

      <p style="margin:0 0 6px 0;">Hi <strong>${data.attendeeName}</strong>,</p>
      <p style="margin:0 0 20px 0;">${introLine}</p>

      ${customMessageHtml}

      <h2 style="margin:0 0 16px 0; color:${data.brandPrimary}; font-size:20px; font-weight:800;
                 text-transform:uppercase; letter-spacing:0.03em;">
        ${data.eventTitle}
      </h2>

      <!-- DETAILS CARD -->
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:10px;
                  padding:20px 24px; margin-bottom:4px;">
        <p style="margin:0 0 8px 0;"><strong>Speaker:</strong> ${data.organizerName}</p>
        <p style="margin:0 0 8px 0;"><strong>Date:</strong> ${data.eventDate}</p>
        <p style="margin:0 0 8px 0;"><strong>Time:</strong> ${data.eventTime}</p>
        <p style="margin:0;"><strong>Location:</strong> ${data.location}</p>
      </div>

      ${buildButtons(data, data.brandPrimary, data.brandSecondary, '#ffffff', '#ffffff')}
      ${buildFallback(data.joinLink, data.brandPrimary)}
      ${buildSignOff(data.organizerName, data.brandPrimary)}
    </div>

    ${buildFooter(data.organizerName, '#94a3b8')}
  </div>
</body>
</html>`
  };

  return themes[themeId] ?? themes.minimal_light;
};
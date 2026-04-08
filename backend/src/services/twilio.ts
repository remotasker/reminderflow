// services/twilio.ts
// WhatsApp messaging via Twilio with Content Template API support.
// Content templates are required for business-initiated WhatsApp messages
// outside the 24-hour customer-initiated window.

import twilio from 'twilio';

export interface WhatsAppOptions {
  accountSid:   string;
  authToken:    string;
  fromNumber:   string;  // "whatsapp:+14155238886"
  // Optional content template SID (e.g. "HXb5b62575e6e4ff6129ad7c8efe1f983e")
  // If provided, the message is sent as a template message with variables.
  // If not provided, a plain-text fallback body is used.
  contentSid?:  string;
}

export interface WhatsAppEventData {
  attendeeName: string;
  eventTitle:   string;
  eventDate:    string;  // display string "April 17, 2026"
  eventTime:    string;  // display string "2:00 PM"
  meetingLink:  string;
  emailType:    string;  // "confirmation" | "24h" | "1h" | "10m"
}

// ── Plain-text fallback messages ──────────────────────────────────────────
// Used when no content template SID is configured.

function buildFallbackBody(data: WhatsAppEventData): string {
  const base = `Hi ${data.attendeeName}, this is a reminder about *${data.eventTitle}*.`;
  const details = `\n📅 ${data.eventDate} at ${data.eventTime}`;
  const link = data.meetingLink ? `\n🔗 ${data.meetingLink}` : '';

  switch (data.emailType) {
    case 'confirmation':
      return `✅ You're registered for *${data.eventTitle}*!\n\nHi ${data.attendeeName}, your spot is confirmed.${details}${link}`;
    case '24h':
      return `${base}\n\nYour event is *tomorrow*!${details}${link}`;
    case '1h':
      return `${base}\n\n⏰ Starting in *1 hour*!${details}${link}`;
    case '10m':
      return `${base}\n\n🚨 Starting in *10 minutes*! Join now:${link}`;
    default:
      return `${base}${details}${link}`;
  }
}

// ── Content template variable mapping ─────────────────────────────────────
// Twilio content templates use {{1}}, {{2}} etc. as placeholders.
// The "Appointment Reminders" template uses:
//   {{1}} = date, {{2}} = time
// Adjust this map if you create custom templates with different variables.

function buildContentVariables(data: WhatsAppEventData): Record<string, string> {
  return {
    '1': data.eventDate,
    '2': data.eventTime,
    '3': data.eventTitle,
    '4': data.attendeeName,
    '5': data.meetingLink || 'Online',
  };
}

// ── Main send function ────────────────────────────────────────────────────

export interface WhatsAppResult {
  success:    boolean;
  messageSid?: string;
  error?:     string;
}

export async function sendWhatsAppReminder(
  toNumber:   string,   // raw number e.g. "+254743212158"
  data:       WhatsAppEventData,
  options:    WhatsAppOptions
): Promise<WhatsAppResult> {
  // Validate credentials
  if (!options.accountSid || !options.authToken || !options.fromNumber) {
    return { success: false, error: 'Twilio credentials not configured' };
  }

  // Validate phone number format
  const cleanTo = toNumber.trim();
  if (!cleanTo.startsWith('+')) {
    return { success: false, error: `Invalid WhatsApp number: must start with + and country code` };
  }

  const toWhatsApp   = `whatsapp:${cleanTo}`;
  const fromWhatsApp = options.fromNumber.startsWith('whatsapp:')
    ? options.fromNumber
    : `whatsapp:${options.fromNumber}`;

  try {
    const client = twilio(options.accountSid, options.authToken);

    let message;

    if (options.contentSid) {
      // ── Template message (preferred for business-initiated) ────────────
      message = await client.messages.create({
        from:             fromWhatsApp,
        to:               toWhatsApp,
        contentSid:       options.contentSid,
        contentVariables: JSON.stringify(buildContentVariables(data)),
      });
    } else {
      // ── Plain-text fallback ────────────────────────────────────────────
      // Only works within a 24-hour window of the customer messaging first,
      // or using sandbox mode.
      message = await client.messages.create({
        from: fromWhatsApp,
        to:   toWhatsApp,
        body: buildFallbackBody(data),
      });
    }

    console.log(`  ✓ WhatsApp ${data.emailType} sent to ${cleanTo} [${message.sid}]`);
    return { success: true, messageSid: message.sid };

  } catch (err: any) {
    const errorMessage =
      err?.message ||
      err?.code?.toString() ||
      'Unknown Twilio error';
    console.error(`  ✗ WhatsApp failed to ${cleanTo}: ${errorMessage}`);
    return { success: false, error: errorMessage };
  }
}

// ── Template SID resolver ─────────────────────────────────────────────────
// Returns the right template SID for a given email/reminder type.

export function resolveTemplateSid(
  emailType:    string,
  integrations: {
    twilioTemplateConfirmation: string;
    twilioTemplate24h:          string;
    twilioTemplate1h:           string;
    twilioTemplate10m:          string;
  }
): string | undefined {
  switch (emailType) {
    case 'confirmation': return integrations.twilioTemplateConfirmation || undefined;
    case '24h':          return integrations.twilioTemplate24h          || undefined;
    case '1h':           return integrations.twilioTemplate1h           || undefined;
    case '10m':          return integrations.twilioTemplate10m          || undefined;
    default:             return undefined;
  }
}
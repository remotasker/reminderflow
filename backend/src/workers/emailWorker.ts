// workers/emailWorker.ts
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';
import { toDateOnlyString } from '../services/reminders';
import { sendEmailFromQueue } from '../services/sendgrid';
import { sendWhatsAppReminder, resolveTemplateSid } from '../services/twilio';
import { getThemeHtml } from '../services/emailThemes';
import {
  getIntegrationSettings,
  getOrganizationProfileSettings,
  isWhatsAppTypeEnabled,
} from '../utils/settings';

dotenv.config();

const BATCH_SIZE   = 50;
const INTERVAL_MS  = 60 * 1000;
const MAX_ATTEMPTS = 3;

let isProcessing = false;

// ── Helpers ───────────────────────────────────────────────────────────────

function formatDisplayDate(isoDate: string): string {
  try {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

function formatDisplayTime(rawTime: string): string {
  try {
    const [h, m] = rawTime.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch {
    return rawTime;
  }
}

function toRawTime(dbTime: string): string {
  return (dbTime || '').slice(0, 5);
}

// ── Main processor ────────────────────────────────────────────────────────

async function processEmailQueue(): Promise<void> {
  if (isProcessing) {
    console.log(`[${new Date().toISOString()}] Skipping tick — previous batch still running`);
    return;
  }

  isProcessing = true;

  try {
    const result = await query(
      `SELECT
         eq.id,
         eq.attendee_email,
         eq.template_type,
         eq.email_theme_id,
         eq.whatsapp_number,
         a.name              AS attendee_name,
         a.whatsapp_number   AS attendee_whatsapp,
         e.title             AS event_title,
         e.event_date,
         e.event_time,
         e.meeting_link,
         e.timezone,
         e.id                AS event_id,
         a.id                AS attendee_id,
         eq.organization_id,
         o.name              AS organizer_name,
         o.primary_color,
         o.secondary_color,
         o.settings,
         t.theme_id          AS saved_theme_id,
         t.subject           AS saved_subject,
         t.custom_message    AS saved_custom_message
       FROM email_queue eq
       JOIN attendees    a  ON eq.attendee_id    = a.id
       JOIN events       e  ON eq.event_id       = e.id
       JOIN organizations o ON eq.organization_id = o.id
       LEFT JOIN email_templates t
         ON  t.organization_id = eq.organization_id
         AND t.type            = eq.template_type
       WHERE eq.status IN ('pending', 'failed')
         AND eq.send_at       <= CURRENT_TIMESTAMP
         AND eq.attempt_count  < $1
       ORDER BY eq.send_at ASC
       LIMIT $2`,
      [MAX_ATTEMPTS, BATCH_SIZE]
    );

    if (result.rows.length === 0) {
      isProcessing = false;
      return;
    }

    console.log(`[${new Date().toISOString()}] Processing ${result.rows.length} item(s)…`);

    let sent   = 0;
    let failed = 0;

    for (const row of result.rows) {
      try {
        // ── 1. Resolve settings ──────────────────────────────────────────
        const integrationSettings = getIntegrationSettings(row.settings);
        const profileSettings     = getOrganizationProfileSettings(row.settings);
        const themeId = row.email_theme_id || row.saved_theme_id || 'minimal_light';
        const displayName = profileSettings.fromName || row.organizer_name;

        // ── 2. Build shared event data ───────────────────────────────────
        const rawDate = toDateOnlyString(row.event_date);
        const rawTime = toRawTime(String(row.event_time));

        const emailData = {
          attendeeName:   row.attendee_name,
          eventTitle:     row.event_title,
          eventDate:      formatDisplayDate(rawDate),
          eventTime:      formatDisplayTime(rawTime),
          rawDate,
          rawTime,
          location:       row.meeting_link || 'Location TBD',
          joinLink:       row.meeting_link || '#',
          customMessage:  row.saved_custom_message || '',
          brandPrimary:   row.primary_color   || '#2563eb',
          brandSecondary: row.secondary_color || '#0ea5e9',
          organizerName:  displayName,
          emailType:      row.template_type,
        };

        // ── 3. Send email ────────────────────────────────────────────────
        const finalHtml    = getThemeHtml(themeId, emailData);
        const rawSubject   = row.saved_subject || 'Reminder: {{event_title}}';
        const finalSubject = rawSubject
          .replace(/\{\{event_title\}\}/g,   row.event_title)
          .replace(/\{\{attendee_name\}\}/g, row.attendee_name);

        const emailOutcome = await sendEmailFromQueue(
          row.id,
          row.attendee_email,
          finalSubject,
          finalHtml,
          {
            apiKey:    integrationSettings.sendgridApiKey,
            fromEmail: integrationSettings.sendgridFromEmail,
            fromName:  integrationSettings.sendgridFromName
                         || profileSettings.fromName
                         || row.organizer_name,
            replyTo:   profileSettings.replyToEmail,
          }
        );

        if (emailOutcome.success) {
          await query(
            `UPDATE email_queue SET status = 'sent', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [row.id]
          );

          const trackingId = uuidv4();
          await query(
            `INSERT INTO email_logs
               (id, organization_id, event_id, attendee_id, queue_id,
                recipient_email, template_type, sent_at, tracking_id)
             VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
             ON CONFLICT (tracking_id) DO NOTHING`,
            [
              uuidv4(), row.organization_id, row.event_id, row.attendee_id,
              row.id, row.attendee_email, row.template_type, trackingId,
            ]
          );

          console.log(`  ✓ Email ${row.template_type} → ${row.attendee_email}`);
          sent++;
        } else {
          const newCount  = (row.attempt_count ?? 0) + 1;
          const newStatus = newCount >= MAX_ATTEMPTS ? 'failed' : 'pending';
          await query(
            `UPDATE email_queue
             SET status = $1, attempt_count = $2, last_error = $3, updated_at = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [newStatus, newCount, emailOutcome.error, row.id]
          );
          console.error(`  ✗ Email failed (${newCount}/${MAX_ATTEMPTS}) → ${row.attendee_email}: ${emailOutcome.error}`);
          failed++;
        }

        // ── 4. Send WhatsApp (fire-and-forget alongside email) ───────────
        // WhatsApp is sent independently — an email failure does NOT block
        // WhatsApp, and a WhatsApp failure does NOT affect the email queue
        // status. Each channel is best-effort and logged separately.
        const whatsappNumber = row.whatsapp_number || row.attendee_whatsapp;
        const whatsappEnabled = isWhatsAppTypeEnabled(row.settings, row.template_type);

        if (
          whatsappNumber &&
          whatsappEnabled &&
          integrationSettings.twilioAccountSid &&
          integrationSettings.twilioAuthToken &&
          integrationSettings.twilioWhatsappFrom
        ) {
          const contentSid = resolveTemplateSid(row.template_type, integrationSettings);

          const waResult = await sendWhatsAppReminder(
            whatsappNumber,
            {
              attendeeName: row.attendee_name,
              eventTitle:   row.event_title,
              eventDate:    emailData.eventDate,
              eventTime:    emailData.eventTime,
              meetingLink:  row.meeting_link || '',
              emailType:    row.template_type,
            },
            {
              accountSid:  integrationSettings.twilioAccountSid,
              authToken:   integrationSettings.twilioAuthToken,
              fromNumber:  integrationSettings.twilioWhatsappFrom,
              contentSid,
            }
          );

          if (waResult.success) {
            // Log WhatsApp delivery separately
            await query(
              `INSERT INTO whatsapp_logs
                 (id, organization_id, event_id, attendee_id, queue_id,
                  recipient_number, template_type, message_sid, status)
               VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'sent')
               ON CONFLICT DO NOTHING`,
              [
                uuidv4(), row.organization_id, row.event_id, row.attendee_id,
                row.id, whatsappNumber, row.template_type, waResult.messageSid,
              ]
            ).catch((err) =>
              console.error('  ✗ Failed to write whatsapp_log:', err.message)
            );
          }
          // WhatsApp errors are already logged inside sendWhatsAppReminder
        }

      } catch (err: any) {
        const newCount  = (row.attempt_count ?? 0) + 1;
        const newStatus = newCount >= MAX_ATTEMPTS ? 'failed' : 'pending';
        await query(
          `UPDATE email_queue
           SET status = $1, attempt_count = $2, last_error = $3, updated_at = CURRENT_TIMESTAMP
           WHERE id = $4`,
          [newStatus, newCount, err.message ?? 'Unknown error', row.id]
        ).catch(() => {});
        console.error(`  ✗ Critical error on queue item ${row.id}:`, err);
        failed++;
      }
    }

    console.log(`[${new Date().toISOString()}] Done — sent: ${sent} | failed: ${failed}`);

  } catch (error) {
    console.error(`[${new Date().toISOString()}] Fatal worker error:`, error);
  } finally {
    isProcessing = false;
  }
}

// ── Entry points ──────────────────────────────────────────────────────────

export async function startWorker(): Promise<void> {
  console.log('[Worker] ReminderFlow worker started (email + WhatsApp)');
  await processEmailQueue();
  setInterval(processEmailQueue, INTERVAL_MS);
}

if (require.main === module) {
  startWorker().catch(err => {
    console.error('[Worker] Crashed on startup:', err);
    process.exit(1);
  });
}

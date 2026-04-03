// workers/emailWorker.ts
import * as dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';
import { sendEmailFromQueue } from '../services/sendgrid';
import { getThemeHtml } from '../services/emailThemes';
import { getIntegrationSettings, getOrganizationProfileSettings } from '../utils/settings';

dotenv.config();

const BATCH_SIZE   = 50;
const INTERVAL_MS  = 60 * 1000; // every 60 seconds
const MAX_ATTEMPTS = 3;

let isProcessing = false;

// ── Helpers ───────────────────────────────────────────────────────────────

/** "2026-04-17" → "Wednesday, April 17, 2026" */
function formatDisplayDate(isoDate: string): string {
  try {
    return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    });
  } catch {
    return isoDate;
  }
}

/** "14:30:00" → "2:30 PM" */
function formatDisplayTime(rawTime: string): string {
  try {
    const [h, m] = rawTime.split(':').map(Number);
    const ampm = h >= 12 ? 'PM' : 'AM';
    return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
  } catch {
    return rawTime;
  }
}

/** Strip the seconds part from a DB time value: "14:30:00" → "14:30" */
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
    // Fetch pending AND failed-but-retryable rows together.
    // status IN ('pending','failed') + attempt_count < MAX_ATTEMPTS
    // ensures we pick up retries without a separate job.
    const result = await query(
      `SELECT
         eq.id,
         eq.attendee_email,
         eq.template_type,
         eq.email_theme_id,
         a.name              AS attendee_name,
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

    console.log(`[${new Date().toISOString()}] Processing ${result.rows.length} email(s)…`);

    let sent   = 0;
    let failed = 0;

    for (const row of result.rows) {
      try {
        // ── 1. Resolve theme ID ──────────────────────────────────────────
        // Priority: per-queue theme > org template theme > default
        const themeId = row.email_theme_id || row.saved_theme_id || 'minimal_light';

        // ── 2. Resolve org settings early (needed for organizerName) ────
        const integrationSettings = getIntegrationSettings(row.settings);
        const profileSettings     = getOrganizationProfileSettings(row.settings);

        // ── 3. Build email data ──────────────────────────────────────────
        // event_date arrives as a JS Date object from pg — use toISOString()
        // so slice(0,10) reliably yields "YYYY-MM-DD" not "Wed Apr 02…"
        const rawDate = row.event_date instanceof Date
          ? row.event_date.toISOString().split('T')[0]
          : String(row.event_date).split('T')[0];
        const rawTime = toRawTime(String(row.event_time)); // "14:30"

        // Use the organiser's display name from Settings (fromName) when set,
        // falling back to the raw organisation name stored in the DB.
        const displayName = profileSettings.fromName || row.organizer_name;

        const emailData = {
          attendeeName:   row.attendee_name,
          eventTitle:     row.event_title,
          eventDate:      formatDisplayDate(rawDate),
          eventTime:      formatDisplayTime(rawTime),
          // Raw ISO values for calendar link generation
          rawDate,
          rawTime,
          location:       row.meeting_link || 'Location TBD',
          joinLink:       row.meeting_link || '#',
          customMessage:  row.saved_custom_message || '',
          brandPrimary:   row.primary_color  || '#2563eb',
          brandSecondary: row.secondary_color || '#0ea5e9',
          organizerName:  displayName,
          // Pass email type so each reminder gets unique copy + urgency bar
          emailType:      row.template_type,
        };

        // ── 3. Generate HTML ─────────────────────────────────────────────
        const finalHtml = getThemeHtml(themeId, emailData);

        // ── 4. Build subject line ────────────────────────────────────────
        const rawSubject  = row.saved_subject || 'Reminder: {{event_title}}';
        const finalSubject = rawSubject
          .replace(/\{\{event_title\}\}/g,   row.event_title)
          .replace(/\{\{attendee_name\}\}/g, row.attendee_name);

        // ── 5. SendGrid credentials already resolved in step 2 above ────

        // ── 6. Send ──────────────────────────────────────────────────────
        const outcome = await sendEmailFromQueue(
          row.id,
          row.attendee_email,
          finalSubject,
          finalHtml,
          {
            apiKey:     integrationSettings.sendgridApiKey,
            fromEmail:  integrationSettings.sendgridFromEmail,
            fromName:   integrationSettings.sendgridFromName
                          || profileSettings.fromName
                          || row.organizer_name,
            replyTo:    profileSettings.replyToEmail,
          }
        );

        if (outcome.success) {
          // ── 7a. Mark queue item as sent ──────────────────────────────
          await query(
            `UPDATE email_queue
             SET status = 'sent', updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`,
            [row.id]
          );

          // ── 7b. Write to email_logs so delivery log page shows it ────
          const trackingId = uuidv4();
          await query(
            `INSERT INTO email_logs
               (id, organization_id, event_id, attendee_id, queue_id,
                recipient_email, template_type, sent_at, tracking_id)
             VALUES
               ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP, $8)
             ON CONFLICT (tracking_id) DO NOTHING`,
            [
              uuidv4(),
              row.organization_id,
              row.event_id,
              row.attendee_id,
              row.id,
              row.attendee_email,
              row.template_type,
              trackingId,
            ]
          );

          console.log(`  ✓ Sent ${row.template_type} to ${row.attendee_email}`);
          sent++;
        } else {
          // ── 7c. Increment attempt count; mark 'failed' if exhausted ──
          const newCount = (row.attempt_count ?? 0) + 1;
          const newStatus = newCount >= MAX_ATTEMPTS ? 'failed' : 'pending';

          await query(
            `UPDATE email_queue
             SET status        = $1,
                 attempt_count = $2,
                 last_error    = $3,
                 updated_at    = CURRENT_TIMESTAMP
             WHERE id = $4`,
            [newStatus, newCount, outcome.error, row.id]
          );

          console.error(`  ✗ Failed (attempt ${newCount}/${MAX_ATTEMPTS}) to ${row.attendee_email}: ${outcome.error}`);
          failed++;
        }
      } catch (err: any) {
        // Unexpected runtime error — still increment so we don't loop forever
        const newCount  = (row.attempt_count ?? 0) + 1;
        const newStatus = newCount >= MAX_ATTEMPTS ? 'failed' : 'pending';

        await query(
          `UPDATE email_queue
           SET status        = $1,
               attempt_count = $2,
               last_error    = $3,
               updated_at    = CURRENT_TIMESTAMP
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
  console.log('[Worker] ReminderFlow email worker started');
  await processEmailQueue();
  setInterval(processEmailQueue, INTERVAL_MS);
}

if (require.main === module) {
  startWorker().catch(err => {
    console.error('[Worker] Crashed on startup:', err);
    process.exit(1);
  });
}
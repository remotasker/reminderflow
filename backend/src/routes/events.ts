import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getClient, query } from '../database/db';
import { requireManagerOrAdmin } from '../middleware/rbac';
import {
  buildReminderRowsFromSchedule,
  DEFAULT_EVENT_REMINDER_SCHEDULE,
  isReminderType,
  normalizeReminderSchedule,
  rebuildPendingReminderQueueForEvent,
  reminderScheduleFromRows,
  replaceEventReminderDefinitions,
  toDateOnlyString,
} from '../services/reminders';
import {
  exceedsJsonSize,
  isPlainObject,
  isSafeHttpUrl,
  isUuid,
  normalizeName,
  normalizeOptionalText,
} from '../utils/validation';

const router = Router();
router.use(requireManagerOrAdmin);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;
const ALLOWED_FORM_FIELD_TYPES = new Set(['text', 'textarea', 'checkbox', 'checkbox_group']);

function isValidDate(val: unknown): val is string {
  return typeof val === 'string' && DATE_RE.test(val);
}

function isValidTime(val: unknown): val is string {
  return typeof val === 'string' && TIME_RE.test(val);
}

function validateFormSchema(schema: unknown): string | null {
  if (schema === null || schema === undefined) return null;
  if (!Array.isArray(schema)) return 'form_schema must be an array';
  if (schema.length > 50) return 'form_schema cannot contain more than 50 fields';
  if (exceedsJsonSize(schema, 20_000)) return 'form_schema is too large';

  for (const field of schema) {
    if (!isPlainObject(field)) return 'Each form field must be an object';

    const id = normalizeOptionalText(field.id, 100);
    const label = normalizeOptionalText(field.label, 255);
    const type = typeof field.type === 'string' ? field.type : '';

    if (!id || !label || !ALLOWED_FORM_FIELD_TYPES.has(type)) {
      return 'Each form field must include a valid id, label, and type';
    }

    if (field.required !== undefined && typeof field.required !== 'boolean') {
      return 'form_schema required values must be boolean';
    }

    if (field.locked !== undefined && typeof field.locked !== 'boolean') {
      return 'form_schema locked values must be boolean';
    }

    if (field.options !== undefined) {
      if (!Array.isArray(field.options) || field.options.length > 50) {
        return 'form_schema options must be an array of up to 50 items';
      }

      const validOptions = field.options.every((option) => normalizeOptionalText(option, 255));
      if (!validOptions) {
        return 'form_schema options must be non-empty strings';
      }
    }
  }

  return null;
}

function getOwnerScope(req: Request): string | null {
  return req.user?.role === 'admin' ? null : req.user?.userId ?? null;
}

function getNormalizedMeetingLink(value: unknown): string | null | undefined {
  if (value === undefined) return undefined;

  const normalized = normalizeOptionalText(value, 500);
  if (!normalized) return null;
  if (!isSafeHttpUrl(normalized)) return undefined;

  return normalized;
}

/**
 * Converts date and time strings to iCalendar UTC format (YYYYMMDDTHHMMSSZ)
 */
function toICalDate(dateStr: string, timeStr: string): string {
  try {
    // Ensure dateStr is just the YYYY-MM-DD part if it's an ISO string
    const cleanDate = dateStr.includes('T') ? dateStr.split('T')[0] : dateStr;
    const dt = new Date(`${cleanDate}T${timeStr}`);
    if (isNaN(dt.getTime())) throw new Error('Invalid Date');
    return dt.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  } catch (e) {
    // Fallback if Date parsing fails
    return dateStr.replace(/-/g, '') + 'T' + timeStr.replace(/:/g, '') + '00Z';
  }
}

function icalEscape(str: string): string {
  return (str ?? '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

function foldLine(line: string): string {
  if (line.length <= 75) return line;
  const parts: string[] = [];
  parts.push(line.slice(0, 75));
  let i = 75;
  while (i < line.length) {
    parts.push(' ' + line.slice(i, i + 74));
    i += 74;
  }
  return parts.join('\r\n');
}

// ---------------------------------------------------------------------------
// GET /api/events — list all events for the organisation
// ---------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const ownerScope = getOwnerScope(req);

    const result = await query(
      `SELECT e.id, e.title, e.description, e.event_date, e.event_time, e.timezone, e.meeting_link, e.email_theme_id, e.created_at
       FROM events e
       WHERE e.organization_id = $1
         AND ($2::uuid IS NULL OR e.created_by = $2::uuid)
       ORDER BY e.event_date DESC`,
      [req.user.organizationId, ownerScope]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/events — create a new event
// ---------------------------------------------------------------------------
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { 
      title, description, timezone, reminderSchedule, email_theme_id,
      form_schema, formSchema,
      eventDate, event_date, 
      eventTime, event_time, 
      meetingLink, meeting_link 
    } = req.body;

    const finalFormSchema = formSchema ?? form_schema ?? null;
    const finalEventDate = eventDate || event_date;
    const finalEventTime = eventTime || event_time;
    const finalMeetingLink = meetingLink || meeting_link;
    const finalEmailThemeId = normalizeOptionalText(email_theme_id, 50) || 'minimal_light';
    const normalizedTitle = normalizeName(title);
    const normalizedDescription = normalizeOptionalText(description, 10_000);
    const normalizedTimezone = normalizeOptionalText(timezone, 100);
    const normalizedMeetingLink = getNormalizedMeetingLink(finalMeetingLink);
    const formSchemaError = validateFormSchema(finalFormSchema);

    if (!normalizedTitle || !finalEventDate || !finalEventTime || !normalizedTimezone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    if (finalMeetingLink !== undefined && normalizedMeetingLink === undefined) {
      return res.status(400).json({ error: 'meeting_link must be a valid HTTP or HTTPS URL' });
    }
    if (formSchemaError) {
      return res.status(400).json({ error: formSchemaError });
    }
    if (reminderSchedule !== undefined && (!Array.isArray(reminderSchedule) || reminderSchedule.some((type) => !isReminderType(type)))) {
      return res.status(400).json({ error: 'reminderSchedule contains an invalid reminder type' });
    }
    
    const dateToValidate = finalEventDate instanceof Date ? toDateOnlyString(finalEventDate) : finalEventDate;
    
    if (!isValidDate(dateToValidate)) {
      return res.status(400).json({ error: 'event_date must be in YYYY-MM-DD format' });
    }
    if (!isValidTime(finalEventTime)) {
      return res.status(400).json({ error: 'event_time must be in HH:MM or HH:MM:SS format' });
    }

    const eventId = uuidv4();
    const finalReminderSchedule = reminderSchedule === undefined
      ? DEFAULT_EVENT_REMINDER_SCHEDULE
      : normalizeReminderSchedule(reminderSchedule);
    const client = await getClient();

    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO events (id, organization_id, title, description, event_date, event_time, timezone, meeting_link, email_theme_id, created_by, form_schema)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          eventId,
          req.user.organizationId,
          normalizedTitle,
          normalizedDescription,
          dateToValidate,
          finalEventTime,
          normalizedTimezone,
          normalizedMeetingLink ?? null,
          finalEmailThemeId,
          req.user.userId,
          finalFormSchema ? JSON.stringify(finalFormSchema) : null
        ]
      );

      await replaceEventReminderDefinitions(client, eventId, finalReminderSchedule);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return res.status(201).json({ message: 'Event created successfully', eventId });
  } catch (error) {
    console.error('Error creating event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/events/:id — get a single event
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    const ownerScope = getOwnerScope(req);

    const eventResult = await query(
      `SELECT e.id, e.title, e.description, e.event_date, e.event_time, e.timezone, e.meeting_link, e.email_theme_id, e.form_schema, e.created_at
       FROM events e
       WHERE e.id = $1
         AND e.organization_id = $2
         AND ($3::uuid IS NULL OR e.created_by = $3::uuid)`,
      [id, req.user.organizationId, ownerScope]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];
    const remindersResult = await query('SELECT type, hours_before FROM reminders WHERE event_id = $1', [id]);
    const countResult = await query('SELECT COUNT(*) as count FROM attendees WHERE event_id = $1', [id]);

    return res.json({
      ...event,
      reminders: remindersResult.rows,
      attendeeCount: parseInt(countResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/events/:id/calendar — download .ics file for the event
// ---------------------------------------------------------------------------
router.get('/:id/calendar', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    const ownerScope = getOwnerScope(req);

    const eventResult = await query(
      `SELECT title, description, event_date, event_time, timezone, meeting_link
       FROM events
       WHERE id = $1
         AND organization_id = $2
         AND ($3::uuid IS NULL OR created_by = $3::uuid)`,
      [id, req.user.organizationId, ownerScope]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const e = eventResult.rows[0];
    const dateStr = toDateOnlyString(e.event_date);
    
    const dtStart = toICalDate(dateStr, e.event_time);
    
    // Calculate end time (default to 1 hour later)
    const endDate = new Date(`${dateStr}T${e.event_time}`);
    endDate.setHours(endDate.getHours() + 1);
    const dtEnd = endDate.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    const dtStamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';

    const lines = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//ReminderFlow//ReminderFlow//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${id}@reminderflow`,
      `DTSTAMP:${dtStamp}`,
      `DTSTART:${dtStart}`,
      `DTEND:${dtEnd}`,
      foldLine(`SUMMARY:${icalEscape(e.title)}`),
      foldLine(`DESCRIPTION:${icalEscape(e.description || '')}`),
      ...(e.meeting_link ? [
        foldLine(`URL:${e.meeting_link}`), 
        foldLine(`LOCATION:${icalEscape(e.meeting_link)}`)
      ] : []),
      'END:VEVENT',
      'END:VCALENDAR',
    ];

    const ics = lines.join('\r\n');
    const filename = e.title.replace(/[^a-z0-9]/gi, '-').toLowerCase();

    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}.ics"`);
    return res.send(ics);
  } catch (error) {
    console.error('Error generating calendar file:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/events/:id — update an event
// ---------------------------------------------------------------------------
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    
    const { 
      title, description, timezone, email_theme_id, reminderSchedule,
      form_schema, formSchema,
      eventDate, event_date, 
      eventTime, event_time, 
      meetingLink, meeting_link 
    } = req.body;

    const finalFormSchema = formSchema ?? form_schema ?? null;
    const finalEventDate = eventDate || event_date;
    const finalEventTime = eventTime || event_time;
    const finalMeetingLink = meetingLink || meeting_link;
    const finalEmailThemeId = email_theme_id === undefined ? undefined : (normalizeOptionalText(email_theme_id, 50) || 'minimal_light');
    const normalizedTitle = title === undefined ? undefined : normalizeName(title);
    const normalizedDescription = description === undefined ? undefined : normalizeOptionalText(description, 10_000);
    const normalizedTimezone = timezone === undefined ? undefined : normalizeOptionalText(timezone, 100);
    const normalizedMeetingLink = getNormalizedMeetingLink(finalMeetingLink);
    const formSchemaError = validateFormSchema(finalFormSchema);

    if (finalEventDate !== undefined) {
       const dateToValidate = finalEventDate instanceof Date ? toDateOnlyString(finalEventDate) : finalEventDate;
       if(!isValidDate(dateToValidate)) return res.status(400).json({ error: 'event_date must be in YYYY-MM-DD format' });
    }
    
    if (finalEventTime !== undefined && !isValidTime(finalEventTime)) {
      return res.status(400).json({ error: 'event_time must be in HH:MM or HH:MM:SS format' });
    }
    if (title !== undefined && !normalizedTitle) {
      return res.status(400).json({ error: 'title must be between 1 and 255 characters' });
    }
    if (timezone !== undefined && !normalizedTimezone) {
      return res.status(400).json({ error: 'timezone is invalid' });
    }
    if (finalMeetingLink !== undefined && normalizedMeetingLink === undefined) {
      return res.status(400).json({ error: 'meeting_link must be a valid HTTP or HTTPS URL' });
    }
    if (formSchemaError) {
      return res.status(400).json({ error: formSchemaError });
    }
    if (reminderSchedule !== undefined && (!Array.isArray(reminderSchedule) || reminderSchedule.some((type) => !isReminderType(type)))) {
      return res.status(400).json({ error: 'reminderSchedule contains an invalid reminder type' });
    }

    const checkResult = await query(
      `SELECT e.organization_id, e.event_date, e.event_time, e.email_theme_id, o.settings
       FROM events e
       JOIN organizations o ON o.id = e.organization_id
       WHERE e.id = $1
         AND e.organization_id = $2
         AND ($3::uuid IS NULL OR e.created_by = $3::uuid)`,
      [id, req.user.organizationId, getOwnerScope(req)]
    );

    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    const currentEvent = checkResult.rows[0];
    const currentReminderRows = await query(
      'SELECT type, hours_before FROM reminders WHERE event_id = $1 ORDER BY created_at ASC',
      [id]
    );
    const finalReminderSchedule = reminderSchedule === undefined
      ? reminderScheduleFromRows(currentReminderRows.rows)
      : normalizeReminderSchedule(reminderSchedule);
    const nextEventDate = finalEventDate ?? currentEvent.event_date;
    const nextEventTime = finalEventTime ?? currentEvent.event_time;
    const nextThemeId = finalEmailThemeId ?? currentEvent.email_theme_id ?? 'minimal_light';
    const client = await getClient();

    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE events SET
           title        = COALESCE($1, title),
           description  = COALESCE($2, description),
           event_date   = COALESCE($3, event_date),
           event_time   = COALESCE($4, event_time),
           timezone     = COALESCE($5, timezone),
           meeting_link = COALESCE($6, meeting_link),
           email_theme_id = COALESCE($7, email_theme_id),
           form_schema  = COALESCE($8, form_schema),
           updated_at   = CURRENT_TIMESTAMP
         WHERE id = $9`,
        [
          normalizedTitle ?? null,
          normalizedDescription ?? null,
          finalEventDate ?? null,
          finalEventTime ?? null,
          normalizedTimezone ?? null,
          normalizedMeetingLink ?? null,
          finalEmailThemeId ?? null,
          finalFormSchema ? JSON.stringify(finalFormSchema) : null,
          id
        ]
      );

      if (reminderSchedule !== undefined) {
        await replaceEventReminderDefinitions(client, id, finalReminderSchedule);
      }

      const attendeesResult = await client.query(
        'SELECT id, email, whatsapp_number FROM attendees WHERE event_id = $1',
        [id]
      );

      await rebuildPendingReminderQueueForEvent(client, {
        eventId: id,
        organizationId: currentEvent.organization_id,
        eventDate: nextEventDate,
        eventTime: nextEventTime,
        themeId: nextThemeId,
        settings: currentEvent.settings,
        reminders: buildReminderRowsFromSchedule(finalReminderSchedule),
        attendees: attendeesResult.rows,
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/events/:id — delete an event
// ---------------------------------------------------------------------------
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }

    const checkResult = await query(
      `SELECT organization_id
       FROM events
       WHERE id = $1
         AND organization_id = $2
         AND ($3::uuid IS NULL OR created_by = $3::uuid)`,
      [id, req.user.organizationId, getOwnerScope(req)]
    );
    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    await query('DELETE FROM events WHERE id = $1', [id]);
    return res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});
// ---------------------------------------------------------------------------
// GET /api/events/:id/emails — Get email delivery logs for an event
// ---------------------------------------------------------------------------
router.get('/:id/emails', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { id } = req.params;
    console.log(`Fetching emails for event: ${id}`);
    
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }

    // Verify ownership
    const checkResult = await query(
      `SELECT id
       FROM events
       WHERE id = $1
         AND organization_id = $2
         AND ($3::uuid IS NULL OR created_by = $3::uuid)`,
      [id, req.user.organizationId, getOwnerScope(req)]
    );
    if (checkResult.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

    // Fetch sent emails from email_logs + pending/failed from email_queue
    const emailsResult = await query(
      `SELECT id,
              recipient_email  AS attendee_email,
              template_type,
              'sent'           AS status,
              sent_at          AS send_at
       FROM   email_logs
       WHERE  event_id = $1

       UNION ALL

       SELECT id,
              attendee_email,
              template_type,
              status,
              send_at
       FROM   email_queue
       WHERE  event_id = $1
         AND  status IN ('pending', 'failed')

       ORDER BY send_at DESC`,
      [id]
    );

    console.log(`Found ${emailsResult.rows.length} emails for event ${id}`);
    return res.json(emailsResult.rows);
  } catch (error) {
    console.error('Error fetching email logs:', error);
    return res.status(500).json({ error: 'Failed to load email logs' });
  }
});

export default router;

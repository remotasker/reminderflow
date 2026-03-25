import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query, getClient } from '../database/db';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse an event's date + time columns into a valid Date object.
 * Postgres returns event_date as a JS Date (midnight UTC) or a string
 * depending on the driver version, so we normalise both.
 */
function parseEventDateTime(eventDate: Date | string, eventTime: string): Date {
  const dateStr =
    eventDate instanceof Date
      ? eventDate.toISOString().split('T')[0]
      : eventDate;
  return new Date(`${dateStr}T${eventTime}`);
}

/**
 * Build email_queue rows for a single attendee and insert them.
 * Extracted so both the single-add and bulk-upload paths share identical logic.
 */
async function enqueueReminders(
  client: { query: Function },
  {
    organizationId,
    eventId,
    attendeeId,
    attendeeEmail,
    eventDate,
    eventTime,
    reminders,
  }: {
    organizationId: string;
    eventId: string;
    attendeeId: string;
    attendeeEmail: string;
    eventDate: Date | string;
    eventTime: string;
    reminders: { type: string; hours_before: number }[];
  }
): Promise<void> {
  const eventDateTime = parseEventDateTime(eventDate, eventTime);

  if (isNaN(eventDateTime.getTime())) {
    throw new Error(`Invalid event date/time: ${eventDate} ${eventTime}`);
  }

  for (const reminder of reminders) {
    const hours = parseFloat(String(reminder.hours_before));
    const sendTime = new Date(eventDateTime.getTime() - hours * 60 * 60 * 1000);

    if (isNaN(sendTime.getTime())) continue;

    await client.query(
      `INSERT INTO email_queue
         (id, organization_id, event_id, attendee_id, attendee_email, template_type, send_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), organizationId, eventId, attendeeId, attendeeEmail, reminder.type, sendTime, 'pending']
    );
  }
}

// ---------------------------------------------------------------------------
// GET /api/attendees/:eventId  — list attendees for an event
// ---------------------------------------------------------------------------
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventId } = req.params;

    const eventCheck = await query(
      'SELECT organization_id FROM events WHERE id = $1',
      [eventId]
    );

    if (
      eventCheck.rows.length === 0 ||
      eventCheck.rows[0].organization_id !== req.user.organizationId
    ) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const result = await query(
      'SELECT id, name, email, created_at FROM attendees WHERE event_id = $1 ORDER BY created_at DESC',
      [eventId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/attendees/:eventId  — add a single attendee
// ---------------------------------------------------------------------------
router.post('/:eventId', async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventId } = req.params;
    const { name, email } = req.body;

    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }

    // Verify event ownership
    const eventCheck = await client.query(
      'SELECT organization_id, event_date, event_time FROM events WHERE id = $1',
      [eventId]
    );

    if (
      eventCheck.rows.length === 0 ||
      eventCheck.rows[0].organization_id !== req.user.organizationId
    ) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Reject duplicate attendee email for this event
    const duplicate = await client.query(
      'SELECT id FROM attendees WHERE event_id = $1 AND email = $2',
      [eventId, email]
    );

    if (duplicate.rows.length > 0) {
      return res.status(409).json({ error: 'Attendee with this email already registered for this event' });
    }

    const remindersResult = await client.query(
      'SELECT type, hours_before FROM reminders WHERE event_id = $1',
      [eventId]
    );

    const attendeeId = uuidv4();
    const { event_date, event_time } = eventCheck.rows[0];

    await client.query('BEGIN');

    await client.query(
      'INSERT INTO attendees (id, event_id, name, email) VALUES ($1, $2, $3, $4)',
      [attendeeId, eventId, name, email]
    );

    await enqueueReminders(client, {
      organizationId: req.user.organizationId,
      eventId,
      attendeeId,
      attendeeEmail: email,
      eventDate: event_date,
      eventTime: event_time,
      reminders: remindersResult.rows,
    });

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Attendee added successfully',
      attendeeId,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error adding attendee:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// POST /api/attendees/:eventId/bulk-upload  — upload attendees from CSV
// ---------------------------------------------------------------------------
router.post('/:eventId/bulk-upload', async (req: Request, res: Response) => {
  const client = await getClient();
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { eventId } = req.params;
    const { attendees } = req.body;

    if (!Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ error: 'Attendees array is required' });
    }

    // Verify event ownership and grab date/time in one query
    const eventCheck = await client.query(
      'SELECT organization_id, event_date, event_time FROM events WHERE id = $1',
      [eventId]
    );

    if (
      eventCheck.rows.length === 0 ||
      eventCheck.rows[0].organization_id !== req.user.organizationId
    ) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { event_date, event_time } = eventCheck.rows[0];

    // Validate the event date/time once up front before touching any attendees
    const eventDateTime = parseEventDateTime(event_date, event_time);
    if (isNaN(eventDateTime.getTime())) {
      return res.status(400).json({ error: 'Event date or time is invalid.' });
    }

    const remindersResult = await client.query(
      'SELECT type, hours_before FROM reminders WHERE event_id = $1',
      [eventId]
    );

    // Fetch existing emails for this event to skip duplicates
    const existingResult = await client.query(
      'SELECT email FROM attendees WHERE event_id = $1',
      [eventId]
    );
    const existingEmails = new Set(existingResult.rows.map((r: { email: string }) => r.email));

    let addedCount = 0;
    const errors: string[] = [];

    await client.query('BEGIN');

    for (const att of attendees) {
      try {
        if (!att.name || !att.email) {
          errors.push(`Invalid attendee: ${JSON.stringify(att)}`);
          continue;
        }

        if (existingEmails.has(att.email)) {
          errors.push(`Skipped duplicate: ${att.email}`);
          continue;
        }

        const attendeeId = uuidv4();

        await client.query(
          'INSERT INTO attendees (id, event_id, name, email) VALUES ($1, $2, $3, $4)',
          [attendeeId, eventId, att.name, att.email]
        );

        await enqueueReminders(client, {
          organizationId: req.user.organizationId,
          eventId,
          attendeeId,
          attendeeEmail: att.email,
          eventDate: event_date,
          eventTime: event_time,
          reminders: remindersResult.rows,
        });

        existingEmails.add(att.email); // prevent intra-batch duplicates
        addedCount++;
      } catch (err) {
        errors.push(`Error adding ${att.email}: ${err}`);
      }
    }

    await client.query('COMMIT');

    res.json({
      message: `${addedCount} attendees added successfully`,
      addedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading attendees:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client.release();
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/attendees/remove/:id  — delete an attendee
// ---------------------------------------------------------------------------
// Route renamed from /:id to /remove/:id to avoid colliding with
// GET/POST /:eventId which share the same /:param pattern.
router.delete('/remove/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const attendeeCheck = await query(
      `SELECT a.event_id, e.organization_id FROM attendees a
       JOIN events e ON a.event_id = e.id
       WHERE a.id = $1`,
      [id]
    );

    if (
      attendeeCheck.rows.length === 0 ||
      attendeeCheck.rows[0].organization_id !== req.user.organizationId
    ) {
      return res.status(404).json({ error: 'Attendee not found' });
    }

    await query('DELETE FROM attendees WHERE id = $1', [id]);

    res.json({ message: 'Attendee deleted successfully' });
  } catch (error) {
    console.error('Error deleting attendee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';

const router = Router();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Postgres DATE columns come back as strings ("2025-06-01") — accept both. */
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

function isValidDate(val: unknown): val is string {
  return typeof val === 'string' && DATE_RE.test(val);
}

function isValidTime(val: unknown): val is string {
  return typeof val === 'string' && TIME_RE.test(val);
}

// ---------------------------------------------------------------------------
// GET /api/events  — list all events for the organisation
// ---------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT e.id, e.title, e.description, e.event_date, e.event_time, e.timezone, e.meeting_link, e.created_at
       FROM events e
       WHERE e.organization_id = $1
       ORDER BY e.event_date DESC`,
      [req.user.organizationId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/events  — create a new event
// ---------------------------------------------------------------------------
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { title, description, eventDate, eventTime, timezone, meetingLink, reminderSchedule } = req.body;

    if (!title || !eventDate || !eventTime || !timezone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate date and time formats before they reach the DB
    if (!isValidDate(eventDate)) {
      return res.status(400).json({ error: 'eventDate must be in YYYY-MM-DD format' });
    }
    if (!isValidTime(eventTime)) {
      return res.status(400).json({ error: 'eventTime must be in HH:MM or HH:MM:SS format' });
    }

    const eventId = uuidv4();

    await query(
      `INSERT INTO events (id, organization_id, title, description, event_date, event_time, timezone, meeting_link, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [eventId, req.user.organizationId, title, description, eventDate, eventTime, timezone, meetingLink, req.user.userId]
    );

    if (reminderSchedule && Array.isArray(reminderSchedule)) {
      for (const reminderType of reminderSchedule) {
        let hoursBefore: number | null = null;

        if (reminderType === 'confirmation') {
          hoursBefore = 0;
        } else if (reminderType === '24h') {
          hoursBefore = 24;
        } else if (reminderType === '1h') {
          hoursBefore = 1;
        } else if (reminderType === '10m') {
          // Stored as a decimal — requires hours_before to be NUMERIC/FLOAT in the schema,
          // not INT (see schema.sql fix).
          hoursBefore = 0.167;
        }

        if (hoursBefore !== null) {
          await query(
            `INSERT INTO reminders (id, event_id, type, hours_before)
             VALUES ($1, $2, $3, $4)`,
            [uuidv4(), eventId, reminderType, hoursBefore]
          );
        }
      }
    }

    res.status(201).json({
      message: 'Event created successfully',
      eventId,
    });
  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/events/:id  — get a single event with attendees and reminders
// ---------------------------------------------------------------------------
router.get('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const eventResult = await query(
      `SELECT e.id, e.title, e.description, e.event_date, e.event_time, e.timezone, e.meeting_link, e.created_at
       FROM events e
       WHERE e.id = $1 AND e.organization_id = $2`,
      [id, req.user.organizationId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const event = eventResult.rows[0];

    const remindersResult = await query(
      'SELECT type, hours_before FROM reminders WHERE event_id = $1',
      [id]
    );

    const attendeeCountResult = await query(
      'SELECT COUNT(*) as count FROM attendees WHERE event_id = $1',
      [id]
    );

    res.json({
      ...event,
      reminders: remindersResult.rows,
      attendeeCount: parseInt(attendeeCountResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/events/:id  — update an event
// ---------------------------------------------------------------------------
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;
    const { title, description, eventDate, eventTime, timezone, meetingLink } = req.body;

    // Validate formats for any date/time fields that were provided
    if (eventDate !== undefined && !isValidDate(eventDate)) {
      return res.status(400).json({ error: 'eventDate must be in YYYY-MM-DD format' });
    }
    if (eventTime !== undefined && !isValidTime(eventTime)) {
      return res.status(400).json({ error: 'eventTime must be in HH:MM or HH:MM:SS format' });
    }

    const checkResult = await query(
      'SELECT organization_id FROM events WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (checkResult.rows[0].organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    // Use COALESCE so omitted fields keep their existing DB value
    // rather than being overwritten with NULL.
    await query(
      `UPDATE events SET
         title        = COALESCE($1, title),
         description  = COALESCE($2, description),
         event_date   = COALESCE($3, event_date),
         event_time   = COALESCE($4, event_time),
         timezone     = COALESCE($5, timezone),
         meeting_link = COALESCE($6, meeting_link),
         updated_at   = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [
        title       ?? null,
        description ?? null,
        eventDate   ?? null,
        eventTime   ?? null,
        timezone    ?? null,
        meetingLink ?? null,
        id,
      ]
    );

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/events/:id  — delete an event
// ---------------------------------------------------------------------------
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { id } = req.params;

    const checkResult = await query(
      'SELECT organization_id FROM events WHERE id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    if (checkResult.rows[0].organization_id !== req.user.organizationId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await query('DELETE FROM events WHERE id = $1', [id]);

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';
import { createRateLimit } from '../middleware/rateLimit';
import {
  exceedsJsonSize,
  isPlainObject,
  isUuid,
  normalizeEmail,
  normalizeName,
} from '../utils/validation';
import { isEmailTypeEnabled } from '../utils/settings';

const router = Router();
const publicRegistrationRateLimit = createRateLimit({
  keyPrefix: 'public:register',
  limit: 15,
  windowMs: 15 * 60 * 1000,
  message: 'Too many registration attempts from this address. Please try again later.',
});

// ---------------------------------------------------------------------------
// GET /api/public/events/:id
// Returns public-safe event info including the form_schema
// ---------------------------------------------------------------------------
router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }

    const result = await query(
      `SELECT id, title, description, event_date, event_time, timezone, form_schema
       FROM events
       WHERE id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found or is no longer active.' });
    }

    return res.json(result.rows[0]);
  } catch (error) {
    console.error('Error fetching public event:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/public/events/:id/register
// Registers a guest, saves custom responses, and queues reminders.
// ---------------------------------------------------------------------------
router.post('/events/:id/register', publicRegistrationRateLimit, async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    if (!isUuid(eventId)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    
    // NEW: We now extract custom_responses from the incoming frontend request
    const { name, email, custom_responses } = req.body;
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({ error: 'A valid name and email are required.' });
    }

    if (custom_responses !== undefined) {
      if (!isPlainObject(custom_responses) || exceedsJsonSize(custom_responses, 20_000)) {
        return res.status(400).json({ error: 'Custom responses must be a valid object.' });
      }
    }

    // Fetch event details
    const eventResult = await query(
      `SELECT e.id, e.organization_id, e.title, e.event_date, e.event_time, e.meeting_link, e.email_theme_id, o.settings
       FROM events e
       JOIN organizations o ON o.id = e.organization_id
       WHERE e.id = $1`,
      [eventId]
    );

    if (eventResult.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const event = eventResult.rows[0];

    // Prevent duplicate registrations
    const duplicateCheck = await query(
      'SELECT id FROM attendees WHERE event_id = $1 AND email = $2',
      [eventId, normalizedEmail]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: 'This email is already registered for this event.' });
    }

    // Insert attendee (NEW: Now saving the custom responses as JSON)
    const attendeeId = uuidv4();
    await query(
      `INSERT INTO attendees (id, organization_id, event_id, name, email, responses)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        attendeeId,
        event.organization_id,
        eventId, 
        normalizedName,
        normalizedEmail,
        JSON.stringify(custom_responses || {})
      ]
    );

    // Get reminder schedule
    const remindersResult = await query(
      'SELECT type, hours_before FROM reminders WHERE event_id = $1',
      [eventId]
    );

    // Normalise date
    const dateStr = event.event_date instanceof Date
      ? event.event_date.toISOString().split('T')[0]
      : String(event.event_date).split('T')[0];

    const eventDateTime = new Date(`${dateStr}T${event.event_time}`);
    const themeId = event.email_theme_id || 'minimal_light';
    
    // Queue the confirmation email when this org-level notification is enabled.
    // We do NOT require a 'confirmation' row in the reminders table — the org
    // settings toggle is the sole gate, consistent with attendees.ts.
    if (isEmailTypeEnabled(event.settings, 'confirmation')) {
      await query(
        `INSERT INTO email_queue
           (id, organization_id, event_id, attendee_id, attendee_email,
            template_type, email_theme_id, send_at, status)
         VALUES ($1, $2, $3, $4, $5, 'confirmation', $6, CURRENT_TIMESTAMP, 'pending')`,
        [uuidv4(), event.organization_id, eventId, attendeeId, normalizedEmail, themeId]
      );
    }

    // Queue timed reminders (24h, 1h, 10m)
    for (const reminder of remindersResult.rows) {
      if (reminder.type === 'confirmation') continue;
      if (!isEmailTypeEnabled(event.settings, reminder.type)) continue;

      const hours    = parseFloat(String(reminder.hours_before));
      const sendTime = new Date(eventDateTime.getTime() - hours * 60 * 60 * 1000);

      if (isNaN(sendTime.getTime()) || sendTime <= new Date()) continue;

      await query(
        `INSERT INTO email_queue
           (id, organization_id, event_id, attendee_id, attendee_email,
            template_type, email_theme_id, send_at, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'pending')`,
        [uuidv4(), event.organization_id, eventId, attendeeId,
         normalizedEmail, reminder.type, themeId, sendTime]
      );
    }

    return res.status(201).json({ message: 'Successfully registered', attendeeId });
  } catch (error) {
    console.error('Error registering attendee:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

export default router;

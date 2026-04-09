import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getClient, query } from '../database/db';
import { createRateLimit } from '../middleware/rateLimit';
import { queueRemindersForAttendee } from '../services/reminders';
import {
  exceedsJsonSize,
  isPlainObject,
  isUuid,
  normalizeEmail,
  normalizeName,
} from '../utils/validation';

const router = Router();
const publicRegistrationRateLimit = createRateLimit({
  keyPrefix: 'public:register',
  limit: 15,
  windowMs: 15 * 60 * 1000,
  message: 'Too many registration attempts from this address. Please try again later.',
});

/** Normalise a WhatsApp number — ensures it starts with + and strips spaces. */
function normalizeWhatsappNumber(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.replace(/\s+/g, '').trim();
  if (!cleaned) return null;
  const withPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  if (!/^\+\d{7,15}$/.test(withPlus)) return null;
  return withPlus;
}

// ---------------------------------------------------------------------------
// GET /api/public/events/:id
// ---------------------------------------------------------------------------
router.get('/events/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }

    const result = await query(
      `SELECT e.id, e.title, e.description, e.event_date, e.event_time, e.timezone, e.form_schema,
              CASE WHEN s.plan = 'pro' AND s.status IN ('active', 'trialing') THEN true ELSE false END AS whatsapp_enabled
       FROM events e
       JOIN organizations o ON o.id = e.organization_id
       LEFT JOIN subscriptions s ON s.organization_id = o.id
       WHERE e.id = $1`,
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
// ---------------------------------------------------------------------------
router.post('/events/:id/register', publicRegistrationRateLimit, async (req: Request, res: Response) => {
  try {
    const { id: eventId } = req.params;
    if (!isUuid(eventId)) {
      return res.status(400).json({ error: 'Invalid event id' });
    }
    
    // CHANGED: Extract whatsappNumber from frontend
    const { name, email, whatsappNumber, custom_responses } = req.body;
    const normalizedName = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);
    const normalizedWhatsapp = normalizeWhatsappNumber(whatsappNumber);

    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({ error: 'A valid name and email are required.' });
    }

    if (custom_responses !== undefined) {
      if (!isPlainObject(custom_responses) || exceedsJsonSize(custom_responses, 20_000)) {
        return res.status(400).json({ error: 'Custom responses must be a valid object.' });
      }
    }

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

    const duplicateCheck = await query(
      'SELECT id FROM attendees WHERE event_id = $1 AND email = $2',
      [eventId, normalizedEmail]
    );

    if (duplicateCheck.rows.length > 0) {
      return res.status(400).json({ error: 'This email is already registered for this event.' });
    }

    // CHANGED: Insert whatsapp_number into attendees
    const remindersResult = await query(
      'SELECT type, hours_before FROM reminders WHERE event_id = $1',
      [eventId]
    );
    const themeId = event.email_theme_id || 'minimal_light';
    const attendeeId = uuidv4();
    const client = await getClient();

    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO attendees (id, organization_id, event_id, name, email, responses, whatsapp_number)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          attendeeId,
          event.organization_id,
          eventId,
          normalizedName,
          normalizedEmail,
          JSON.stringify(custom_responses || {}),
          normalizedWhatsapp
        ]
      );

      await queueRemindersForAttendee(client, {
        organizationId: event.organization_id,
        eventId,
        attendeeId,
        attendeeEmail: normalizedEmail,
        whatsappNumber: normalizedWhatsapp,
        eventDate: event.event_date,
        eventTime: event.event_time,
        themeId,
        settings: event.settings,
        reminders: remindersResult.rows,
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return res.status(201).json({ message: 'Successfully registered', attendeeId });
  } catch (error) {
    console.error('Error registering attendee:', error);
    return res.status(500).json({ error: 'Internal server error. Please try again later.' });
  }
});

export default router;

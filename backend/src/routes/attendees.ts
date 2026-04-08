import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getClient, query } from '../database/db';
import { requireManagerOrAdmin } from '../middleware/rbac';
import { queueRemindersForAttendee } from '../services/reminders';
import { isUuid, normalizeEmail, normalizeName } from '../utils/validation';

const router = Router();
router.use(requireManagerOrAdmin);

function getOwnerScope(req: Request): string | null {
  return req.user?.role === 'admin' ? null : req.user?.userId ?? null;
}

/** Normalise a WhatsApp number — ensures it starts with + and strips spaces.
 *  Returns null if the value is falsy or not a plausible phone number. */
function normalizeWhatsappNumber(raw?: string | null): string | null {
  if (!raw || typeof raw !== 'string') return null;
  const cleaned = raw.replace(/\s+/g, '').trim();
  if (!cleaned) return null;
  // Accept numbers that already have + prefix, or add it if it starts with a digit
  const withPlus = cleaned.startsWith('+') ? cleaned : `+${cleaned}`;
  // Very light validation — must be +<digits> and at least 7 chars
  if (!/^\+\d{7,15}$/.test(withPlus)) return null;
  return withPlus;
}

// ── GET /api/attendees ────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await query(
      `SELECT a.id, a.name, a.email, a.whatsapp_number, a.created_at, a.responses,
              e.title AS event_title, e.id AS event_id
       FROM attendees a
       JOIN events e ON a.event_id = e.id
       WHERE e.organization_id = $1
         AND ($2::uuid IS NULL OR e.created_by = $2::uuid)
       ORDER BY a.created_at DESC`,
      [organizationId, getOwnerScope(req)]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching global attendees:', error);
    return res.status(500).json({ error: 'Failed to load audience directory' });
  }
});

// ── GET /api/attendees/:eventId ───────────────────────────────────────────

router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId }    = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });
    if (!isUuid(eventId)) return res.status(400).json({ error: 'Invalid event id' });

    const result = await query(
      `SELECT a.id, a.name, a.email, a.whatsapp_number, a.created_at, a.responses
       FROM attendees a
       JOIN events e ON a.event_id = e.id
       WHERE a.event_id = $1
         AND e.organization_id = $2
         AND ($3::uuid IS NULL OR e.created_by = $3::uuid)
       ORDER BY a.created_at DESC`,
      [eventId, organizationId, getOwnerScope(req)]
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error fetching attendees:', error);
    return res.status(500).json({ error: 'Failed to load attendees' });
  }
});

// ── POST /api/attendees/:eventId — add single attendee ────────────────────

router.post('/:eventId', async (req: Request, res: Response) => {
  try {
    const { eventId }                = req.params;
    const { name, email, whatsappNumber } = req.body;
    const organizationId             = req.user?.organizationId;
    const normalizedName             = normalizeName(name);
    const normalizedEmail            = normalizeEmail(email);
    const normalizedWhatsapp         = normalizeWhatsappNumber(whatsappNumber);

    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });
    if (!isUuid(eventId)) return res.status(400).json({ error: 'Invalid event id' });
    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({ error: 'A valid name and email are required' });
    }

    const eventCheck = await query(
      `SELECT e.id, e.event_date, e.event_time, o.settings, e.email_theme_id
       FROM events e
       JOIN organizations o ON o.id = e.organization_id
       WHERE e.id = $1
         AND e.organization_id = $2
         AND ($3::uuid IS NULL OR e.created_by = $3::uuid)`,
      [eventId, organizationId, getOwnerScope(req)]
    );

    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { settings, email_theme_id, event_date, event_time } = eventCheck.rows[0];
    const themeId = email_theme_id || 'minimal_light';
    const remindersResult = await query(
      'SELECT type, hours_before FROM reminders WHERE event_id = $1 ORDER BY created_at ASC',
      [eventId]
    );

    const attendeeId = uuidv4();
    const client = await getClient();

    try {
      await client.query('BEGIN');

      await client.query(
        `INSERT INTO attendees (id, event_id, organization_id, name, email, whatsapp_number)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [attendeeId, eventId, organizationId, normalizedName, normalizedEmail, normalizedWhatsapp]
      );

      await queueRemindersForAttendee(client, {
        organizationId,
        eventId,
        attendeeId,
        attendeeEmail: normalizedEmail,
        whatsappNumber: normalizedWhatsapp,
        eventDate: event_date,
        eventTime: event_time,
        themeId,
        settings,
        reminders: remindersResult.rows,
      });

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    return res.status(201).json({ success: true, attendeeId });
  } catch (error) {
    console.error('Error adding attendee:', error);
    return res.status(500).json({ error: 'Failed to add attendee' });
  }
});

// ── POST /api/attendees/:eventId/bulk-upload — CSV import ─────────────────

router.post('/:eventId/bulk-upload', async (req: Request, res: Response) => {
  const { eventId }    = req.params;
  const { attendees }  = req.body;
  const organizationId = req.user?.organizationId;

  if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });
  if (!isUuid(eventId)) return res.status(400).json({ error: 'Invalid event id' });
  if (!Array.isArray(attendees)) return res.status(400).json({ error: 'Invalid attendees data' });
  if (attendees.length > 500) {
    return res.status(400).json({ error: 'Bulk upload is limited to 500 attendees at a time' });
  }

  try {
    const eventRes = await query(
      `SELECT e.event_date, e.event_time, e.email_theme_id, o.settings
       FROM events e
       JOIN organizations o ON o.id = e.organization_id
       WHERE e.id = $1
         AND e.organization_id = $2
         AND ($3::uuid IS NULL OR e.created_by = $3::uuid)`,
      [eventId, organizationId, getOwnerScope(req)]
    );

    if (eventRes.rows.length === 0) {
      return res.status(404).json({ error: 'Event not found.' });
    }

    const { event_date, event_time, email_theme_id, settings } = eventRes.rows[0];
    const themeId = email_theme_id || 'minimal_light';
    const remindersResult = await query(
      'SELECT type, hours_before FROM reminders WHERE event_id = $1 ORDER BY created_at ASC',
      [eventId]
    );

    // Validate and normalise — CSV may include optional whatsapp_number column
    const normalizedAttendees = attendees
      .map((a: any) => ({
        name:            normalizeName(a?.name),
        email:           normalizeEmail(a?.email),
        whatsappNumber:  normalizeWhatsappNumber(a?.whatsapp_number ?? a?.whatsappNumber),
      }))
      .filter((a): a is { name: string; email: string; whatsappNumber: string | null } =>
        Boolean(a.name && a.email)
      );

    if (normalizedAttendees.length === 0) {
      return res.status(400).json({ error: 'No valid attendees were found in the upload' });
    }

    // Bulk insert with whatsapp_number
    const attendeeValues = normalizedAttendees
      .map((_, i) => {
        const o = i * 5;
        return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, $${o + 5})`;
      })
      .join(', ');

    const attendeeParams = normalizedAttendees.flatMap((a) => [
      eventId, organizationId, a.name, a.email, a.whatsappNumber,
    ]);

    const client = await getClient();
    let savedAttendees: Array<{ id: string; email: string; whatsapp_number: string | null }> = [];

    try {
      await client.query('BEGIN');

      const newAttendeesRes = await client.query(
        `INSERT INTO attendees (event_id, organization_id, name, email, whatsapp_number)
         VALUES ${attendeeValues}
         ON CONFLICT DO NOTHING
         RETURNING id, email, whatsapp_number`,
        attendeeParams
      );

      savedAttendees = newAttendeesRes.rows;

      for (const attendee of savedAttendees) {
        await queueRemindersForAttendee(client, {
          organizationId,
          eventId,
          attendeeId: attendee.id,
          attendeeEmail: attendee.email,
          whatsappNumber: attendee.whatsapp_number,
          eventDate: event_date,
          eventTime: event_time,
          themeId,
          settings,
          reminders: remindersResult.rows,
        });
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }

    if (savedAttendees.length > 0) {
      return res.status(200).json({
        addedCount: savedAttendees.length,
        message: `Imported ${savedAttendees.length} attendees and queued reminders.`,
      });
    }

    return res.status(200).json({
      addedCount: savedAttendees.length,
      message: `Imported ${savedAttendees.length} attendees.`,
    });
  } catch (error: any) {
    console.error('Import error:', error);
    return res.status(500).json({ error: 'Failed to import attendees.' });
  }
});

// ── DELETE /api/attendees/remove/:id ─────────────────────────────────────

router.delete('/remove/:id', async (req: Request, res: Response) => {
  try {
    const { id }         = req.params;
    const organizationId = req.user?.organizationId;

    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid attendee id' });

    const deleted = await query(
      `DELETE FROM attendees a
       USING events e
       WHERE a.id = $1
         AND a.organization_id = $2
         AND a.event_id = e.id
         AND e.organization_id = $2
         AND ($3::uuid IS NULL OR e.created_by = $3::uuid)
       RETURNING a.id`,
      [id, organizationId, getOwnerScope(req)]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: 'Attendee not found' });
    }

    await query('DELETE FROM email_queue WHERE attendee_id = $1', [id]);

    return res.json({ success: true });
  } catch (error) {
    console.error('Error deleting attendee:', error);
    return res.status(500).json({ error: 'Failed to delete attendee' });
  }
});

export default router;

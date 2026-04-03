import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';
import { requireManagerOrAdmin } from '../middleware/rbac';
import { isUuid, normalizeEmail, normalizeName } from '../utils/validation';
import { isEmailTypeEnabled } from '../utils/settings';

const router = Router();
router.use(requireManagerOrAdmin);

function getOwnerScope(req: Request): string | null {
  return req.user?.role === 'admin' ? null : req.user?.userId ?? null;
}

// ── GET /api/attendees ────────────────────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await query(
      `SELECT a.id, a.name, a.email, a.created_at, a.responses,
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
      `SELECT a.id, a.name, a.email, a.created_at, a.responses
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
    const { eventId }     = req.params;
    const { name, email } = req.body;
    const organizationId  = req.user?.organizationId;
    const normalizedName  = normalizeName(name);
    const normalizedEmail = normalizeEmail(email);

    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });
    if (!isUuid(eventId)) return res.status(400).json({ error: 'Invalid event id' });
    if (!normalizedName || !normalizedEmail) {
      return res.status(400).json({ error: 'A valid name and email are required' });
    }

    // Fetch event settings AND the stored email theme so confirmation
    // emails use the same theme the organiser chose at publish time.
    const eventCheck = await query(
      `SELECT e.id, o.settings, e.email_theme_id
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

    const { settings, email_theme_id } = eventCheck.rows[0];
    const themeId = email_theme_id || 'minimal_light';

    const attendeeId = uuidv4();
    const result = await query(
      `INSERT INTO attendees (id, event_id, organization_id, name, email)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [attendeeId, eventId, organizationId, normalizedName, normalizedEmail]
    );

    if (isEmailTypeEnabled(settings, 'confirmation')) {
      await query(
        `INSERT INTO email_queue
           (id, organization_id, event_id, attendee_id, attendee_email,
            template_type, email_theme_id, status, send_at)
         VALUES
           (uuid_generate_v4(), $1, $2, $3, $4, 'confirmation', $5, 'pending', CURRENT_TIMESTAMP)`,
        [organizationId, eventId, result.rows[0].id, normalizedEmail, themeId]
      );
    }

    return res.status(201).json({ success: true, attendeeId: result.rows[0].id });
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
    // Fetch event details including the chosen email theme
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

    const eventDateTimeString = `${new Date(event_date).toISOString().split('T')[0]}T${event_time}`;
    const isEventInFuture     = new Date(eventDateTimeString).getTime() > Date.now();
    const shouldQueueConfirmation = isEmailTypeEnabled(settings, 'confirmation');

    // Validate and normalise rows from the CSV
    const normalizedAttendees = attendees
      .map((a: any) => ({
        name:  normalizeName(a?.name),
        email: normalizeEmail(a?.email),
      }))
      .filter((a): a is { name: string; email: string } =>
        Boolean(a.name && a.email)
      );

    if (normalizedAttendees.length === 0) {
      return res.status(400).json({ error: 'No valid attendees were found in the upload' });
    }

    // Bulk insert attendees (ignore duplicates)
    const attendeeValues = normalizedAttendees
      .map((_, i) => {
        const o = i * 4;
        return `($${o + 1}, $${o + 2}, $${o + 3}, $${o + 4})`;
      })
      .join(', ');

    const attendeeParams = normalizedAttendees.flatMap((a) => [
      eventId, organizationId, a.name, a.email,
    ]);

    const newAttendeesRes = await query(
      `INSERT INTO attendees (event_id, organization_id, name, email)
       VALUES ${attendeeValues}
       ON CONFLICT DO NOTHING
       RETURNING id, email`,
      attendeeParams
    );

    const savedAttendees = newAttendeesRes.rows;

    // Queue confirmation emails with the event's chosen theme
    if (isEventInFuture && savedAttendees.length > 0 && shouldQueueConfirmation) {
      const queueValues = savedAttendees
        .map((_, i) => {
          const o = i * 5;
          return `(uuid_generate_v4(), $${o + 1}, $${o + 2}, $${o + 3}, $${o + 4}, 'confirmation', $${o + 5}, 'pending', CURRENT_TIMESTAMP)`;
        })
        .join(', ');

      const queueParams = savedAttendees.flatMap((a) => [
        organizationId,
        eventId,
        a.id,
        a.email,
        themeId,   // ← the event's saved email theme
      ]);

      await query(
        `INSERT INTO email_queue
           (id, organization_id, event_id, attendee_id, attendee_email,
            template_type, email_theme_id, status, send_at)
         VALUES ${queueValues}`,
        queueParams
      );

      return res.status(200).json({
        addedCount: savedAttendees.length,
        message: `Imported ${savedAttendees.length} attendees and queued confirmation emails.`,
      });
    }

    return res.status(200).json({
      addedCount: savedAttendees.length,
      message: shouldQueueConfirmation
        ? `Imported ${savedAttendees.length} attendees. Emails skipped — event has passed or attendees were duplicates.`
        : `Imported ${savedAttendees.length} attendees. Confirmation emails are disabled in organisation settings.`,
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
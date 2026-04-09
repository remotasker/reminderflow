import { Router, Request, Response } from 'express';
import { query } from '../database/db';
import { requirePro } from '../middleware/planMiddleware';
import { isUuid } from '../utils/validation';

const router = Router();

const DAILY_API = 'https://api.daily.co/v1';

function dailyHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
  };
}

function isConfigured(): boolean {
  return Boolean(process.env.DAILY_API_KEY);
}

// ---------------------------------------------------------------------------
// POST /api/video/rooms — create a Daily room for an event (Pro only)
// ---------------------------------------------------------------------------
router.post('/rooms', requirePro, async (req: Request, res: Response) => {
  if (!isConfigured()) {
    return res.status(503).json({ error: 'Video not configured. Add DAILY_API_KEY to backend .env' });
  }

  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { eventId } = req.body;
  if (!eventId || !isUuid(eventId)) {
    return res.status(400).json({ error: 'eventId is required and must be a valid UUID' });
  }

  // Verify event belongs to org
  const eventCheck = await query(
    'SELECT id, daily_room_name FROM events WHERE id = $1 AND organization_id = $2',
    [eventId, req.user.organizationId]
  );
  if (eventCheck.rows.length === 0) {
    return res.status(404).json({ error: 'Event not found' });
  }

  // If room already exists, return it
  if (eventCheck.rows[0].daily_room_name) {
    const existingRoom = await query(
      'SELECT daily_room_name, daily_room_url FROM events WHERE id = $1',
      [eventId]
    );
    return res.json({
      roomName: existingRoom.rows[0].daily_room_name,
      roomUrl: existingRoom.rows[0].daily_room_url,
    });
  }

  try {
    // Create a new Daily room — expires 7 days after creation for safety
    const exp = Math.floor(Date.now() / 1000) + 7 * 24 * 60 * 60;
    const dailyRes = await fetch(`${DAILY_API}/rooms`, {
      method: 'POST',
      headers: dailyHeaders(),
      body: JSON.stringify({
        privacy: 'private',
        properties: {
          exp,
          enable_chat: true,
          enable_screenshare: true,
          max_participants: 50,
        },
      }),
    });

    if (!dailyRes.ok) {
      const errText = await dailyRes.text();
      console.error('Daily API error creating room:', errText);
      return res.status(502).json({ error: 'Failed to create video room' });
    }

    const room = await dailyRes.json() as { name: string; url: string };

    // Persist room info on the event row
    await query(
      'UPDATE events SET daily_room_name = $1, daily_room_url = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [room.name, room.url, eventId]
    );

    return res.status(201).json({ roomName: room.name, roomUrl: room.url });
  } catch (err) {
    console.error('Error creating Daily room:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/video/rooms/:eventId — get room info for an event
// ---------------------------------------------------------------------------
router.get('/rooms/:eventId', async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { eventId } = req.params;
  if (!isUuid(eventId)) return res.status(400).json({ error: 'Invalid eventId' });

  const result = await query(
    'SELECT daily_room_name, daily_room_url FROM events WHERE id = $1 AND organization_id = $2',
    [eventId, req.user.organizationId]
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

  const { daily_room_name, daily_room_url } = result.rows[0];
  if (!daily_room_name) {
    return res.json({ roomName: null, roomUrl: null });
  }

  return res.json({ roomName: daily_room_name, roomUrl: daily_room_url });
});

// ---------------------------------------------------------------------------
// DELETE /api/video/rooms/:eventId — delete Daily room for an event (Pro only)
// ---------------------------------------------------------------------------
router.delete('/rooms/:eventId', requirePro, async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  const { eventId } = req.params;
  if (!isUuid(eventId)) return res.status(400).json({ error: 'Invalid eventId' });

  const result = await query(
    'SELECT daily_room_name FROM events WHERE id = $1 AND organization_id = $2',
    [eventId, req.user.organizationId]
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });

  const roomName: string | null = result.rows[0].daily_room_name;

  if (roomName && isConfigured()) {
    try {
      await fetch(`${DAILY_API}/rooms/${roomName}`, {
        method: 'DELETE',
        headers: dailyHeaders(),
      });
    } catch (err) {
      console.warn('Failed to delete Daily room (continuing):', err);
    }
  }

  await query(
    'UPDATE events SET daily_room_name = NULL, daily_room_url = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = $1',
    [eventId]
  );

  return res.json({ message: 'Room deleted successfully' });
});

// ---------------------------------------------------------------------------
// POST /api/video/token — generate a short-lived meeting token
// ---------------------------------------------------------------------------
router.post('/token', async (req: Request, res: Response) => {
  if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

  if (!isConfigured()) {
    return res.status(503).json({ error: 'Video not configured' });
  }

  const { eventId, isOwner } = req.body;
  if (!eventId || !isUuid(eventId)) {
    return res.status(400).json({ error: 'eventId is required' });
  }

  const result = await query(
    'SELECT daily_room_name FROM events WHERE id = $1 AND organization_id = $2',
    [eventId, req.user.organizationId]
  );

  if (result.rows.length === 0) return res.status(404).json({ error: 'Event not found' });
  if (!result.rows[0].daily_room_name) return res.status(404).json({ error: 'No video room for this event' });

  const roomName: string = result.rows[0].daily_room_name;

  try {
    const exp = Math.floor(Date.now() / 1000) + 4 * 60 * 60; // 4 hour token
    const tokenRes = await fetch(`${DAILY_API}/meeting-tokens`, {
      method: 'POST',
      headers: dailyHeaders(),
      body: JSON.stringify({
        properties: {
          room_name: roomName,
          is_owner: isOwner === true,
          exp,
          user_name: req.user.email ?? 'Organizer',
        },
      }),
    });

    if (!tokenRes.ok) {
      const errText = await tokenRes.text();
      console.error('Daily token error:', errText);
      return res.status(502).json({ error: 'Failed to generate meeting token' });
    }

    const tokenData = await tokenRes.json() as { token: string };
    return res.json({ token: tokenData.token, roomName });
  } catch (err) {
    console.error('Error generating Daily token:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * Deletes a Daily room by room name. Used by the events DELETE route.
 * Safe to call even if DAILY_API_KEY is not configured.
 */
export async function deleteDailyRoom(roomName: string): Promise<void> {
  if (!process.env.DAILY_API_KEY || !roomName) return;
  try {
    await fetch(`${DAILY_API}/rooms/${roomName}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.DAILY_API_KEY}`,
      },
    });
  } catch (err) {
    console.warn('[Daily] Failed to delete room on event delete:', err);
  }
}

export default router;

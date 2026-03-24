import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';

const router = Router();

/**
 * GET /api/events
 * Get all events for the organization
 */
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

/**
 * POST /api/events
 * Create a new event
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { title, description, eventDate, eventTime, timezone, meetingLink, reminderSchedule } = req.body;
    
    if (!title || !eventDate || !eventTime || !timezone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    
    const eventId = uuidv4();
    
    // Create event
    await query(
      `INSERT INTO events (id, organization_id, title, description, event_date, event_time, timezone, meeting_link, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [eventId, req.user.organizationId, title, description, eventDate, eventTime, timezone, meetingLink, req.user.userId]
    );
    
    // Create reminders based on schedule
    if (reminderSchedule && Array.isArray(reminderSchedule)) {
      for (const reminderType of reminderSchedule) {
        let hoursBefore = null;
        
        if (reminderType === 'confirmation') {
          hoursBefore = 0; // Immediately
        } else if (reminderType === '24h') {
          hoursBefore = 24;
        } else if (reminderType === '1h') {
          hoursBefore = 1;
        } else if (reminderType === '10m') {
          hoursBefore = 0.167; // 10 minutes
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

/**
 * GET /api/events/:id
 * Get a single event with attendees and reminders
 */
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
    
    // Get reminders
    const remindersResult = await query(
      'SELECT type, hours_before FROM reminders WHERE event_id = $1',
      [id]
    );
    
    // Get attendee count
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

/**
 * PUT /api/events/:id
 * Update an event
 */
router.put('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    const { title, description, eventDate, eventTime, timezone, meetingLink } = req.body;
    
    // Verify ownership
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
    
    await query(
      `UPDATE events SET title = $1, description = $2, event_date = $3, event_time = $4, timezone = $5, meeting_link = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7`,
      [title, description, eventDate, eventTime, timezone, meetingLink, id]
    );
    
    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/events/:id
 * Delete an event
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    // Verify ownership
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

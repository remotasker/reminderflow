import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';

const router = Router();

/**
 * GET /api/attendees/:eventId
 * Get all attendees for an event
 */
router.get('/:eventId', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { eventId } = req.params;
    
    // Verify event ownership
    const eventCheck = await query(
      'SELECT organization_id FROM events WHERE id = $1',
      [eventId]
    );
    
    if (eventCheck.rows.length === 0 || eventCheck.rows[0].organization_id !== req.user.organizationId) {
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

/**
 * POST /api/attendees/:eventId
 * Add a single attendee
 */
router.post('/:eventId', async (req: Request, res: Response) => {
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
    const eventCheck = await query(
      'SELECT organization_id FROM events WHERE id = $1',
      [eventId]
    );
    
    if (eventCheck.rows.length === 0 || eventCheck.rows[0].organization_id !== req.user.organizationId) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    const attendeeId = uuidv4();
    
    await query(
      'INSERT INTO attendees (id, event_id, name, email) VALUES ($1, $2, $3, $4)',
      [attendeeId, eventId, name, email]
    );
    
    // Create email queue entries for each reminder
    const remindersResult = await query(
      'SELECT type, hours_before FROM reminders WHERE event_id = $1',
      [eventId]
    );
    
    const eventResult = await query(
      'SELECT event_date, event_time FROM events WHERE id = $1',
      [eventId]
    );
    
  if (eventResult.rows.length > 0) {
  const eventData = eventResult.rows[0];
  
  // 1. Better date parsing (handles cases where date/time might already be objects or strings)
  const dateStr = eventData.event_date instanceof Date 
    ? eventData.event_date.toISOString().split('T')[0] 
    : eventData.event_date;
    
  const eventDateTime = new Date(`${dateStr}T${eventData.event_time}`);

  // 2. Safety Check: If the date is still invalid, stop here!
  if (isNaN(eventDateTime.getTime())) {
    console.error("Invalid Date created from:", dateStr, eventData.event_time);
    return res.status(400).json({ error: 'Event date or time is invalid in the database.' });
  }

  for (const reminder of remindersResult.rows) {
    // 3. Ensure hours_before is treated as a number
    const hours = parseFloat(reminder.hours_before);
    const sendTime = new Date(eventDateTime.getTime() - (hours * 60 * 60 * 1000));
    
    // Final check before DB insert
    if (isNaN(sendTime.getTime())) continue; 

    await query(
      `INSERT INTO email_queue (id, organization_id, event_id, attendee_id, attendee_email, template_type, send_at, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [uuidv4(), req.user.organizationId, eventId, attendeeId, email, reminder.type, sendTime, 'pending']
    );
  }
}
    
    res.status(201).json({
      message: 'Attendee added successfully',
      attendeeId,
    });
  } catch (error) {
    console.error('Error adding attendee:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/attendees/:eventId/bulk-upload
 * Upload attendees from CSV
 */
router.post('/:eventId/bulk-upload', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { eventId } = req.params;
    const { attendees } = req.body;
    
    if (!Array.isArray(attendees) || attendees.length === 0) {
      return res.status(400).json({ error: 'Attendees array is required' });
    }
    
    // Verify event ownership
    const eventCheck = await query(
      'SELECT organization_id FROM events WHERE id = $1',
      [eventId]
    );
    
    if (eventCheck.rows.length === 0 || eventCheck.rows[0].organization_id !== req.user.organizationId) {
      return res.status(404).json({ error: 'Event not found' });
    }
    
    // Get event details
    const eventResult = await query(
      'SELECT event_date, event_time FROM events WHERE id = $1',
      [eventId]
    );
    
    const eventData = eventResult.rows[0];
    const eventDateTime = new Date(`${eventData.event_date}T${eventData.event_time}`);
    
    // Get reminders
    const remindersResult = await query(
      'SELECT type, hours_before FROM reminders WHERE event_id = $1',
      [eventId]
    );
    
    let addedCount = 0;
    const errors = [];
    
    for (const att of attendees) {
      try {
        if (!att.name || !att.email) {
          errors.push(`Invalid attendee: ${JSON.stringify(att)}`);
          continue;
        }
        
        const attendeeId = uuidv4();
        
        await query(
          'INSERT INTO attendees (id, event_id, name, email) VALUES ($1, $2, $3, $4)',
          [attendeeId, eventId, att.name, att.email]
        );
        
        // Create email queue entries for each reminder
        for (const reminder of remindersResult.rows) {
          const sendTime = new Date(eventDateTime.getTime() - reminder.hours_before * 60 * 60 * 1000);
          
          await query(
            `INSERT INTO email_queue (id, organization_id, event_id, attendee_id, attendee_email, template_type, send_at, status)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [uuidv4(), req.user.organizationId, eventId, attendeeId, att.email, reminder.type, sendTime, 'pending']
          );
        }
        
        addedCount++;
      } catch (err) {
        errors.push(`Error adding ${att.email}: ${err}`);
      }
    }
    
    res.json({
      message: `${addedCount} attendees added successfully`,
      addedCount,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (error) {
    console.error('Error uploading attendees:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/attendees/:id
 * Delete an attendee
 */
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    
    const { id } = req.params;
    
    // Verify ownership through event
    const attendeeCheck = await query(
      `SELECT a.event_id, e.organization_id FROM attendees a
       JOIN events e ON a.event_id = e.id
       WHERE a.id = $1`,
      [id]
    );
    
    if (attendeeCheck.rows.length === 0 || attendeeCheck.rows[0].organization_id !== req.user.organizationId) {
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

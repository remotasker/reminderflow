import { Router, Request, Response } from 'express';
import { query } from '../database/db';

const router = Router();

/**
 * GET /api/analytics/metrics
 * Get dashboard metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Total events
    const eventsResult = await query(
      'SELECT COUNT(*) as count FROM events WHERE organization_id = $1',
      [req.user.organizationId]
    );

    // Total attendees
    const attendeesResult = await query(
      `SELECT COUNT(*) as count FROM attendees a
       JOIN events e ON a.event_id = e.id
       WHERE e.organization_id = $1`,
      [req.user.organizationId]
    );

    // Total emails sent
    const emailsSentResult = await query(
      'SELECT COUNT(*) as count FROM email_logs WHERE organization_id = $1',
      [req.user.organizationId]
    );

    // Count of upcoming events (ORDER BY and LIMIT are meaningless on a COUNT —
    // they were removed; the WHERE clause is all that's needed here).
    const upcomingResult = await query(
      `SELECT COUNT(*) as count FROM events
       WHERE organization_id = $1 AND event_date >= CURRENT_DATE`,
      [req.user.organizationId]
    );

    res.json({
      totalEvents: parseInt(eventsResult.rows[0].count),
      totalAttendees: parseInt(attendeesResult.rows[0].count),
      emailsSent: parseInt(emailsSentResult.rows[0].count),
      upcomingEvents: parseInt(upcomingResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/email-stats
 * Get email statistics
 */
router.get('/email-stats', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const totalResult = await query(
      'SELECT COUNT(*) as count FROM email_logs WHERE organization_id = $1',
      [req.user.organizationId]
    );

    const openedResult = await query(
      'SELECT COUNT(*) as count FROM email_logs WHERE organization_id = $1 AND opened_at IS NOT NULL',
      [req.user.organizationId]
    );

    const clickedResult = await query(
      `SELECT COUNT(DISTINCT ecl.email_log_id) as count FROM email_click_logs ecl
       JOIN email_logs el ON ecl.email_log_id = el.id
       WHERE el.organization_id = $1`,
      [req.user.organizationId]
    );

    const totalEmails = parseInt(totalResult.rows[0].count);
    const openedEmails = parseInt(openedResult.rows[0].count);
    const clickedEmails = parseInt(clickedResult.rows[0].count);

    res.json({
      totalEmails,
      openedEmails,
      clickedEmails,
      openRate: totalEmails > 0 ? ((openedEmails / totalEmails) * 100).toFixed(2) : '0',
      clickRate: totalEmails > 0 ? ((clickedEmails / totalEmails) * 100).toFixed(2) : '0',
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/events-stats
 * Get per-event attendee counts
 */
router.get('/events-stats', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT e.id, e.title, e.event_date, COUNT(a.id) as attendee_count
       FROM events e
       LEFT JOIN attendees a ON e.id = a.event_id
       WHERE e.organization_id = $1
       GROUP BY e.id, e.title, e.event_date
       ORDER BY e.event_date DESC
       LIMIT 10`,
      [req.user.organizationId]
    );

    res.json(
      result.rows.map(row => ({
        id: row.id,
        title: row.title,
        eventDate: row.event_date,
        attendeeCount: parseInt(row.attendee_count),
      }))
    );
  } catch (error) {
    console.error('Error fetching events stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/analytics/timeline
 * Get email send timeline for charts (last 30 days)
 */
router.get('/timeline', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await query(
      `SELECT DATE(sent_at) as date, COUNT(*) as count
       FROM email_logs
       WHERE organization_id = $1 AND sent_at >= CURRENT_DATE - INTERVAL '30 days'
       GROUP BY DATE(sent_at)
       ORDER BY DATE(sent_at) ASC`,
      [req.user.organizationId]
    );

    res.json(
      result.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count),
      }))
    );
  } catch (error) {
    console.error('Error fetching timeline:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
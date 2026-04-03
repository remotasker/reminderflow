import { Router, Request, Response } from 'express';
import { query } from '../database/db';
import { requireManagerOrAdmin } from '../middleware/rbac';

const router = Router();
router.use(requireManagerOrAdmin);

function getOwnerScope(req: Request): string | null {
  return req.user?.role === 'admin' ? null : req.user?.userId ?? null;
}

/**
 * GET /api/analytics/metrics
 * Get dashboard metrics
 */
router.get('/metrics', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const ownerScope = getOwnerScope(req);

    // Total events
    const eventsResult = await query(
      `SELECT COUNT(*) as count
       FROM events
       WHERE organization_id = $1
         AND ($2::uuid IS NULL OR created_by = $2::uuid)`,
      [req.user.organizationId, ownerScope]
    );

    // Total attendees
    const attendeesResult = await query(
      `SELECT COUNT(*) as count FROM attendees a
       JOIN events e ON a.event_id = e.id
       WHERE e.organization_id = $1
         AND ($2::uuid IS NULL OR e.created_by = $2::uuid)`,
      [req.user.organizationId, ownerScope]
    );

    // Total emails sent
    const emailsSentResult = await query(
      `SELECT COUNT(*) as count
       FROM email_logs el
       JOIN events e ON el.event_id = e.id
       WHERE el.organization_id = $1
         AND ($2::uuid IS NULL OR e.created_by = $2::uuid)`,
      [req.user.organizationId, ownerScope]
    );

    // Count of upcoming events (ORDER BY and LIMIT are meaningless on a COUNT —
    // they were removed; the WHERE clause is all that's needed here).
    const upcomingResult = await query(
      `SELECT COUNT(*) as count FROM events
       WHERE organization_id = $1
         AND event_date >= CURRENT_DATE
         AND ($2::uuid IS NULL OR created_by = $2::uuid)`,
      [req.user.organizationId, ownerScope]
    );

    return res.json({
      totalEvents: parseInt(eventsResult.rows[0].count),
      totalAttendees: parseInt(attendeesResult.rows[0].count),
      emailsSent: parseInt(emailsSentResult.rows[0].count),
      upcomingEvents: parseInt(upcomingResult.rows[0].count),
    });
  } catch (error) {
    console.error('Error fetching metrics:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
    const ownerScope = getOwnerScope(req);

    const totalResult = await query(
      `SELECT COUNT(*) as count
       FROM email_logs el
       JOIN events e ON el.event_id = e.id
       WHERE el.organization_id = $1
         AND ($2::uuid IS NULL OR e.created_by = $2::uuid)`,
      [req.user.organizationId, ownerScope]
    );

    const openedResult = await query(
      `SELECT COUNT(*) as count
       FROM email_logs el
       JOIN events e ON el.event_id = e.id
       WHERE el.organization_id = $1
         AND el.opened_at IS NOT NULL
         AND ($2::uuid IS NULL OR e.created_by = $2::uuid)`,
      [req.user.organizationId, ownerScope]
    );

    const clickedResult = await query(
      `SELECT COUNT(DISTINCT ecl.email_log_id) as count FROM email_click_logs ecl
       JOIN email_logs el ON ecl.email_log_id = el.id
       JOIN events e ON el.event_id = e.id
       WHERE el.organization_id = $1
         AND ($2::uuid IS NULL OR e.created_by = $2::uuid)`,
      [req.user.organizationId, ownerScope]
    );

    const totalEmails = parseInt(totalResult.rows[0].count);
    const openedEmails = parseInt(openedResult.rows[0].count);
    const clickedEmails = parseInt(clickedResult.rows[0].count);

    return res.json({
      totalEmails,
      openedEmails,
      clickedEmails,
      openRate: totalEmails > 0 ? ((openedEmails / totalEmails) * 100).toFixed(2) : '0',
      clickRate: totalEmails > 0 ? ((clickedEmails / totalEmails) * 100).toFixed(2) : '0',
    });
  } catch (error) {
    console.error('Error fetching email stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
    const ownerScope = getOwnerScope(req);

    const result = await query(
      `SELECT e.id, e.title, e.event_date, COUNT(a.id) as attendee_count
       FROM events e
       LEFT JOIN attendees a ON e.id = a.event_id
       WHERE e.organization_id = $1
         AND ($2::uuid IS NULL OR e.created_by = $2::uuid)
       GROUP BY e.id, e.title, e.event_date
       ORDER BY e.event_date DESC
       LIMIT 10`,
      [req.user.organizationId, ownerScope]
    );

    return res.json(
      result.rows.map(row => ({
        id: row.id,
        title: row.title,
        eventDate: row.event_date,
        attendeeCount: parseInt(row.attendee_count),
      }))
    );
  } catch (error) {
    console.error('Error fetching events stats:', error);
    return res.status(500).json({ error: 'Internal server error' });
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
    const ownerScope = getOwnerScope(req);

    const result = await query(
      `SELECT DATE(sent_at) as date, COUNT(*) as count
       FROM email_logs el
       JOIN events e ON el.event_id = e.id
       WHERE el.organization_id = $1
         AND el.sent_at >= CURRENT_DATE - INTERVAL '30 days'
         AND ($2::uuid IS NULL OR e.created_by = $2::uuid)
       GROUP BY DATE(sent_at)
       ORDER BY DATE(sent_at) ASC`,
      [req.user.organizationId, ownerScope]
    );

    return res.json(
      result.rows.map(row => ({
        date: row.date,
        count: parseInt(row.count),
      }))
    );
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

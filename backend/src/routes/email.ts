import { Router, Request, Response } from 'express';
import { query } from '../database/db';

const router = Router();

/**
 * GET /api/email/track-pixel/:trackingId
 * Track email opens via pixel
 */
router.get('/track-pixel/:trackingId', async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    
    // Find email log
    const result = await query(
      'SELECT id FROM email_logs WHERE tracking_id = $1',
      [trackingId]
    );
    
    if (result.rows.length > 0) {
      // Mark as opened
      await query(
        'UPDATE email_logs SET opened_at = CURRENT_TIMESTAMP WHERE tracking_id = $1 AND opened_at IS NULL',
        [trackingId]
      );
    }
    
    // Return a 1x1 transparent GIF
    const gif = Buffer.from([
      0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00,
      0x01, 0x00, 0x80, 0x00, 0x00, 0xff, 0xff, 0xff,
      0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00, 0x02, 0x02, 0x44,
      0x01, 0x00, 0x3b
    ]);
    
    res.setHeader('Content-Type', 'image/gif');
    res.setHeader('Content-Length', gif.length);
    res.send(gif);
  } catch (error) {
    console.error('Error tracking pixel:', error);
    res.status(500).end();
  }
});

/**
 * GET /api/email/track-click/:trackingId
 * Track email clicks and redirect
 */
router.get('/track-click/:trackingId', async (req: Request, res: Response) => {
  try {
    const { trackingId } = req.params;
    const url = req.query.url as string;
    
    if (!url) {
      return res.status(400).json({ error: 'URL parameter required' });
    }
    
    // Find email log
    const result = await query(
      'SELECT id FROM email_logs WHERE tracking_id = $1',
      [trackingId]
    );
    
    if (result.rows.length > 0) {
      // Log the click
      await query(
        `INSERT INTO email_click_logs (id, email_log_id, url, clicked_at)
         VALUES (uuid_generate_v4(), $1, $2, CURRENT_TIMESTAMP)`,
        [result.rows[0].id, url]
      );
    }
    
    // Redirect to the URL
    res.redirect(url);
  } catch (error) {
    console.error('Error tracking click:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';
import { requireManagerOrAdmin } from '../middleware/rbac';
import { isValidHexColor, normalizeOptionalText } from '../utils/validation';
import { getThemeHtml } from '../utils/emailThemes';

const router = Router();
router.use(requireManagerOrAdmin);

const VALID_TYPES = ['confirmation', '24h', '1h', '10m'] as const;
type TemplateType = typeof VALID_TYPES[number];

const EMAIL_TYPE_LABELS: Record<string, string> = {
  confirmation: 'You\'re registered!',
  '24h':        'Your event is tomorrow',
  '1h':         'Your event starts in 1 hour',
  '10m':        'Your event starts in 10 minutes',
};

// ---------------------------------------------------------------------------
// GET /api/templates
// ---------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const templateResult = await query(
      'SELECT type, subject, theme_id, custom_message, updated_at FROM email_templates WHERE organization_id = $1',
      [req.user.organizationId]
    );

    const orgResult = await query(
      'SELECT primary_color, secondary_color, name FROM organizations WHERE id = $1',
      [req.user.organizationId]
    );

    const saved: Record<string, any> = {};
    for (const row of templateResult.rows) saved[row.type] = row;

    const templates = VALID_TYPES.map(type => {
      if (saved[type]) {
        return {
          type,
          subject:       saved[type].subject,
          themeId:       saved[type].theme_id,
          customMessage: saved[type].custom_message || '',
          isCustom:      true,
          updatedAt:     saved[type].updated_at,
        };
      }
      return {
        type,
        subject:       `Reminder: {{event_title}}`,
        themeId:       'minimal_light',
        customMessage: '',
        isCustom:      false,
        updatedAt:     null,
      };
    });

    return res.json({
      templates,
      branding:      orgResult.rows[0] || { primary_color: '#2563eb', secondary_color: '#0ea5e9' },
      organizerName: orgResult.rows[0]?.name || 'Your Organization',
    });
  } catch (error) {
    console.error('Error fetching templates:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/templates/defaults
// ---------------------------------------------------------------------------
router.get('/defaults', async (_req: Request, res: Response) => {
  const defaults = VALID_TYPES.map(type => ({
    type,
    subject:       `Reminder: {{event_title}}`,
    themeId:       'minimal_light',
    customMessage: '',
  }));
  return res.json(defaults);
});

// ---------------------------------------------------------------------------
// POST /api/templates/preview
// Accepts real event data from the form so the preview reflects the actual event.
// Also accepts a specific emailType so each tab shows the correct subject label.
// ---------------------------------------------------------------------------
router.post('/preview', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const {
      theme_id,
      custom_message,
      primary_color,
      secondary_color,
      // Real event data from Step 2
      event_title,
      event_date,
      event_time,
      meeting_link,
      email_type,   // 'confirmation' | '24h' | '1h' | '10m'
    } = req.body;

    // Fetch org name for the organizer field
    const orgResult = await query(
      'SELECT name, primary_color, secondary_color FROM organizations WHERE id = $1',
      [req.user.organizationId]
    );
    const org = orgResult.rows[0];

    const resolvedPrimary   = primary_color   || org?.primary_color   || '#2563eb';
    const resolvedSecondary = secondary_color || org?.secondary_color || '#0ea5e9';

    const emailData = {
      attendeeName:   'Alex Morgan',
      eventTitle:     event_title   || 'Your Upcoming Event',
      eventDate:      event_date    || 'October 15, 2026',
      eventTime:      event_time    || '2:00 PM',
      location:       meeting_link  || 'Virtual / Online',
      joinLink:       meeting_link  || '#',
      customMessage:  custom_message || '',
      brandPrimary:   resolvedPrimary,
      brandSecondary: resolvedSecondary,
      organizerName:  org?.name || 'Your Organization',
      // Pass email_type so each theme renders the correct copy + urgency bar
      emailType:      email_type || 'confirmation',
    };

    const html = getThemeHtml(theme_id || 'minimal_light', emailData);

    // Resolve the subject line for this email type
    const typeLabel  = EMAIL_TYPE_LABELS[email_type || 'confirmation'] ?? 'Event Reminder';
    const subject    = `${typeLabel} — ${emailData.eventTitle}`;

    return res.json({ html, subject });
  } catch (error) {
    console.error('Error generating preview:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/templates/branding
// ---------------------------------------------------------------------------
router.put('/branding', requireManagerOrAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { primary_color, secondary_color } = req.body;

    if (!isValidHexColor(primary_color) || !isValidHexColor(secondary_color)) {
      return res.status(400).json({ error: 'Both colors must be valid hex values like #2563eb' });
    }

    await query(
      'UPDATE organizations SET primary_color = $1, secondary_color = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
      [primary_color, secondary_color, req.user.organizationId]
    );

    return res.json({ message: 'Brand colors updated successfully' });
  } catch (error) {
    console.error('Error saving branding:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/templates/:type
// ---------------------------------------------------------------------------
router.put('/:type', requireManagerOrAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { type } = req.params;
    const { subject, theme_id, custom_message } = req.body;

    const normalizedSubject = normalizeOptionalText(subject, 255);
    const normalizedTheme   = normalizeOptionalText(theme_id, 50) || 'minimal_light';
    const normalizedMessage = normalizeOptionalText(custom_message, 2000) || '';

    if (!VALID_TYPES.includes(type as TemplateType)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    if (!normalizedSubject) {
      return res.status(400).json({ error: 'Subject is required' });
    }

    await query(
      `INSERT INTO email_templates (id, organization_id, type, subject, theme_id, custom_message, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (organization_id, type)
       DO UPDATE SET
         subject        = EXCLUDED.subject,
         theme_id       = EXCLUDED.theme_id,
         custom_message = EXCLUDED.custom_message,
         updated_at     = CURRENT_TIMESTAMP`,
      [uuidv4(), req.user.organizationId, type, normalizedSubject, normalizedTheme, normalizedMessage]
    );

    return res.json({ message: 'Template saved successfully' });
  } catch (error) {
    console.error('Error saving template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/templates/:type
// ---------------------------------------------------------------------------
router.delete('/:type', requireManagerOrAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { type } = req.params;

    if (!VALID_TYPES.includes(type as TemplateType)) {
      return res.status(400).json({ error: `Invalid type. Must be one of: ${VALID_TYPES.join(', ')}` });
    }

    await query(
      'DELETE FROM email_templates WHERE organization_id = $1 AND type = $2',
      [req.user.organizationId, type]
    );

    return res.json({ message: 'Template reset to default' });
  } catch (error) {
    console.error('Error deleting template:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
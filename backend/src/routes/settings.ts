import { Router, Request, Response } from 'express';
import { query } from '../database/db';
import { requireAdmin, requireManagerOrAdmin } from '../middleware/rbac';
import { exceedsJsonSize, isPlainObject } from '../utils/validation';

const router = Router();
router.use(requireManagerOrAdmin);

/**
 * GET /api/settings
 * Get organization settings
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });

    const result = await query(
      'SELECT settings FROM organizations WHERE id = $1',
      [organizationId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Organization not found' });

    return res.json(result.rows[0].settings || {});
  } catch (error) {
    console.error('Error fetching settings:', error);
    return res.status(500).json({ error: 'Failed to load settings' });
  }
});

/**
 * POST /api/settings
 * Update organization settings
 */
router.post('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const organizationId = req.user?.organizationId;
    const updates = req.body;

    if (!organizationId) return res.status(401).json({ error: 'Unauthorized' });
    if (!isPlainObject(updates) || exceedsJsonSize(updates, 20_000)) {
      return res.status(400).json({ error: 'Invalid settings payload' });
    }

    // Merge with existing settings
    const existing = await query('SELECT settings FROM organizations WHERE id = $1', [organizationId]);
    const currentSettings = existing.rows[0]?.settings || {};
    const newSettings = { ...currentSettings, ...updates };

    await query(
      'UPDATE organizations SET settings = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [JSON.stringify(newSettings), organizationId]
    );

    return res.json({ success: true, settings: newSettings });
  } catch (error) {
    console.error('Error updating settings:', error);
    return res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;

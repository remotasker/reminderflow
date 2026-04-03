import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';
import { hashPassword } from '../utils/auth';
import { requireAdmin } from '../middleware/rbac';
import {
  exceedsJsonSize,
  isPlainObject,
  isSafeHttpUrl,
  normalizeEmail,
  normalizeName,
  normalizeOptionalText,
  normalizeSlug,
  validatePasswordStrength,
} from '../utils/validation';
import { mergeOrganizationSettings } from '../utils/settings';

const router = Router();

const NAME_CHANGE_DAYS = 30;

// ---------------------------------------------------------------------------
// GET /api/org — fetch organization profile
// (public to all authenticated users so the top bar can show org name)
// ---------------------------------------------------------------------------
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await query(
      `SELECT id, name, slug, website, name_last_changed, primary_color, secondary_color, settings, created_at
       FROM organizations WHERE id = $1`,
      [req.user.organizationId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const org = result.rows[0];

    // Calculate days remaining before name can be changed
    let nameChangeDaysRemaining = 0;
    if (org.name_last_changed) {
      const daysSince = Math.floor(
        (Date.now() - new Date(org.name_last_changed).getTime()) / (1000 * 60 * 60 * 24)
      );
      nameChangeDaysRemaining = Math.max(0, NAME_CHANGE_DAYS - daysSince);
    }

    res.json({
      id:                    org.id,
      name:                  org.name,
      slug:                  org.slug,
      website:               org.website,
      primaryColor:          org.primary_color,
      secondaryColor:        org.secondary_color,
      nameLastChanged:       org.name_last_changed,
      nameChangeDaysRemaining,
      canChangeName:         nameChangeDaysRemaining === 0,
      settings:              org.settings || {},
      createdAt:             org.created_at,
    });
  } catch (error) {
    console.error('Error fetching org:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// PUT /api/org — update organization profile (admin only)
// ---------------------------------------------------------------------------
router.put('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { name, slug, website } = req.body;
    const normalizedName = name === undefined ? undefined : normalizeName(name);
    const normalizedSlug = slug === undefined ? undefined : normalizeSlug(slug);
    const normalizedWebsite = website === undefined
      ? undefined
      : normalizeOptionalText(website, 255);

    if (name !== undefined && !normalizedName) {
      return res.status(400).json({ error: 'Organization name must be between 1 and 255 characters' });
    }

    if (slug !== undefined && !normalizedSlug) {
      return res.status(400).json({ error: 'Slug may only contain lowercase letters, numbers, and hyphens' });
    }

    if (normalizedWebsite && !isSafeHttpUrl(normalizedWebsite)) {
      return res.status(400).json({ error: 'Website must be a valid HTTP or HTTPS URL' });
    }

    const orgResult = await query(
      'SELECT name, slug, name_last_changed FROM organizations WHERE id = $1',
      [req.user!.organizationId]
    );

    if (orgResult.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    const org = orgResult.rows[0];

    // Check 30-day name change restriction
    const nameChanged = normalizedName && normalizedName !== org.name;
    if (nameChanged && org.name_last_changed) {
      const daysSince = Math.floor(
        (Date.now() - new Date(org.name_last_changed).getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSince < NAME_CHANGE_DAYS) {
        const remaining = NAME_CHANGE_DAYS - daysSince;
        return res.status(400).json({
          error: `Organization name can only be changed every ${NAME_CHANGE_DAYS} days. ${remaining} day${remaining !== 1 ? 's' : ''} remaining.`,
          daysRemaining: remaining,
        });
      }
    }

    // Check slug uniqueness if changing
    if (normalizedSlug && normalizedSlug !== org.slug) {
      const slugCheck = await query(
        'SELECT id FROM organizations WHERE slug = $1 AND id != $2',
        [normalizedSlug, req.user!.organizationId]
      );
      if (slugCheck.rows.length > 0) {
        return res.status(409).json({ error: 'This slug is already taken' });
      }
    }

    await query(
      `UPDATE organizations SET
         name              = COALESCE($1, name),
         slug              = COALESCE($2, slug),
         website           = COALESCE($3, website),
         name_last_changed = CASE WHEN $4 THEN CURRENT_TIMESTAMP ELSE name_last_changed END,
         updated_at        = CURRENT_TIMESTAMP
       WHERE id = $5`,
      [
        normalizedName ?? null,
        normalizedSlug ?? null,
        normalizedWebsite ?? null,
        Boolean(nameChanged),
        req.user!.organizationId,
      ]
    );

    res.json({ message: 'Organization updated successfully' });
  } catch (error) {
    console.error('Error updating org:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// GET /api/org/settings — fetch org settings (notifications etc.)
// ---------------------------------------------------------------------------
router.get('/settings', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const result = await query(
      'SELECT settings FROM organizations WHERE id = $1',
      [req.user.organizationId]
    );

    res.json(result.rows[0]?.settings || {});
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/org/settings — save org settings (notifications etc.)
// ---------------------------------------------------------------------------
router.post('/settings', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const incoming = req.body;
    if (!isPlainObject(incoming) || exceedsJsonSize(incoming, 20_000)) {
      return res.status(400).json({ error: 'Settings payload is invalid or too large' });
    }

    const existing = await query(
      'SELECT settings FROM organizations WHERE id = $1',
      [req.user.organizationId]
    );
    const merged = mergeOrganizationSettings(existing.rows[0]?.settings, incoming);

    await query(
      `UPDATE organizations SET settings = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [JSON.stringify(merged), req.user.organizationId]
    );

    res.json({ message: 'Settings saved', settings: merged });
  } catch (error) {
    console.error('Error saving settings:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// POST /api/org/integrations/test-webhook — verify a webhook endpoint responds
// ---------------------------------------------------------------------------
router.post('/integrations/test-webhook', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { url } = req.body;
    if (!isSafeHttpUrl(url)) {
      return res.status(400).json({ error: 'Webhook URL must be a valid HTTP or HTTPS URL' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5_000);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'reminderflow_connection_test',
          organizationId: req.user.organizationId,
          sentAt: new Date().toISOString(),
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        return res.status(502).json({ error: `Webhook returned HTTP ${response.status}` });
      }

      return res.json({ ok: true, status: response.status });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error: any) {
    console.error('Error testing webhook:', error);
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'Webhook test timed out after 5 seconds' });
    }

    return res.status(502).json({ error: 'Failed to reach the webhook URL' });
  }
});

// ---------------------------------------------------------------------------
// DELETE /api/org — delete the current organization and all associated data
// ---------------------------------------------------------------------------
router.delete('/', requireAdmin, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const deleted = await query(
      'DELETE FROM organizations WHERE id = $1 RETURNING id',
      [req.user.organizationId]
    );

    if (deleted.rows.length === 0) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    return res.json({ message: 'Organization deleted successfully' });
  } catch (error) {
    console.error('Error deleting organization:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// ---------------------------------------------------------------------------
// User management routes (admin only)
// ---------------------------------------------------------------------------
router.use('/users', requireAdmin);

router.get('/users', async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, email, full_name, role, created_at FROM users
       WHERE organization_id = $1 ORDER BY created_at ASC`,
      [req.user!.organizationId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/users', async (req: Request, res: Response) => {
  try {
    const { email, fullName, password, role } = req.body;
    const normalizedEmail = normalizeEmail(email);
    const normalizedFullName = normalizeName(fullName);
    const passwordError = validatePasswordStrength(password);

    if (!normalizedEmail || !normalizedFullName || passwordError) {
      return res.status(400).json({ error: passwordError || 'email and fullName are required' });
    }

    const validRoles = ['admin', 'manager'];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: 'role must be admin or manager' });
    }
    const existing = await query(
      'SELECT id FROM users WHERE organization_id = $1 AND email = $2',
      [req.user!.organizationId, normalizedEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'A user with this email already exists' });
    }
    const userId       = uuidv4();
    const passwordHash = await hashPassword(password);
    const assignedRole = role || 'manager';
    await query(
      `INSERT INTO users (id, organization_id, email, password_hash, full_name, role)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [userId, req.user!.organizationId, normalizedEmail, passwordHash, normalizedFullName, assignedRole]
    );
    res.status(201).json({
      message: 'User created successfully',
      user: { id: userId, email: normalizedEmail, fullName: normalizedFullName, role: assignedRole },
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/users/:id/role', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    if (!['admin', 'manager'].includes(role)) {
      return res.status(400).json({ error: 'role must be admin or manager' });
    }
    if (id === req.user!.userId) {
      return res.status(400).json({ error: 'You cannot change your own role' });
    }
    const result = await query(
      `UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND organization_id = $3 RETURNING id`,
      [role, id, req.user!.organizationId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'Role updated successfully' });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/users/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (id === req.user!.userId) {
      return res.status(400).json({ error: 'You cannot remove yourself' });
    }
    const result = await query(
      `DELETE FROM users WHERE id = $1 AND organization_id = $2 RETURNING id`,
      [id, req.user!.organizationId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User removed successfully' });
  } catch (error) {
    console.error('Error removing user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

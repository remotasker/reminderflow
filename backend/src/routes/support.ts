import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/db';
import { normalizeOptionalText } from '../utils/validation';

const router = Router();

router.post('/tickets', async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

    const { inquiryType, priority, message } = req.body;
    const normalizedInquiryType = normalizeOptionalText(inquiryType, 100);
    const normalizedPriority = normalizeOptionalText(priority, 50);
    const normalizedMessage = normalizeOptionalText(message, 5000);

    if (!normalizedInquiryType || !normalizedPriority || !normalizedMessage) {
      return res.status(400).json({ error: 'inquiryType, priority, and message are required' });
    }

    await query(
      `INSERT INTO support_tickets (id, organization_id, inquiry_type, priority, message)
       VALUES ($1, $2, $3, $4, $5)`,
      [uuidv4(), req.user.organizationId, normalizedInquiryType, normalizedPriority, normalizedMessage]
    );

    return res.status(201).json({ message: 'Ticket created successfully' });
  } catch (error) {
    console.error('Error creating support ticket:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;

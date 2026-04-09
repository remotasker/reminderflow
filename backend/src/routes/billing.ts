import { Router, Request, Response } from 'express';
import Stripe from 'stripe';
import { query } from '../database/db';
import authMiddleware from '../middleware/auth';

const router = Router();

// Stripe is optional — if not configured, billing endpoints return 503
function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2024-06-20' });
}

// ── GET /api/billing/status ───────────────────────────────────────────────────

router.get('/status', authMiddleware, async (req: Request, res: Response) => {
  try {
    const { rows } = await query(
      `SELECT plan, status, trial_ends_at, current_period_end
       FROM subscriptions WHERE organization_id = $1`,
      [req.user!.organizationId]
    );

    if (rows.length === 0) {
      // No subscription row yet — treat as free
      return res.json({ plan: 'free', status: 'active', trialEndsAt: null, currentPeriodEnd: null });
    }

    const sub = rows[0];
    let trialDaysLeft: number | null = null;
    if (sub.trial_ends_at) {
      const diff = new Date(sub.trial_ends_at).getTime() - Date.now();
      trialDaysLeft = Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
    }

    return res.json({
      plan:             sub.plan,
      status:           sub.status,
      trialEndsAt:      sub.trial_ends_at,
      currentPeriodEnd: sub.current_period_end,
      trialDaysLeft,
    });
  } catch (err) {
    console.error('Error fetching billing status:', err);
    return res.status(500).json({ error: 'Failed to fetch billing status' });
  }
});

// ── POST /api/billing/checkout ────────────────────────────────────────────────

router.post('/checkout', authMiddleware, async (req: Request, res: Response) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Billing not configured' });

  const priceId = process.env.STRIPE_PRO_PRICE_ID;
  if (!priceId) return res.status(503).json({ error: 'Stripe price not configured' });

  try {
    // Fetch org for metadata
    const orgResult = await query(
      'SELECT name FROM organizations WHERE id = $1',
      [req.user!.organizationId]
    );
    const orgName = orgResult.rows[0]?.name ?? 'Unknown';

    // Check for existing Stripe customer
    const subResult = await query(
      'SELECT stripe_customer_id FROM subscriptions WHERE organization_id = $1',
      [req.user!.organizationId]
    );
    const existingCustomerId = subResult.rows[0]?.stripe_customer_id;

    let customerId = existingCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user!.email,
        name: orgName,
        metadata: { organizationId: req.user!.organizationId },
      });
      customerId = customer.id;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 14,
        metadata: { organizationId: req.user!.organizationId },
      },
      success_url: `${frontendUrl}/subscription?session_id={CHECKOUT_SESSION_ID}&success=true`,
      cancel_url:  `${frontendUrl}/subscription?canceled=true`,
      metadata: { organizationId: req.user!.organizationId },
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    return res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// ── POST /api/billing/portal ──────────────────────────────────────────────────

router.post('/portal', authMiddleware, async (req: Request, res: Response) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Billing not configured' });

  try {
    const { rows } = await query(
      'SELECT stripe_customer_id FROM subscriptions WHERE organization_id = $1',
      [req.user!.organizationId]
    );

    const customerId = rows[0]?.stripe_customer_id;
    if (!customerId) {
      return res.status(400).json({ error: 'No billing account found. Please upgrade first.' });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl}/subscription`,
    });

    return res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    return res.status(500).json({ error: 'Failed to create billing portal session' });
  }
});

// ── POST /api/billing/webhook ─────────────────────────────────────────────────
// NOTE: This route must receive the RAW body — see server.ts for raw middleware config.

router.post('/webhook', async (req: Request, res: Response) => {
  const stripe = getStripe();
  if (!stripe) return res.status(503).json({ error: 'Billing not configured' });

  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return res.status(503).json({ error: 'Webhook secret not configured' });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ error: `Webhook error: ${err.message}` });
  }

  try {
    await handleStripeEvent(event);
    return res.json({ received: true });
  } catch (err) {
    console.error('Error handling Stripe webhook event:', err);
    return res.status(500).json({ error: 'Webhook handler failed' });
  }
});

async function handleStripeEvent(event: Stripe.Event) {
  const sub = event.data.object as Stripe.Subscription;

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated': {
      const orgId = sub.metadata?.organizationId;
      if (!orgId) {
        console.warn('Stripe webhook: no organizationId in subscription metadata');
        return;
      }

      const plan   = sub.status === 'active' || sub.status === 'trialing' ? 'pro' : 'free';
      const status = sub.status; // 'active' | 'trialing' | 'past_due' | 'canceled' | 'unpaid'

      const trialEnd = sub.trial_end ? new Date(sub.trial_end * 1000) : null;
      const periodEnd = sub.current_period_end
        ? new Date(sub.current_period_end * 1000)
        : null;

      await query(
        `UPDATE subscriptions SET
           stripe_customer_id     = $1,
           stripe_subscription_id = $2,
           plan                   = $3,
           status                 = $4,
           trial_ends_at          = $5,
           current_period_end     = $6,
           updated_at             = CURRENT_TIMESTAMP
         WHERE organization_id = $7`,
        [
          sub.customer as string,
          sub.id,
          plan,
          status,
          trialEnd,
          periodEnd,
          orgId,
        ]
      );
      console.log(`[Billing] Org ${orgId} → plan=${plan}, status=${status}`);
      break;
    }

    case 'customer.subscription.deleted': {
      const orgId = sub.metadata?.organizationId;
      if (!orgId) return;

      await query(
        `UPDATE subscriptions SET
           plan       = 'free',
           status     = 'canceled',
           updated_at = CURRENT_TIMESTAMP
         WHERE organization_id = $1`,
        [orgId]
      );
      console.log(`[Billing] Org ${orgId} subscription canceled → downgraded to free`);
      break;
    }

    default:
      // Ignore unhandled events
      break;
  }
}

export default router;

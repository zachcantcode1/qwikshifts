import { Hono } from 'hono';
import db from '../db';
import { organizations } from '../schema';
import { eq } from 'drizzle-orm';
import type { User } from '@qwikshifts/core';

type Env = {
    Variables: {
        user: User;
    };
};

const app = new Hono<Env>();

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

// Price IDs (set these after creating products in Stripe Dashboard)
const PRICE_IDS = {
    starter: process.env.STRIPE_STARTER_PRICE_ID || 'price_starter_placeholder',
    pro: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_placeholder',
};

// Get current plan info
app.get('/plan', async (c) => {
    const user = c.get('user');

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, user.orgId),
    });

    if (!org) {
        return c.json({ error: 'Organization not found' }, 404);
    }

    return c.json({
        plan: org.plan || 'free',
        stripeCustomerId: org.stripeCustomerId,
        stripeSubscriptionId: org.stripeSubscriptionId,
    });
});

// Create Stripe Checkout session
app.post('/create-checkout', async (c) => {
    if (!STRIPE_SECRET_KEY) {
        return c.json({ error: 'Stripe not configured' }, 500);
    }

    const user = c.get('user');
    const { plan } = await c.req.json();

    if (!plan || !['starter', 'pro'].includes(plan)) {
        return c.json({ error: 'Invalid plan' }, 400);
    }

    const org = await db.query.organizations.findFirst({
        where: eq(organizations.id, user.orgId),
    });

    if (!org) {
        return c.json({ error: 'Organization not found' }, 404);
    }

    const priceId = PRICE_IDS[plan as keyof typeof PRICE_IDS];

    // Create Stripe Checkout Session using fetch (no SDK dependency)
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'mode': 'subscription',
            'payment_method_types[0]': 'card',
            'line_items[0][price]': priceId,
            'line_items[0][quantity]': '1',
            'success_url': `${process.env.APP_URL || 'http://localhost:5173'}/settings?billing=success`,
            'cancel_url': `${process.env.APP_URL || 'http://localhost:5173'}/settings?billing=cancelled`,
            'client_reference_id': user.orgId,
            ...(org.stripeCustomerId ? { 'customer': org.stripeCustomerId } : { 'customer_email': user.email }),
            'metadata[orgId]': user.orgId,
            'metadata[plan]': plan,
        }),
    });

    const session = await response.json() as { url?: string; error?: { message: string } };

    if (!response.ok) {
        console.error('Stripe error:', session);
        return c.json({ error: 'Failed to create checkout session' }, 500);
    }

    return c.json({ url: session.url });
});

// Stripe Webhook handler
app.post('/webhook', async (c) => {
    if (!STRIPE_SECRET_KEY) {
        return c.json({ error: 'Stripe not configured' }, 500);
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const rawBody = await c.req.text();

    // In production, verify webhook signature
    // For now, we'll parse and handle the event
    let event;
    try {
        event = JSON.parse(rawBody);
    } catch {
        return c.json({ error: 'Invalid JSON' }, 400);
    }

    console.log('Stripe webhook received:', event.type);

    switch (event.type) {
        case 'checkout.session.completed': {
            const session = event.data.object;
            const orgId = session.metadata?.orgId || session.client_reference_id;
            const plan = session.metadata?.plan;

            if (orgId && plan) {
                await db.update(organizations)
                    .set({
                        plan,
                        stripeCustomerId: session.customer,
                        stripeSubscriptionId: session.subscription,
                    })
                    .where(eq(organizations.id, orgId));
                console.log(`Upgraded org ${orgId} to ${plan}`);
            }
            break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
            const subscription = event.data.object;
            const customerId = subscription.customer;

            // Find org by customer ID
            const org = await db.query.organizations.findFirst({
                where: eq(organizations.stripeCustomerId, customerId),
            });

            if (org) {
                const isActive = subscription.status === 'active';
                const newPlan = isActive ? (org.plan || 'free') : 'free';

                // If canceled, downgrade to free
                if (subscription.status === 'canceled' || event.type === 'customer.subscription.deleted') {
                    await db.update(organizations)
                        .set({ plan: 'free', stripeSubscriptionId: null })
                        .where(eq(organizations.id, org.id));
                    console.log(`Downgraded org ${org.id} to free`);
                }
            }
            break;
        }
    }

    return c.json({ received: true });
});

export default app;

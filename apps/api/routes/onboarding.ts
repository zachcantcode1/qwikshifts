import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import db from '../db';
import { organizations, users, locations, employees } from '../schema';
import { eq } from 'drizzle-orm';

const app = new Hono();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

app.get('/status', async (c) => {
  try {
    const org = await db.query.organizations.findFirst();
    if (!org) {
      return c.json({ onboarded: false, step: 1 });
    }
    return c.json({ onboarded: (org.onboardingStep || 1) > 5, step: org.onboardingStep || 1 });
  } catch (error) {
    // If DB is not ready, assume fresh install
    console.error('Status check failed (DB might be empty):', error);
    return c.json({ onboarded: false, step: 1 });
  }
});

app.post('/progress', async (c) => {
  const { step } = await c.req.json();
  const org = await db.query.organizations.findFirst();
  if (org) {
    await db.update(organizations)
      .set({ onboardingStep: step })
      .where(eq(organizations.id, org.id));
  }
  return c.json({ success: true });
});

app.post('/setup', async (c) => {
  const { orgName, managerName, managerEmail } = await c.req.json();

  // Check if user already exists
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, managerEmail),
    });

    if (existingUser) {
      return c.json({ error: 'A user with this email already exists.' }, 400);
    }
  } catch (error: any) {
    console.error('Database check failed:', error);
    // If table doesn't exist or DB is down
    return c.json({ error: 'Service unavailable. Please try again later.', details: error.message }, 503);
  }

  const orgId = `org-${Date.now()}`;
  const userId = `user-${Date.now()}`;
  const locationId = `loc-${Date.now()}`;
  const employeeId = `emp-${Date.now()}`;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(organizations).values({
        id: orgId,
        name: orgName,
        onboardingStep: 2,
      });

      await tx.insert(users).values({
        id: userId,
        email: managerEmail,
        name: managerName,
        role: 'manager',
        orgId: orgId,
      });

      // NO default location or employee created here. 
      // Manager will be assigned to the first location they create in the next step.
    });

    // Generate token
    const payload = {
      sub: userId,
      name: managerName,
      role: 'manager',
      orgId: orgId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
    };

    const token = await sign(payload, JWT_SECRET);

    return c.json({
      success: true,
      token,
      user: {
        id: userId,
        name: managerName,
        email: managerEmail,
        role: 'manager',
        orgId
      }
    });
  } catch (error: any) {
    console.error(error);
    return c.json({ error: 'Failed to setup organization', details: error.message }, 500);
  }
});

export default app;

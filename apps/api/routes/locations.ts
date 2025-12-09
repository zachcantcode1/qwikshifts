import { Hono } from 'hono';
import db from '../db';
import { locations, employees, organizations } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

// Plan limits
const PLAN_LIMITS: Record<string, number> = {
  free: 1,
  starter: 5,
  pro: Infinity,
};

app.get('/', async (c) => {
  const user = c.get('user');
  const result = await db.query.locations.findMany({
    where: eq(locations.orgId, user.orgId),
  });

  return c.json(result);
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name } = body;

  // Check plan limits
  const org = await db.query.organizations.findFirst({
    where: eq(organizations.id, user.orgId),
  });

  if (!org) {
    return c.json({ error: 'Organization not found' }, 404);
  }

  const currentLocations = await db.query.locations.findMany({
    where: eq(locations.orgId, user.orgId),
  });

  const plan = org.plan || 'free';
  const limit = PLAN_LIMITS[plan] || 1;

  if (currentLocations.length >= limit) {
    return c.json({
      error: `Your ${plan} plan allows ${limit} location${limit > 1 ? 's' : ''}. Please upgrade to add more.`,
      code: 'PLAN_LIMIT_EXCEEDED',
      currentPlan: plan,
      limit,
    }, 403);
  }

  const [newLocation] = await db.insert(locations).values({
    id: `loc-${Date.now()}`,
    name,
    orgId: user.orgId,
  }).returning();

  // Check if current user (Manager) has an employee profile
  if (newLocation) {
    const existingEmployee = await db.query.employees.findFirst({
      where: eq(employees.userId, user.id),
    });

    // If not, create one linked to this location
    if (!existingEmployee) {
      await db.insert(employees).values({
        id: `emp-${Date.now()}`,
        userId: user.id,
        orgId: user.orgId,
        locationId: newLocation.id,
        weeklyHoursLimit: null,
        ruleId: null,
      });
    }
  }

  return c.json(newLocation);
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name } = body;

  const [updated] = await db.update(locations)
    .set({ name })
    .where(and(eq(locations.id, id), eq(locations.orgId, user.orgId)))
    .returning();

  if (!updated) {
    return c.json({ error: 'Location not found' }, 404);
  }

  return c.json(updated);
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const [deleted] = await db.delete(locations)
    .where(and(eq(locations.id, id), eq(locations.orgId, user.orgId)))
    .returning();

  if (!deleted) {
    return c.json({ error: 'Location not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;

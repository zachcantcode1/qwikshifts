import { Hono } from 'hono';
import db from '../db';
import { requirements, areas } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/', async (c) => {
  const user = c.get('user');
  const areaId = c.req.query('areaId');
  const locationId = c.req.query('locationId');

  const filters = [eq(requirements.orgId, user.orgId)];
  if (areaId) {
    filters.push(eq(requirements.areaId, areaId));
  } else if (locationId) {
    filters.push(eq(requirements.locationId, locationId));
  }

  const result = await db.query.requirements.findMany({
    where: and(...filters),
  });
  
  return c.json(result);
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { areaId, dayOfWeek, roleId, count } = body;

  const area = await db.query.areas.findFirst({
    where: eq(areas.id, areaId),
    columns: { locationId: true },
  });

  if (!area) {
    return c.json({ error: 'Area not found' }, 404);
  }

  const [newRequirement] = await db.insert(requirements).values({
    id: `req-${Date.now()}`,
    areaId,
    dayOfWeek,
    roleId,
    count: Number(count),
    orgId: user.orgId,
    locationId: area.locationId,
  }).returning();

  return c.json(newRequirement);
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { count } = body;

  const [updated] = await db.update(requirements)
    .set({ count })
    .where(and(eq(requirements.id, id), eq(requirements.orgId, user.orgId)))
    .returning();

  if (!updated) {
    return c.json({ error: 'Requirement not found' }, 404);
  }

  return c.json(updated);
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const [deleted] = await db.delete(requirements)
    .where(and(eq(requirements.id, id), eq(requirements.orgId, user.orgId)))
    .returning();
  
  if (!deleted) {
    return c.json({ error: 'Requirement not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;

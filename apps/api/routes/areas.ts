import { Hono } from 'hono';
import db from '../db';
import { areas } from '../schema';
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
  const locationId = c.req.query('locationId');
  
  const filters = [eq(areas.orgId, user.orgId)];
  if (locationId) {
    filters.push(eq(areas.locationId, locationId));
  }

  const result = await db.query.areas.findMany({
    where: and(...filters),
  });
  
  return c.json(result);
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name, color, locationId } = body;

  if (!locationId) {
    return c.json({ error: 'Location ID is required' }, 400);
  }

  const [newArea] = await db.insert(areas).values({
    id: `area-${Date.now()}`,
    name,
    color: color || '#3b82f6',
    orgId: user.orgId,
    locationId,
  }).returning();

  return c.json(newArea);
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, color } = body;

  const [updated] = await db.update(areas)
    .set({ name, color })
    .where(and(eq(areas.id, id), eq(areas.orgId, user.orgId)))
    .returning();

  if (!updated) {
    return c.json({ error: 'Area not found' }, 404);
  }

  return c.json(updated);
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const [deleted] = await db.delete(areas)
    .where(and(eq(areas.id, id), eq(areas.orgId, user.orgId)))
    .returning();
  
  if (!deleted) {
    return c.json({ error: 'Area not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;

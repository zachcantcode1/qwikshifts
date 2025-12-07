import { Hono } from 'hono';
import db from '../db';
import { locations } from '../schema';
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
  const result = await db.query.locations.findMany({
    where: eq(locations.orgId, user.orgId),
  });
  
  return c.json(result);
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name } = body;

  const [newLocation] = await db.insert(locations).values({
    id: `loc-${Date.now()}`,
    name,
    orgId: user.orgId,
  }).returning();
  
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

import { Hono } from 'hono';
import db from '../db';
import { roles } from '../schema';
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
  const result = await db.query.roles.findMany({
    where: eq(roles.orgId, user.orgId),
  });
  
  return c.json(result);
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name, color } = body;

  const [newRole] = await db.insert(roles).values({
    id: `role-${Date.now()}`,
    name,
    color: color || '#3b82f6',
    orgId: user.orgId,
  }).returning();

  return c.json(newRole);
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, color } = body;

  const [updated] = await db.update(roles)
    .set({ name, color })
    .where(and(eq(roles.id, id), eq(roles.orgId, user.orgId)))
    .returning();

  if (!updated) {
    return c.json({ error: 'Role not found' }, 404);
  }

  return c.json(updated);
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const [deleted] = await db.delete(roles)
    .where(and(eq(roles.id, id), eq(roles.orgId, user.orgId)))
    .returning();
  
  if (!deleted) {
    return c.json({ error: 'Role not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;

import { Hono } from 'hono';
import db from '../db';
import { rules } from '../schema';
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
  const result = await db.query.rules.findMany({
    where: eq(rules.orgId, user.orgId),
  });
  
  return c.json(result);
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name, value } = body;

  const [newRule] = await db.insert(rules).values({
    id: `rule-${Date.now()}`,
    name,
    type: 'MAX_HOURS',
    value: Number(value),
    orgId: user.orgId,
  }).returning();

  return c.json(newRule);
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, value } = body;

  const [updated] = await db.update(rules)
    .set({ name, value: Number(value) })
    .where(and(eq(rules.id, id), eq(rules.orgId, user.orgId)))
    .returning();
  
  if (!updated) {
    return c.json({ error: 'Rule not found' }, 404);
  }

  return c.json(updated);
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const [deleted] = await db.delete(rules)
    .where(and(eq(rules.id, id), eq(rules.orgId, user.orgId)))
    .returning();
    
  if (!deleted) {
    return c.json({ error: 'Rule not found' }, 404);
  }

  return c.json({ success: true });
});

export default app;

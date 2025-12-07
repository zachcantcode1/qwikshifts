import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import db from '../db';
import { users } from '../schema';
import { eq } from 'drizzle-orm';
import type { User } from '@qwikshifts/core';
import { authMiddleware } from '../middleware';

const app = new Hono<{ Variables: { user: User } }>();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

app.post('/login', async (c) => {
  const { email } = await c.req.json();

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 401);
  }

  const payload = {
    sub: user.id,
    name: user.name,
    role: user.role,
    orgId: user.orgId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
  };

  const token = await sign(payload, JWT_SECRET);

  return c.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      orgId: user.orgId,
    }
  });
});

app.get('/me', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json(user);
});

export default app;

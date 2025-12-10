import { createMiddleware } from 'hono/factory';
import { verify } from 'hono/jwt';
import db from './db';
import { users } from './schema';
import { eq } from 'drizzle-orm';
import type { User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';

export const authMiddleware = createMiddleware<Env>(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  try {
    const payload = await verify(token, JWT_SECRET);
    const userId = payload.sub as string;

    const dbUser = await db.query.users.findFirst({
      where: eq(users.id, userId),
    });

    if (!dbUser) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const user: User = {
      id: dbUser.id,
      email: dbUser.email,
      name: dbUser.name,
      role: dbUser.role as 'manager' | 'employee',
      orgId: dbUser.orgId || '',
      timeFormat: (dbUser.timeFormat as '12h' | '24h') || '12h',
    };

    c.set('user', user);
    await next();
  } catch (err) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
});

export const managerMiddleware = createMiddleware<Env>(async (c, next) => {
  const user = c.get('user');
  if (user.role !== 'manager') {
    return c.json({ error: 'Forbidden' }, 403);
  }
  await next();
});

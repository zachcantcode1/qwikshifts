import { Hono } from 'hono';
import { sign } from 'hono/jwt';
import db from '../db';
import { users, organizations } from '../schema';
import { eq } from 'drizzle-orm';
import type { User } from '@qwikshifts/core';
import { authMiddleware } from '../middleware';

const app = new Hono<{ Variables: { user: User } }>();

console.log('Auth Routes Loaded');

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-change-me';
const TEST_USER_EMAIL = process.env.TEST_USER_EMAIL || 'test@qwikshifts.com';

// In-memory OTP store (in production, use Redis or database)
const otpStore = new Map<string, { otp: string; expiresAt: number }>();

// Generate 6-digit OTP
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

app.get('/test', (c) => c.json({ message: 'Auth route working' }));

app.post('/login', async (c) => {
  console.log('Login request received');
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

  // Check email verification (bypass for test user)
  if (!user.emailVerified && email !== TEST_USER_EMAIL) {
    return c.json({ error: 'Please verify your email first', needsVerification: true }, 401);
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
      timeFormat: user.timeFormat,
    }
  });
});

app.post('/register', async (c) => {
  console.log('Register request received');
  const { email, name } = await c.req.json();

  if (!email || !name) {
    return c.json({ error: 'Email and Name are required' }, 400);
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (existingUser) {
    return c.json({ error: 'User already exists' }, 400);
  }

  // Create Organization
  const orgId = crypto.randomUUID();
  const orgName = `${email.split('@')[0]}'s Organization`;

  await db.insert(organizations).values({
    id: orgId,
    name: orgName,
    onboardingStep: 1,
    plan: 'free', // New users start on free plan
  });

  // Create User (not verified yet, unless test user)
  const userId = crypto.randomUUID();
  const isTestUser = email === TEST_USER_EMAIL;

  await db.insert(users).values({
    id: userId,
    email: email,
    name: name,
    role: 'manager',
    orgId: orgId,
    emailVerified: isTestUser, // Test user is auto-verified
  });

  // For test user, skip OTP and return token immediately
  if (isTestUser) {
    const payload = {
      sub: userId,
      name: name,
      role: 'manager',
      orgId: orgId,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
    };
    const token = await sign(payload, JWT_SECRET);
    return c.json({
      token,
      user: { id: userId, email, name, role: 'manager', orgId, timeFormat: '12h' },
    });
  }

  // Generate and store OTP
  const otp = generateOTP();
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000, // 10 minutes
  });

  // TODO: Send OTP via email (Supabase, Resend, etc.)
  console.log(`[DEV] OTP for ${email}: ${otp}`);

  return c.json({
    message: 'Verification code sent to your email',
    requiresVerification: true,
    // In development, include OTP for testing
    ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
  });
});

app.post('/verify-email', async (c) => {
  const { email, otp } = await c.req.json();

  if (!email || !otp) {
    return c.json({ error: 'Email and OTP are required' }, 400);
  }

  const stored = otpStore.get(email);

  if (!stored) {
    return c.json({ error: 'No verification pending for this email' }, 400);
  }

  if (Date.now() > stored.expiresAt) {
    otpStore.delete(email);
    return c.json({ error: 'Verification code expired' }, 400);
  }

  if (stored.otp !== otp) {
    return c.json({ error: 'Invalid verification code' }, 400);
  }

  // Mark user as verified
  await db.update(users).set({ emailVerified: true }).where(eq(users.email, email));
  otpStore.delete(email);

  // Get user and generate token
  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  const payload = {
    sub: user.id,
    name: user.name,
    role: user.role,
    orgId: user.orgId,
    exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7,
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
      timeFormat: user.timeFormat,
    }
  });
});

app.post('/resend-otp', async (c) => {
  const { email } = await c.req.json();

  if (!email) {
    return c.json({ error: 'Email is required' }, 400);
  }

  const user = await db.query.users.findFirst({
    where: eq(users.email, email),
  });

  if (!user) {
    return c.json({ error: 'User not found' }, 404);
  }

  if (user.emailVerified) {
    return c.json({ error: 'Email already verified' }, 400);
  }

  const otp = generateOTP();
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + 10 * 60 * 1000,
  });

  console.log(`[DEV] New OTP for ${email}: ${otp}`);

  return c.json({
    message: 'New verification code sent',
    ...(process.env.NODE_ENV !== 'production' && { devOtp: otp }),
  });
});

app.get('/me', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json(user);
});

app.put('/me', authMiddleware, async (c) => {
  const user = c.get('user');
  const body = await c.req.json();

  // Update allowed fields
  const updateData: any = {};
  if (body.timeFormat) updateData.timeFormat = body.timeFormat;
  if (body.name) updateData.name = body.name; // Allow name updates too while we're here

  if (Object.keys(updateData).length === 0) {
    return c.json(user);
  }

  await db.update(users).set(updateData).where(eq(users.id, user.id)).execute();

  // Return updated user
  const updatedUser = await db.query.users.findFirst({
    where: eq(users.id, user.id)
  });

  return c.json(updatedUser);
});

export default app;


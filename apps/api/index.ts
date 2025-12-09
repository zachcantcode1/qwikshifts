import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { authMiddleware } from './middleware'
import type { User } from '@qwikshifts/core'
import areas from './routes/areas'
import employees from './routes/employees'
import schedule from './routes/schedule'
import assignments from './routes/assignments'
import rules from './routes/rules'
import roles from './routes/roles'
import requirements from './routes/requirements'
import timeoff from './routes/timeoff'
import locations from './routes/locations'
import onboarding from './routes/onboarding'
import dashboard from './routes/dashboard'
import auth from './routes/auth'
import billing from './routes/billing'

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>()

app.use('/*', cors())

app.get('/health', (c) => {
  return c.json({ status: 'ok', message: 'API is running' })
})

app.get('/', (c) => {
  return c.json({
    message: 'Welcome to QwikShifts API',
    endpoints: {
      health: '/health',
      docs: 'This is an API-only service. Please visit the frontend application.'
    }
  })
})

// Public Routes
app.route('/api/onboarding', onboarding)
app.route('/api/auth', auth)

// Auth Middleware for other API routes
app.use('/api/*', async (c, next) => {
  // Skip auth for public routes
  if (
    c.req.path.startsWith('/api/onboarding') ||
    c.req.path.startsWith('/api/auth') ||
    c.req.path === '/api/billing/webhook'
  ) {
    await next();
    return;
  }
  return authMiddleware(c, next);
})

app.route('/api/areas', areas)
app.route('/api/employees', employees)
app.route('/api/schedule', schedule)
app.route('/api/assignment', assignments)
app.route('/api/rules', rules)
app.route('/api/dashboard', dashboard)
app.route('/api/roles', roles)
app.route('/api/requirements', requirements)
app.route('/api/timeoff', timeoff)
app.route('/api/locations', locations)
app.route('/api/billing', billing)

app.get('/api/auth/me', (c) => {
  const user = c.get('user')
  return c.json(user)
})

export default {
  port: 3000,
  fetch: app.fetch,
}

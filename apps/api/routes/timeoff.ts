import { Hono } from 'hono';
import db from '../db';
import { timeOffRequests, employees, users } from '../schema';
import { eq } from 'drizzle-orm';
import type { TimeOffRequest, User, TimeOffRequestWithEmployee } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

// Get all requests (Manager view)
app.get('/', async (c) => {
  const user = c.get('user');
  
  const requests = await db.select({
    request: timeOffRequests,
    employee: employees,
    user: users,
  })
    .from(timeOffRequests)
    .innerJoin(employees, eq(timeOffRequests.employeeId, employees.id))
    .innerJoin(users, eq(employees.userId, users.id))
    .where(eq(timeOffRequests.orgId, user.orgId));

  const requestsWithEmployee: TimeOffRequestWithEmployee[] = requests.map(row => ({
    id: row.request.id,
    employeeId: row.request.employeeId,
    date: row.request.date,
    isFullDay: row.request.isFullDay,
    startTime: row.request.startTime || undefined,
    endTime: row.request.endTime || undefined,
    reason: row.request.reason,
    status: row.request.status as 'pending' | 'approved' | 'rejected',
    orgId: row.request.orgId,
    employee: {
      id: row.employee.id,
      userId: row.employee.userId,
      orgId: row.employee.orgId,
      locationId: row.employee.locationId,
      weeklyHoursLimit: row.employee.weeklyHoursLimit || undefined,
      ruleId: row.employee.ruleId || undefined,
      roleIds: [], // We are not fetching roleIds in this query, and that matches the previous raw SQL which didn't join role table
      user: {
        name: row.user.name,
        email: row.user.email
      }
    }
  }));

  return c.json(requestsWithEmployee);
});

// Get my requests (Employee view)
app.get('/my', async (c) => {
  const user = c.get('user');
  
  const employee = await db.query.employees.findFirst({
    where: eq(employees.userId, user.id),
  });
  
  if (!employee) return c.json([]);

  const requests = await db.query.timeOffRequests.findMany({
    where: eq(timeOffRequests.employeeId, employee.id),
  });
  
  return c.json(requests);
});

// Create request
app.post('/', async (c) => {
  const user = c.get('user');
  
  const employee = await db.query.employees.findFirst({
    where: eq(employees.userId, user.id),
  });
  
  if (!employee) {
    return c.json({ error: 'Employee not found' }, 404);
  }

  const body = await c.req.json();
  const { date, isFullDay, startTime, endTime, reason } = body;

  const id = `req-${Date.now()}`;
  
  const [newRequest] = await db.insert(timeOffRequests).values({
    id,
    employeeId: employee.id,
    date,
    isFullDay: isFullDay,
    startTime: startTime,
    endTime: endTime,
    reason,
    status: 'pending',
    orgId: employee.orgId,
  }).returning();

  return c.json(newRequest);
});

// Update status (Manager action)
app.put('/:id/status', async (c) => {
  const id = c.req.param('id');
  const { status } = await c.req.json();

  const [updated] = await db.update(timeOffRequests)
    .set({ status })
    .where(eq(timeOffRequests.id, id))
    .returning();
  
  if (!updated) {
    return c.json({ error: 'Request not found' }, 404);
  }

  return c.json(updated);
});

export default app;

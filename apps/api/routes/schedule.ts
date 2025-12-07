import { Hono } from 'hono';
import db from '../db';
import { shifts, assignments, employees } from '../schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';
import type { ShiftWithAssignment, User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/week', async (c) => {
  const user = c.get('user');
  const from = c.req.query('from');
  const to = c.req.query('to');
  const locationId = c.req.query('locationId');

  const filters = [eq(shifts.orgId, user.orgId)];
  if (locationId) {
    filters.push(eq(shifts.locationId, locationId));
  }
  if (from && to) {
    filters.push(gte(shifts.date, from), lte(shifts.date, to));
  }

  const result = await db.query.shifts.findMany({
    where: and(...filters),
    with: {
      assignment: true,
    },
  });

  // Since we are returning ShiftWithAssignment which expects camelCase assignment
  // Drizzle's query builder returns relation results attached to the object
  // assignment is 'one' relation, so it will be an object or null.
  return c.json(result);
});

app.get('/my', async (c) => {
  const user = c.get('user');
  const from = c.req.query('from');
  const to = c.req.query('to');

  // Find all employee profiles for this user
  const userEmployees = await db.query.employees.findMany({
    where: eq(employees.userId, user.id),
  });

  if (userEmployees.length === 0) {
    return c.json([]);
  }

  const employeeIds = userEmployees.map(e => e.id);
  
  const filters = [inArray(assignments.employeeId, employeeIds)];
  if (from && to) {
    filters.push(gte(shifts.date, from), lte(shifts.date, to));
  }

  const result = await db.select({
      shift: shifts,
      assignment: assignments,
    })
    .from(shifts)
    .innerJoin(assignments, eq(shifts.id, assignments.shiftId))
    .where(and(...filters));

  const shiftsWithAssignments: ShiftWithAssignment[] = result.map((row) => ({
    ...row.shift,
    assignment: row.assignment,
  }));

  return c.json(shiftsWithAssignments);
});

app.post('/shift', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { areaId, date, startTime, endTime, employeeId, roleId, locationId } = body;

  const newShiftId = `shift-${Date.now()}`;
  const orgId = user.orgId;

  if (!locationId) {
    return c.json({ error: 'Location ID is required' }, 400);
  }

  await db.transaction(async (tx) => {
    await tx.insert(shifts).values({
      id: newShiftId,
      areaId,
      date,
      startTime,
      endTime,
      orgId,
      locationId,
    });

    if (employeeId) {
      const newAssignmentId = `assign-${Date.now()}`;
      await tx.insert(assignments).values({
        id: newAssignmentId,
        shiftId: newShiftId,
        employeeId,
        roleId: roleId || null,
      });
    }
  });

  return c.json({
    id: newShiftId,
    areaId,
    date,
    startTime,
    endTime,
    orgId,
    locationId,
  });
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { startTime, endTime } = body;

  const [updated] = await db.update(shifts)
    .set({ startTime, endTime })
    .where(and(eq(shifts.id, id), eq(shifts.orgId, user.orgId)))
    .returning();

  if (!updated) {
    return c.json({ error: 'Shift not found' }, 404);
  }

  return c.json(updated);
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');

  const [deleted] = await db.delete(shifts)
    .where(and(eq(shifts.id, id), eq(shifts.orgId, user.orgId)))
    .returning();

  if (!deleted) {
    return c.json({ error: 'Shift not found' }, 404);
  }

  // Assignments will be cascade deleted due to FK constraint

  return c.json({ success: true });
});

export default app;

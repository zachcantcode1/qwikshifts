import { Hono } from 'hono';
import db from '../db';
import { assignments, shifts } from '../schema';
import { eq, and } from 'drizzle-orm';
import type { ShiftAssignment, User } from '@qwikshifts/core';
import { z } from 'zod';
import { validator } from 'hono/validator';
import { managerMiddleware } from '../middleware';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.use('*', managerMiddleware);

const assignSchema = z.object({
  shiftId: z.string(),
  employeeId: z.string(),
  roleId: z.string().optional(),
});

app.post('/assign', validator('json', (value, c) => {
  const parsed = assignSchema.safeParse(value);
  if (!parsed.success) {
    return c.json(parsed.error, 400);
  }
  return parsed.data;
}), async (c) => {
  const user = c.get('user');
  const { shiftId, employeeId, roleId } = c.req.valid('json');

  // Check if shift exists and belongs to user's org
  const shift = await db.query.shifts.findFirst({
    where: and(eq(shifts.id, shiftId), eq(shifts.orgId, user.orgId)),
  });

  if (!shift) {
    return c.json({ error: 'Shift not found' }, 404);
  }

  // Check for existing assignment
  const existing = await db.query.assignments.findFirst({
    where: eq(assignments.shiftId, shiftId),
  });

  let assignment: ShiftAssignment;

  if (existing) {
    // Update existing assignment
    const [updated] = await db.update(assignments)
      .set({ employeeId, roleId: roleId || null })
      .where(eq(assignments.id, existing.id))
      .returning();
    
    assignment = {
      id: updated.id,
      shiftId: updated.shiftId,
      employeeId: updated.employeeId,
      roleId: updated.roleId || undefined,
    };
  } else {
    // Create new assignment
    const newId = `assign-${Date.now()}`;
    const [created] = await db.insert(assignments)
      .values({
        id: newId,
        shiftId,
        employeeId,
        roleId: roleId || null,
      })
      .returning();
      
    assignment = {
      id: created.id,
      shiftId: created.shiftId,
      employeeId: created.employeeId,
      roleId: created.roleId || undefined,
    };
  }

  return c.json(assignment);
});

app.post('/unassign', validator('json', (value, c) => {
  const schema = z.object({ shiftId: z.string() });
  const parsed = schema.safeParse(value);
  if (!parsed.success) return c.json(parsed.error, 400);
  return parsed.data;
}), async (c) => {
  const user = c.get('user');
  const { shiftId } = c.req.valid('json');

  // Verify shift belongs to user's org before deleting assignment
  const shift = await db.query.shifts.findFirst({
    where: and(eq(shifts.id, shiftId), eq(shifts.orgId, user.orgId)),
  });
  
  if (!shift) {
    return c.json({ error: 'Shift not found' }, 404);
  }

  await db.delete(assignments).where(eq(assignments.shiftId, shiftId));

  return c.json({ success: true });
});

export default app;

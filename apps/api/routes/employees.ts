import { Hono } from 'hono';
import db from '../db';
import { employees, users, rules, roles, employeeRoles } from '../schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { EmployeeWithRoles, User } from '@qwikshifts/core';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/', async (c) => {
  const user = c.get('user');
  const locationId = c.req.query('locationId');
  
  const filters = [eq(employees.orgId, user.orgId)];
  if (locationId) {
    filters.push(eq(employees.locationId, locationId));
  }

  const result = await db.select({
    employee: employees,
    user: users,
    ruleValue: rules.value,
  })
    .from(employees)
    .innerJoin(users, eq(employees.userId, users.id))
    .leftJoin(rules, eq(employees.ruleId, rules.id))
    .where(and(...filters));

  const response = [];

  for (const row of result) {
    const empRoles = await db.select({
        id: roles.id,
        name: roles.name,
        color: roles.color,
        orgId: roles.orgId,
      })
      .from(employeeRoles)
      .innerJoin(roles, eq(employeeRoles.roleId, roles.id))
      .where(eq(employeeRoles.employeeId, row.employee.id));

    response.push({
      id: row.employee.id,
      userId: row.employee.userId,
      orgId: row.employee.orgId,
      locationId: row.employee.locationId,
      weeklyHoursLimit: row.employee.weeklyHoursLimit || row.ruleValue,
      ruleId: row.employee.ruleId,
      user: { name: row.user.name, email: row.user.email },
      roles: empRoles,
      roleIds: empRoles.map(r => r.id)
    });
  }

  return c.json(response);
});

app.post('/', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  const { name, email, roleIds, ruleId, locationId } = body;

  if (!locationId) {
    return c.json({ error: 'Location ID is required' }, 400);
  }

  const newUserId = `user-${Date.now()}`;
  const newEmployeeId = `emp-${Date.now()}`;

  try {
    await db.transaction(async (tx) => {
      await tx.insert(users).values({
        id: newUserId,
        email,
        name,
        role: 'employee',
        orgId: user.orgId,
      });

      await tx.insert(employees).values({
        id: newEmployeeId,
        userId: newUserId,
        orgId: user.orgId,
        locationId,
        weeklyHoursLimit: null,
        ruleId: ruleId || null,
      });

      if (roleIds && roleIds.length > 0) {
        await tx.insert(employeeRoles).values(
          roleIds.map((roleId: string) => ({
            employeeId: newEmployeeId,
            roleId,
          }))
        );
      }
    });
  } catch (error: any) {
    console.error('Error creating employee:', error);
    return c.json({ error: 'Failed to create employee', details: error.message }, 500);
  }

  let assignedRoles: any[] = [];
  if (roleIds && roleIds.length > 0) {
    assignedRoles = await db.select().from(roles).where(inArray(roles.id, roleIds));
  }

  return c.json({
    id: newEmployeeId,
    userId: newUserId,
    orgId: user.orgId,
    locationId,
    roleIds: roleIds || [],
    ruleId,
    user: { name, email },
    roles: assignedRoles.map((r: any) => ({ id: r.id, name: r.name, color: r.color, orgId: r.orgId }))
  });
});

app.put('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  const body = await c.req.json();
  const { name, email, roleIds, ruleId } = body;

  const emp = await db.query.employees.findFirst({
    where: and(eq(employees.id, id), eq(employees.orgId, user.orgId)),
  });

  if (!emp) {
    return c.json({ error: 'Employee not found' }, 404);
  }

  await db.transaction(async (tx) => {
    await tx.update(users)
      .set({ name, email })
      .where(eq(users.id, emp.userId));
      
    await tx.update(employees)
      .set({ ruleId: ruleId || null })
      .where(eq(employees.id, id));

    await tx.delete(employeeRoles).where(eq(employeeRoles.employeeId, id));
    
    if (roleIds && roleIds.length > 0) {
      await tx.insert(employeeRoles).values(
        roleIds.map((roleId: string) => ({
          employeeId: id,
          roleId,
        }))
      );
    }
  });

  return c.json({ success: true });
});

app.delete('/:id', async (c) => {
  const user = c.get('user');
  const id = c.req.param('id');
  
  const emp = await db.query.employees.findFirst({
    where: and(eq(employees.id, id), eq(employees.orgId, user.orgId)),
  });

  if (!emp) {
    return c.json({ error: 'Employee not found' }, 404);
  }

  await db.transaction(async (tx) => {
    // Due to foreign key constraints, we might need to be careful with order, 
    // but CASCADE delete should handle employee_roles and others.
    // However, users table is separate.
    
    // First delete employee (cascades to assignments, time_off, etc.)
    await tx.delete(employees).where(eq(employees.id, id));
    
    // Then delete user
    await tx.delete(users).where(eq(users.id, emp.userId));
  });

  return c.json({ success: true });
});

export default app;

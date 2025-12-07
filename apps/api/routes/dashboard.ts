import { Hono } from 'hono';
import db from '../db';
import { timeOffRequests, employees, users, rules, shifts, assignments, requirements } from '../schema';
import { eq, and, count, gte, lte } from 'drizzle-orm';
import type { User } from '@qwikshifts/core';
import { startOfWeek, endOfWeek, parseISO, differenceInHours, format, addDays } from 'date-fns';

type Env = {
  Variables: {
    user: User;
  };
};

const app = new Hono<Env>();

app.get('/stats', async (c) => {
  const user = c.get('user');

  // 1. Pending Time Off Requests
  const [pendingRequests] = await db.select({ count: count() })
    .from(timeOffRequests)
    .where(and(
      eq(timeOffRequests.status, 'pending'),
      eq(timeOffRequests.orgId, user.orgId)
    ));
  
  const pendingTimeOffCount = pendingRequests?.count || 0;

  // 2. Overtime Risk
  // Calculate hours for current week for each employee
  const now = new Date();
  const weekStart = startOfWeek(now, { weekStartsOn: 1 }); // Monday start
  const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
  const weekStartStr = format(weekStart, 'yyyy-MM-dd');
  const weekEndStr = format(weekEnd, 'yyyy-MM-dd');

  // Get all employees with their hour limits
  const allEmployees = await db.select({
    id: employees.id,
    weeklyHoursLimit: employees.weeklyHoursLimit,
    ruleValue: rules.value,
    userName: users.name,
  })
    .from(employees)
    .innerJoin(users, eq(employees.userId, users.id))
    .leftJoin(rules, eq(employees.ruleId, rules.id))
    .where(eq(employees.orgId, user.orgId));

  const overtimeRisks = [];

  // Get all shifts assigned in the current week
  const weekShifts = await db.select({
      date: shifts.date,
      startTime: shifts.startTime,
      endTime: shifts.endTime,
      areaId: shifts.areaId,
      employeeId: assignments.employeeId,
      roleId: assignments.roleId,
    })
    .from(shifts)
    .innerJoin(assignments, eq(shifts.id, assignments.shiftId))
    .where(and(
      eq(shifts.orgId, user.orgId),
      gte(shifts.date, weekStartStr),
      lte(shifts.date, weekEndStr)
    ));

  for (const employee of allEmployees) {
    const employeeAssignments = weekShifts.filter(s => s.employeeId === employee.id);

    let totalHours = 0;

    employeeAssignments.forEach((shift) => {
      try {
        const start = parseISO(`${shift.date}T${shift.startTime}`);
        const end = parseISO(`${shift.date}T${shift.endTime}`);
        const hours = differenceInHours(end, start);
        totalHours += hours;
      } catch (e) {
        // Skip if date parsing fails
      }
    });

    const limit = employee.weeklyHoursLimit || employee.ruleValue || 40;
    const threshold = limit * 0.9; // 90% of limit

    if (totalHours >= threshold) {
      overtimeRisks.push({
        employeeId: employee.id,
        name: employee.userName || 'Unknown',
        currentHours: totalHours,
        limit: limit
      });
    }
  }

  // 3. Today's Shifts Stats
  const todayStr = format(now, 'yyyy-MM-dd');

  const todaysShifts = await db.select()
    .from(shifts)
    .where(and(
      eq(shifts.orgId, user.orgId),
      eq(shifts.date, todayStr)
    ));
    
  const totalShiftsToday = todaysShifts.length;

  let unassignedShiftsToday = 0;
  
  if (totalShiftsToday > 0) {
    const todaysShiftsWithAssignments = await db.select({
      id: shifts.id,
      assignmentId: assignments.id,
    })
    .from(shifts)
    .leftJoin(assignments, eq(shifts.id, assignments.shiftId))
    .where(and(
      eq(shifts.orgId, user.orgId),
      eq(shifts.date, todayStr)
    ));

    unassignedShiftsToday = todaysShiftsWithAssignments.filter(s => !s.assignmentId).length;
  }

  // 4. Weekly Requirements Coverage
  const allRequirements = await db.query.requirements.findMany({
    where: eq(requirements.orgId, user.orgId),
  });

  const weeklyRequirements = [];
  
  for (let i = 0; i < 7; i++) {
    const currentDay = addDays(weekStart, i);
    const dateStr = format(currentDay, 'yyyy-MM-dd');
    const dayName = format(currentDay, 'eeee').toLowerCase(); // 'monday', 'tuesday', etc.

    const dayRequirements = allRequirements.filter(r => r.dayOfWeek === dayName);
    
    let totalRequired = 0;
    let missing = 0;

    for (const req of dayRequirements) {
      totalRequired += req.count;
      
      // Count shifts matching area and role on this day
      // Note: assignment roleId is optional, but requirements are for a specific role.
      // We check if the assignment has the specific role.
      const coveredCount = weekShifts.filter(s => 
        s.date === dateStr && 
        s.areaId === req.areaId && 
        s.roleId === req.roleId
      ).length;

      if (coveredCount < req.count) {
        missing += (req.count - coveredCount);
      }
    }

    weeklyRequirements.push({
      date: dateStr,
      dayName: format(currentDay, 'EEE'), // 'Mon', 'Tue' for display
      status: missing === 0 ? 'ok' : 'warning',
      missing,
      totalRequired,
    });
  }

  return c.json({
    pendingTimeOffCount,
    overtimeRisks,
    todaysStats: {
      totalShifts: totalShiftsToday,
      unassignedShifts: unassignedShiftsToday
    },
    weeklyRequirements,
  });
});

export default app;

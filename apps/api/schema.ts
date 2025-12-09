import { pgTable, text, integer, boolean, primaryKey } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const organizations = pgTable('organizations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  onboardingStep: integer('onboarding_step').default(1),
  plan: text('plan').default('free'), // 'free' | 'starter' | 'pro'
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
});

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  locations: many(locations),
}));

export const users = pgTable('users', {
  id: text('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  role: text('role').notNull(), // 'manager' | 'employee'
  orgId: text('org_id').references(() => organizations.id),
  emailVerified: boolean('email_verified').default(false),
});

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.orgId],
    references: [organizations.id],
  }),
}));

export const locations = pgTable('locations', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  orgId: text('org_id').notNull().references(() => organizations.id),
});

export const locationsRelations = relations(locations, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [locations.orgId],
    references: [organizations.id],
  }),
  areas: many(areas),
}));

export const areas = pgTable('areas', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  locationId: text('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
});

export const areasRelations = relations(areas, ({ one }) => ({
  location: one(locations, {
    fields: [areas.locationId],
    references: [locations.id],
  }),
}));

export const roles = pgTable('roles', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  color: text('color').notNull(),
  orgId: text('org_id').notNull().references(() => organizations.id),
});

export const rules = pgTable('rules', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(),
  value: integer('value').notNull(),
  orgId: text('org_id').notNull().references(() => organizations.id),
});

export const employees = pgTable('employees', {
  id: text('id').primaryKey(),
  userId: text('user_id').notNull().references(() => users.id),
  orgId: text('org_id').notNull().references(() => organizations.id),
  locationId: text('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
  weeklyHoursLimit: integer('weekly_hours_limit'),
  ruleId: text('rule_id'),
});

export const employeesRelations = relations(employees, ({ one, many }) => ({
  user: one(users, {
    fields: [employees.userId],
    references: [users.id],
  }),
  location: one(locations, {
    fields: [employees.locationId],
    references: [locations.id],
  }),
  employeeRoles: many(employeeRoles),
}));

export const employeeRoles = pgTable('employee_roles', {
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
}, (t) => ({
  pk: primaryKey({ columns: [t.employeeId, t.roleId] }),
}));

export const employeeRolesRelations = relations(employeeRoles, ({ one }) => ({
  employee: one(employees, {
    fields: [employeeRoles.employeeId],
    references: [employees.id],
  }),
  role: one(roles, {
    fields: [employeeRoles.roleId],
    references: [roles.id],
  }),
}));

export const shifts = pgTable('shifts', {
  id: text('id').primaryKey(),
  areaId: text('area_id').notNull().references(() => areas.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  startTime: text('start_time').notNull(),
  endTime: text('end_time').notNull(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  locationId: text('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
});

export const shiftsRelations = relations(shifts, ({ one, many }) => ({
  area: one(areas, {
    fields: [shifts.areaId],
    references: [areas.id],
  }),
  assignment: one(assignments), // Shift has one assignment (in this model?)
}));

export const assignments = pgTable('assignments', {
  id: text('id').primaryKey(),
  shiftId: text('shift_id').notNull().references(() => shifts.id, { onDelete: 'cascade' }),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  roleId: text('role_id').references(() => roles.id),
});

export const assignmentsRelations = relations(assignments, ({ one }) => ({
  shift: one(shifts, {
    fields: [assignments.shiftId],
    references: [shifts.id],
  }),
  employee: one(employees, {
    fields: [assignments.employeeId],
    references: [employees.id],
  }),
  role: one(roles, {
    fields: [assignments.roleId],
    references: [roles.id],
  }),
}));

export const requirements = pgTable('requirements', {
  id: text('id').primaryKey(),
  areaId: text('area_id').notNull().references(() => areas.id, { onDelete: 'cascade' }),
  dayOfWeek: text('day_of_week').notNull(),
  roleId: text('role_id').notNull().references(() => roles.id, { onDelete: 'cascade' }),
  count: integer('count').notNull(),
  orgId: text('org_id').notNull().references(() => organizations.id),
  locationId: text('location_id').notNull().references(() => locations.id, { onDelete: 'cascade' }),
});

export const timeOffRequests = pgTable('time_off_requests', {
  id: text('id').primaryKey(),
  employeeId: text('employee_id').notNull().references(() => employees.id, { onDelete: 'cascade' }),
  date: text('date').notNull(),
  isFullDay: boolean('is_full_day').notNull(),
  startTime: text('start_time'),
  endTime: text('end_time'),
  reason: text('reason').notNull(),
  status: text('status').notNull(),
  orgId: text('org_id').notNull().references(() => organizations.id),
});

export const timeOffRequestsRelations = relations(timeOffRequests, ({ one }) => ({
  employee: one(employees, {
    fields: [timeOffRequests.employeeId],
    references: [employees.id],
  }),
}));

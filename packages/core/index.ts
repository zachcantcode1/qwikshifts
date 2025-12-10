import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string(),
  role: z.enum(['manager', 'employee']),
  orgId: z.string(),
  timeFormat: z.enum(['12h', '24h']).default('12h'),
});
export type User = z.infer<typeof UserSchema>;

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
});
export type Organization = z.infer<typeof OrganizationSchema>;

export const LocationSchema = z.object({
  id: z.string(),
  name: z.string(),
  orgId: z.string(),
});
export type Location = z.infer<typeof LocationSchema>;

export const AreaSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  orgId: z.string(),
  locationId: z.string(),
});
export type Area = z.infer<typeof AreaSchema>;

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.string(),
  orgId: z.string(),
});
export type Role = z.infer<typeof RoleSchema>;

export const EmployeeProfileSchema = z.object({
  id: z.string(),
  userId: z.string(),
  orgId: z.string(),
  locationId: z.string(),
  roleIds: z.array(z.string()),
  weeklyHoursLimit: z.number().optional(),
  hourlyRate: z.number().optional(),
  ruleId: z.string().optional(),
});
export type EmployeeProfile = z.infer<typeof EmployeeProfileSchema>;

export const ShiftSchema = z.object({
  id: z.string(),
  areaId: z.string(),
  date: z.string(), // YYYY-MM-DD
  startTime: z.string(), // HH:mm
  endTime: z.string(), // HH:mm
  orgId: z.string(),
  locationId: z.string(),
});
export type Shift = z.infer<typeof ShiftSchema>;

export const ShiftAssignmentSchema = z.object({
  id: z.string(),
  shiftId: z.string(),
  employeeId: z.string(),
  roleId: z.string().optional(),
});
export type ShiftAssignment = z.infer<typeof ShiftAssignmentSchema>;

// Composite types for API responses
export const EmployeeWithRolesSchema = EmployeeProfileSchema.extend({
  user: UserSchema.pick({ name: true, email: true }),
  roles: z.array(RoleSchema),
});
export type EmployeeWithRoles = z.infer<typeof EmployeeWithRolesSchema>;

export const ShiftWithAssignmentSchema = ShiftSchema.extend({
  assignment: ShiftAssignmentSchema.nullable().optional(),
});
export type ShiftWithAssignment = z.infer<typeof ShiftWithAssignmentSchema>;

export const RuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  type: z.enum(['MAX_HOURS']),
  value: z.number(),
  orgId: z.string(),
});
export type Rule = z.infer<typeof RuleSchema>;

export const StaffingRequirementSchema = z.object({
  id: z.string(),
  areaId: z.string(),
  dayOfWeek: z.enum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']),
  roleId: z.string(),
  count: z.number(),
  orgId: z.string(),
  locationId: z.string(),
});
export type StaffingRequirement = z.infer<typeof StaffingRequirementSchema>;

export const TimeOffRequestSchema = z.object({
  id: z.string(),
  employeeId: z.string(),
  date: z.string(), // YYYY-MM-DD
  isFullDay: z.boolean(),
  startTime: z.string().optional(), // HH:mm
  endTime: z.string().optional(), // HH:mm
  reason: z.string(),
  status: z.enum(['pending', 'approved', 'rejected']),
  orgId: z.string(),
});
export type TimeOffRequest = z.infer<typeof TimeOffRequestSchema>;

// Composite type for API
export const TimeOffRequestWithEmployeeSchema = TimeOffRequestSchema.extend({
  employee: EmployeeProfileSchema.extend({
    user: UserSchema.pick({ name: true, email: true }),
  }),
});
export type TimeOffRequestWithEmployee = z.infer<typeof TimeOffRequestWithEmployeeSchema>;


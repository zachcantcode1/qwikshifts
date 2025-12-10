import { Hono } from 'hono';
import db from '../db';
import { shifts, employees, users, employeeRoles, roles, locations } from '../schema';
import { eq, and, gte, lte, inArray } from 'drizzle-orm';

// Helper to calculate duration in hours from HH:mm
const calculateDuration = (start: string, end: string) => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    if (startH === undefined || startM === undefined || endH === undefined || endM === undefined) return 0;
    if (isNaN(startH) || isNaN(startM) || isNaN(endH) || isNaN(endM)) return 0;
    return (endH + endM / 60) - (startH + startM / 60);
};

const payroll = new Hono();

// GET /payroll?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD&locationId=...
payroll.get('/', async (c) => {
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const locationId = c.req.query('locationId');

    if (!startDate || !endDate || !locationId) {
        return c.json({ error: 'Missing required query parameters' }, 400);
    }

    // 1. Fetch employees in this location
    const locEmployees = await db.select({
        id: employees.id,
        userId: employees.userId,
        hourlyRate: employees.hourlyRate,
        name: users.name,
        role: users.role,
    })
        .from(employees)
        .innerJoin(users, eq(employees.userId, users.id))
        .where(eq(employees.locationId, locationId));

    interface EmployeePayroll {
        id: string;
        userId: string;
        hourlyRate: number | null;
        name: string;
        role: string;
        totalHours: number;
        estimatedPay: number;
    }

    const employeeMap = new Map<string, EmployeePayroll>();
    locEmployees.forEach(e => {
        employeeMap.set(e.id, { ...e, totalHours: 0, estimatedPay: 0 });
    });

    const employeeIds = locEmployees.map(e => e.id);

    if (employeeIds.length === 0) {
        return c.json({ data: [] });
    }

    // 2. Fetch shifts for these employees within range
    const shiftList = await db.query.shifts.findMany({
        where: (shifts, { and, eq, gte, lte }) => and(
            eq(shifts.locationId, locationId),
            gte(shifts.date, startDate),
            lte(shifts.date, endDate)
        ),
        with: {
            assignment: true
        }
    });

    // 3. Calculate totals
    for (const shift of shiftList) {
        if (shift.assignment && shift.assignment.employeeId) {
            const emp = employeeMap.get(shift.assignment.employeeId);
            if (emp) {
                const duration = calculateDuration(shift.startTime, shift.endTime);
                emp.totalHours += duration;
                if (emp.hourlyRate) {
                    emp.estimatedPay += duration * (emp.hourlyRate);
                }
            }
        }
    }

    // 4. Return result
    return c.json({
        data: Array.from(employeeMap.values()).map(e => ({
            id: e.id,
            name: e.name,
            role: e.role,
            hourlyRate: e.hourlyRate || 0,
            totalHours: parseFloat(e.totalHours.toFixed(2)),
            estimatedPay: parseFloat(e.estimatedPay.toFixed(2)),
        }))
    });
});

export default payroll;

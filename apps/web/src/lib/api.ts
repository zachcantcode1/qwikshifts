import type { ShiftWithAssignment, EmployeeWithRoles, Area, User, Role, StaffingRequirement, TimeOffRequest, TimeOffRequestWithEmployee, Location } from '@qwikshifts/core';

export type DashboardStats = {
  pendingTimeOffCount: number;
  overtimeRisks: {
    employeeId: string;
    name: string;
    currentHours: number;
    limit: number;
  }[];
  todaysStats: {
    totalShifts: number;
    unassignedShifts: number;
  };
  weeklyRequirements: {
    date: string;
    dayName: string;
    status: 'ok' | 'warning';
    missing: number;
    totalRequired: number;
  }[];
};

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const getHeaders = () => {
  const token = localStorage.getItem('qwikshifts-token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
  };
};

export const api = {
  login: async (email: string): Promise<{ token: string; user: User }> => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      throw new Error('Login failed');
    }
    const data = await res.json();
    localStorage.setItem('qwikshifts-token', data.token);
    return data;
  },

  register: async (email: string, name: string): Promise<{ token?: string; user?: User; requiresVerification?: boolean; devOtp?: string }> => {
    const res = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(errorData.error || 'Registration failed');
    }
    const data = await res.json();
    if (data.token) {
      localStorage.setItem('qwikshifts-token', data.token);
    }
    return data;
  },

  verifyEmail: async (email: string, otp: string): Promise<{ token: string; user: User }> => {
    const res = await fetch(`${API_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Verification failed' }));
      throw new Error(errorData.error || 'Verification failed');
    }
    const data = await res.json();
    localStorage.setItem('qwikshifts-token', data.token);
    return data;
  },

  resendOtp: async (email: string): Promise<{ message: string; devOtp?: string }> => {
    const res = await fetch(`${API_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) {
      const errorData = await res.json().catch(() => ({ error: 'Failed to resend code' }));
      throw new Error(errorData.error || 'Failed to resend code');
    }
    return res.json();
  },

  logout: () => {
    localStorage.removeItem('qwikshifts-token');
    window.location.reload();
  },

  getDashboardStats: async (): Promise<DashboardStats> => {
    // Pass local date to handle timezone differences with server
    const localDate = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
    const res = await fetch(`${API_URL}/dashboard/stats?date=${localDate}`, { headers: getHeaders() });
    return res.json();
  },

  getMe: async (): Promise<User> => {
    const res = await fetch(`${API_URL}/auth/me`, { headers: getHeaders() });
    if (!res.ok) {
      throw new Error('Unauthorized');
    }
    return res.json();
  },

  getLocations: async (): Promise<Location[]> => {
    const res = await fetch(`${API_URL}/locations`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch locations');
    return res.json();
  },

  createLocation: async (data: { name: string }) => {
    const res = await fetch(`${API_URL}/locations`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateLocation: async (id: string, data: { name: string }) => {
    const res = await fetch(`${API_URL}/locations/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteLocation: async (id: string) => {
    const res = await fetch(`${API_URL}/locations/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  checkOnboardingStatus: async (): Promise<{ onboarded: boolean; step: number }> => {
    const res = await fetch(`${API_URL}/onboarding/status`);
    return res.json();
  },

  updateOnboardingStep: async (step: number) => {
    const res = await fetch(`${API_URL}/onboarding/progress`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ step }),
    });
    return res.json();
  },

  setupOrganization: async (data: { orgName: string; managerName: string; managerEmail: string }) => {
    const res = await fetch(`${API_URL}/onboarding/setup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getAreas: async (locationId?: string): Promise<Area[]> => {
    const url = locationId ? `${API_URL}/areas?locationId=${locationId}` : `${API_URL}/areas`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch areas');
    return res.json();
  },

  createArea: async (data: { name: string; color: string; locationId?: string }) => {
    const res = await fetch(`${API_URL}/areas`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateArea: async (id: string, data: { name: string; color: string }) => {
    const res = await fetch(`${API_URL}/areas/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteArea: async (id: string) => {
    const res = await fetch(`${API_URL}/areas/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  getEmployees: async (locationId?: string): Promise<EmployeeWithRoles[]> => {
    const url = locationId ? `${API_URL}/employees?locationId=${locationId}` : `${API_URL}/employees`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch employees');
    return res.json();
  },

  getRoles: async (): Promise<Role[]> => {
    const res = await fetch(`${API_URL}/roles`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch roles');
    return res.json();
  },

  createRole: async (data: { name: string; color: string }) => {
    const res = await fetch(`${API_URL}/roles`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateRole: async (id: string, data: { name: string; color: string }) => {
    const res = await fetch(`${API_URL}/roles/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteRole: async (id: string) => {
    const res = await fetch(`${API_URL}/roles/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  createEmployee: async (data: { name: string; email: string; roleIds: string[]; ruleId?: string; locationId?: string }): Promise<EmployeeWithRoles> => {
    const res = await fetch(`${API_URL}/employees`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateEmployee: async (id: string, data: { name: string; email: string; roleIds: string[]; ruleId?: string }): Promise<EmployeeWithRoles> => {
    const res = await fetch(`${API_URL}/employees/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  getSchedule: async (from: string, to: string, locationId?: string): Promise<ShiftWithAssignment[]> => {
    const params = new URLSearchParams({ from, to });
    if (locationId) {
      params.append('locationId', locationId);
    }
    const res = await fetch(`${API_URL}/schedule/week?${params}`, { headers: getHeaders() });
    return res.json();
  },

  getMySchedule: async (from: string, to: string): Promise<ShiftWithAssignment[]> => {
    const params = new URLSearchParams({ from, to });
    const res = await fetch(`${API_URL}/schedule/my?${params}`, { headers: getHeaders() });
    return res.json();
  },

  assignEmployee: async (shiftId: string, employeeId: string, roleId?: string) => {
    const res = await fetch(`${API_URL}/assignment/assign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ shiftId, employeeId, roleId }),
    });
    return res.json();
  },

  createShift: async (data: { areaId: string; date: string; startTime: string; endTime: string; employeeId?: string; roleId?: string; locationId?: string }) => {
    const res = await fetch(`${API_URL}/schedule/shift`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateShift: async (id: string, data: { startTime: string; endTime: string }) => {
    const res = await fetch(`${API_URL}/schedule/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteShift: async (id: string) => {
    const res = await fetch(`${API_URL}/schedule/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  unassignEmployee: async (shiftId: string) => {
    const res = await fetch(`${API_URL}/assignment/unassign`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ shiftId }),
    });
    return res.json();
  },

  getRules: async () => {
    const res = await fetch(`${API_URL}/rules`, { headers: getHeaders() });
    return res.json();
  },

  createRule: async (data: { name: string; value: number }) => {
    const res = await fetch(`${API_URL}/rules`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateRule: async (id: string, data: { name: string; value: number }) => {
    const res = await fetch(`${API_URL}/rules/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteRule: async (id: string) => {
    const res = await fetch(`${API_URL}/rules/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  getRequirements: async (areaId?: string, locationId?: string): Promise<StaffingRequirement[]> => {
    const params = new URLSearchParams();
    if (areaId) params.append('areaId', areaId);
    if (locationId) params.append('locationId', locationId);

    const res = await fetch(`${API_URL}/requirements?${params}`, { headers: getHeaders() });
    return res.json();
  },

  createRequirement: async (data: { areaId: string; dayOfWeek: string; roleId: string; count: number }) => {
    const res = await fetch(`${API_URL}/requirements`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateRequirement: async (id: string, data: { count: number }) => {
    const res = await fetch(`${API_URL}/requirements/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  deleteRequirement: async (id: string) => {
    const res = await fetch(`${API_URL}/requirements/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
    return res.json();
  },

  getTimeOffRequests: async (): Promise<TimeOffRequestWithEmployee[]> => {
    const res = await fetch(`${API_URL}/timeoff`, { headers: getHeaders() });
    return res.json();
  },

  getMyTimeOffRequests: async (): Promise<TimeOffRequest[]> => {
    const res = await fetch(`${API_URL}/timeoff/my`, { headers: getHeaders() });
    return res.json();
  },

  createTimeOffRequest: async (data: { date: string; isFullDay: boolean; startTime?: string; endTime?: string; reason: string }) => {
    const res = await fetch(`${API_URL}/timeoff`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data),
    });
    return res.json();
  },

  updateTimeOffStatus: async (id: string, status: 'approved' | 'rejected') => {
    const res = await fetch(`${API_URL}/timeoff/${id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
    return res.json();
  },
};

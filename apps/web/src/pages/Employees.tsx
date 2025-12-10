import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { EmployeeWithRoles, Role, Rule, Location } from '@qwikshifts/core';
import { Plus, User as UserIcon, Mail, Shield, Clock, Edit2, MapPin } from 'lucide-react';

export function Employees() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [employees, setEmployees] = useState<EmployeeWithRoles[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [rules, setRules] = useState<Rule[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', roleIds: [] as string[], ruleId: '', hourlyRate: '' });

  useEffect(() => {
    api.getLocations().then((locs) => {
      setLocations(locs);
      if (locs.length > 0) {
        setSelectedLocationId(locs[0].id);
      }
    });
  }, []);

  useEffect(() => {
    if (selectedLocationId) {
      loadData();
    }
  }, [selectedLocationId]);

  const loadData = async () => {
    const [emps, rls, ruls] = await Promise.all([
      api.getEmployees(selectedLocationId),
      api.getRoles(),
      api.getRules()
    ]);
    setEmployees(emps);
    setRoles(rls);
    setRules(ruls);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) return;

    const payload = {
      ...formData,
      hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined
    };

    if (editingId) {
      await api.updateEmployee(editingId, payload);
    } else {
      await api.createEmployee({ ...payload, locationId: selectedLocationId });
    }

    resetForm();
    loadData();
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', roleIds: [], ruleId: '', hourlyRate: '' });
    setIsFormOpen(false);
    setEditingId(null);
  };

  const startEdit = (employee: EmployeeWithRoles) => {
    setEditingId(employee.id);
    setFormData({
      name: employee.user.name,
      email: employee.user.email,
      roleIds: employee.roleIds,
      ruleId: employee.ruleId || '',
      hourlyRate: employee.hourlyRate ? employee.hourlyRate.toString() : '',
    });
    setIsFormOpen(true);
  };

  const toggleRole = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roleIds: prev.roleIds.includes(roleId)
        ? prev.roleIds.filter(id => id !== roleId)
        : [...prev.roleIds, roleId]
    }));
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-4">
          <h1 className="text-3xl font-bold">Employees</h1>
          <div className="flex items-center gap-2 bg-card border rounded-md p-1 text-sm">
            <MapPin size={16} className="text-muted-foreground ml-2" />
            <select
              className="bg-transparent p-1 outline-none min-w-[150px]"
              value={selectedLocationId}
              onChange={(e) => setSelectedLocationId(e.target.value)}
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.id}>{loc.name}</option>
              ))}
            </select>
          </div>
        </div>
        <button
          onClick={() => {
            resetForm();
            setIsFormOpen(true);
          }}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Employee
        </button>
      </div>

      {isFormOpen && (
        <div className="mb-8 p-6 bg-card rounded-lg border shadow-sm">
          <h2 className="text-xl font-semibold mb-4">{editingId ? 'Edit Employee' : 'New Employee'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 rounded-md border bg-background"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 rounded-md border bg-background"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Roles</label>
              <div className="flex flex-wrap gap-2">
                {roles.map(role => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${formData.roleIds.includes(role.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-background hover:bg-accent'
                      }`}
                  >
                    {role.name}
                  </button>
                ))}
              </div>
            </div>



            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Schedule Rule</label>
                <select
                  value={formData.ruleId}
                  onChange={(e) => setFormData({ ...formData, ruleId: e.target.value })}
                  className="w-full p-2 rounded-md border bg-background"
                >
                  <option value="">No Rule (Default)</option>
                  {rules.map(rule => (
                    <option key={rule.id} value={rule.id}>
                      {rule.name} ({rule.value} hrs)
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Hourly Rate ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.hourlyRate}
                  onChange={(e) => setFormData({ ...formData, hourlyRate: e.target.value })}
                  className="w-full p-2 rounded-md border bg-background"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 rounded-md hover:bg-accent transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {editingId ? 'Update Employee' : 'Save Employee'}
              </button>
            </div>
          </form>
        </div >
      )
      }

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {employees.map(employee => (
          <div key={employee.id} className="p-4 bg-card rounded-lg border shadow-sm relative group">
            <button
              onClick={() => startEdit(employee)}
              className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground hover:bg-accent rounded opacity-0 group-hover:opacity-100 transition-all"
            >
              <Edit2 size={16} />
            </button>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <UserIcon size={20} className="text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{employee.user.name}</h3>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Mail size={12} />
                    {employee.user.email}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {employee.roles.map(role => (
                <span
                  key={role.id}
                  className="px-2 py-1 rounded-md text-xs font-medium bg-secondary text-secondary-foreground flex items-center gap-1"
                >
                  <Shield size={10} />
                  {role.name}
                </span>
              ))}
              {employee.weeklyHoursLimit && (
                <span className="px-2 py-1 rounded-md text-xs font-medium bg-accent text-accent-foreground flex items-center gap-1">
                  <Clock size={10} />
                  Max {employee.weeklyHoursLimit}h
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div >
  );
}

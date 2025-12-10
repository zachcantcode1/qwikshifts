import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Plus, ArrowRight, Check } from 'lucide-react';

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.checkOnboardingStatus().then(({ step }) => {
      if (step > 1) setStep(step);
    });
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        if (step >= 2) {
          const locs = await api.getLocations();
          setLocations(locs);
        }
        if (step >= 3) {
          const ars = await api.getAreas();
          setAreas(ars);
        }
        if (step >= 4) {
          const rls = await api.getRoles();
          setRoles(rls);
        }
        if (step >= 5) {
          const emps = await api.getEmployees();
          setEmployees(emps.map(e => ({
            name: e.user.name,
            email: e.user.email,
            roleIds: e.roleIds,
            locationId: e.locationId
          })));
        }
      } catch (error) {
        console.error("Failed to load onboarding data", error);
        // If we fail to load data (likely 401), and we are past step 1,
        // we might be in a bad state (orphaned step). 
        // For now, let's just alert the user or maybe reset step if it's a token issue.
        if (!localStorage.getItem('qwikshifts-token') && step > 1) {
          // Fallback: force user back to step 1 effectively, though backend thinks step 2.
          // We can't easily "reset" backend from here without a special route.
          // Just stop loading to avoid crash.
        }
      }
    };

    loadData();
  }, [step]);

  const updateStep = async (newStep: number) => {
    setStep(newStep);
    await api.updateOnboardingStep(newStep);
  };

  // Step 1: Org & Manager
  const [orgName, setOrgName] = useState('');
  const [managerName, setManagerName] = useState('');
  const [managerEmail, setManagerEmail] = useState('');

  // Step 2: Locations
  const [locations, setLocations] = useState<{ id?: string; name: string }[]>([]);
  const [newLocation, setNewLocation] = useState('');

  // Step 3: Areas
  const [areas, setAreas] = useState<{ name: string; color: string; locationId: string }[]>([]);
  const [newArea, setNewArea] = useState({ name: '', color: '#3b82f6', locationId: '' });

  // Step 4: Roles
  const [roles, setRoles] = useState<{ id?: string; name: string; color: string }[]>([]);
  const [newRole, setNewRole] = useState({ name: '', color: '#3b82f6' });

  // Step 5: Employees
  const [employees, setEmployees] = useState<{ name: string; email: string; roleIds: string[]; locationId: string }[]>([]);
  const [newEmployee, setNewEmployee] = useState({ name: '', email: '', roleIds: [] as string[], locationId: '' });

  const handleSetupOrg = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.setupOrganization({ orgName, managerName, managerEmail });
      if (res.success) {
        localStorage.setItem('qwikshifts-token', res.token);
        updateStep(2);
      } else if (res.error) {
        alert(res.error);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to setup organization');
    } finally {
      setLoading(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocation) return;
    try {
      const loc = await api.createLocation({ name: newLocation });
      setLocations([...locations, loc]);
      setNewLocation('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddArea = async () => {
    if (!newArea.name || !newArea.locationId) return;
    try {
      const area = await api.createArea(newArea);
      setAreas([...areas, area]);
      setNewArea({ ...newArea, name: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddRole = async () => {
    if (!newRole.name) return;
    try {
      const role = await api.createRole(newRole);
      setRoles([...roles, role]);
      setNewRole({ ...newRole, name: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddEmployee = async () => {
    if (!newEmployee.name || !newEmployee.email || !newEmployee.locationId) return;
    try {
      const emp = await api.createEmployee(newEmployee) as any;
      if (emp.error) {
        alert(emp.error);
        return;
      }
      setEmployees([...employees, {
        name: emp.user.name,
        email: emp.user.email,
        roleIds: emp.roleIds,
        locationId: emp.locationId
      }]);
      setNewEmployee({ ...newEmployee, name: '', email: '', roleIds: [] });
    } catch (err) {
      console.error(err);
      alert('Failed to add employee');
    }
  };

  const handleFinish = async () => {
    await updateStep(6);
    navigate('/');
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-foreground">
          Welcome to QwikShifts
        </h2>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          Let's get your organization set up in a few steps.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-3xl">
        <div className="bg-card py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center">
              {[1, 2, 3, 4, 5].map((s) => (
                <div key={s} className={`flex items-center ${s < 5 ? 'flex-1' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= s ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                    }`}>
                    {step > s ? <Check size={16} /> : s}
                  </div>
                  {s < 5 && (
                    <div className={`flex-1 h-1 mx-2 ${step > s ? 'bg-primary' : 'bg-muted'
                      }`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Org</span>
              <span>Locations</span>
              <span>Areas</span>
              <span>Roles</span>
              <span>Staff</span>
            </div>
          </div>

          {step === 1 && (
            <form onSubmit={handleSetupOrg} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-foreground">Organization Name</label>
                <input
                  type="text"
                  required
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Manager Name</label>
                <input
                  type="text"
                  required
                  value={managerName}
                  onChange={(e) => setManagerName(e.target.value)}
                  className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Manager Email</label>
                <input
                  type="email"
                  required
                  value={managerEmail}
                  onChange={(e) => setManagerEmail(e.target.value)}
                  className="mt-1 block w-full bg-background border border-input rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring"
              >
                {loading ? 'Setting up...' : 'Start Setup'}
              </button>
            </form>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-foreground">Add Locations</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Location Name (e.g. Main Branch)"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="flex-1 block w-full bg-background border border-input rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
                />
                <button
                  onClick={handleAddLocation}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
                >
                  <Plus size={16} className="mr-2" /> Add
                </button>
              </div>
              <ul className="divide-y divide-border">
                {locations.map((loc, idx) => (
                  <li key={idx} className="py-4 flex justify-between text-foreground">
                    <span>{loc.name}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end">
                <button
                  onClick={() => updateStep(3)}
                  disabled={locations.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-green-600 hover:bg-green-700 disabled:opacity-50"
                >
                  Next <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-foreground">Add Areas</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <select
                  value={newArea.locationId}
                  onChange={(e) => setNewArea({ ...newArea, locationId: e.target.value })}
                  className="block w-full bg-background border border-input rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
                >
                  <option value="">Select Location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <input
                  type="text"
                  placeholder="Area Name (e.g. Kitchen)"
                  value={newArea.name}
                  onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                  className="block w-full bg-background border border-input rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
                />
                <button
                  onClick={handleAddArea}
                  className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
                >
                  <Plus size={16} className="mr-2" /> Add
                </button>
              </div>
              <ul className="divide-y divide-border">
                {areas.map((area, idx) => (
                  <li key={idx} className="py-4 flex justify-between text-foreground">
                    <span>{area.name}</span>
                    <span className="text-muted-foreground text-sm">
                      {locations.find(l => l.id === area.locationId)?.name}
                    </span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end">
                <button
                  onClick={() => updateStep(4)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-green-600 hover:bg-green-700"
                >
                  Next <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-foreground">Add Roles</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Role Name (e.g. Chef)"
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  className="flex-1 block w-full bg-background border border-input rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
                />
                <button
                  onClick={handleAddRole}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
                >
                  <Plus size={16} className="mr-2" /> Add
                </button>
              </div>
              <ul className="divide-y divide-border">
                {roles.map((role, idx) => (
                  <li key={idx} className="py-4 flex justify-between text-foreground">
                    <span>{role.name}</span>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end">
                <button
                  onClick={() => updateStep(5)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-green-600 hover:bg-green-700"
                >
                  Next <ArrowRight size={16} className="ml-2" />
                </button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-foreground">Add Employees</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <input
                  type="text"
                  placeholder="Name"
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({ ...newEmployee, name: e.target.value })}
                  className="block w-full bg-background border border-input rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({ ...newEmployee, email: e.target.value })}
                  className="block w-full bg-background border border-input rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
                />
                <select
                  value={newEmployee.locationId}
                  onChange={(e) => setNewEmployee({ ...newEmployee, locationId: e.target.value })}
                  className="block w-full bg-background border border-input rounded-md shadow-sm py-2 px-3 text-foreground focus:outline-none focus:ring-ring focus:border-ring sm:text-sm"
                >
                  <option value="">Select Location</option>
                  {locations.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                </select>
                <div className="sm:col-span-2">
                  <label className="block text-sm font-medium text-foreground mb-1">Roles</label>
                  <div className="flex flex-wrap gap-2">
                    {roles.map(role => (
                      <button
                        key={role.id} // Assuming role has ID after creation, but here I'm using state which might not have ID if I didn't update it correctly.
                        // Wait, handleAddRole updates state with result from API, which has ID.
                        type="button"
                        onClick={() => {
                          const ids = newEmployee.roleIds.includes(role.id!)
                            ? newEmployee.roleIds.filter(id => id !== role.id)
                            : [...newEmployee.roleIds, role.id!];
                          setNewEmployee({ ...newEmployee, roleIds: ids });
                        }}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${newEmployee.roleIds.includes(role.id!)
                            ? 'bg-primary text-primary-foreground/90 border-primary border'
                            : 'bg-muted text-muted-foreground border-border border'
                          }`}
                      >
                        {role.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button
                  onClick={handleAddEmployee}
                  className="sm:col-span-2 w-full inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-primary hover:bg-primary/90"
                >
                  <Plus size={16} className="mr-2" /> Add Employee
                </button>
              </div>
              <ul className="divide-y divide-border">
                {employees.map((emp, idx) => (
                  <li key={idx} className="py-4 flex justify-between text-foreground">
                    <div>
                      <p className="font-medium text-foreground">{emp.name}</p>
                      <p className="text-sm text-muted-foreground">{emp.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="flex justify-end">
                <button
                  onClick={handleFinish}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-primary-foreground bg-indigo-600 hover:bg-indigo-700"
                >
                  Finish Setup <Check size={16} className="ml-2" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

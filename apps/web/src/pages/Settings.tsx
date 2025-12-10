import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import type { Rule, Role, Area, StaffingRequirement, Location } from '@qwikshifts/core';
import { Plus, Trash2, Edit2, Save, X, Shield, MapPin, Clock, ChevronDown, ChevronUp, Globe, UserCog } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function Settings() {
  const [activeTab, setActiveTab] = useState<'rules' | 'roles' | 'areas' | 'locations' | 'preferences'>('rules');

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Settings</h1>
          <p className="text-muted-foreground mt-1">Manage application configuration.</p>
        </div>
      </div>

      <div className="flex gap-2 mb-8 border-b">
        <button
          onClick={() => setActiveTab('rules')}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'rules'
            ? 'border-primary text-primary font-medium'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <Clock size={16} />
          Work Limits
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'preferences'
            ? 'border-primary text-primary font-medium'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <UserCog size={16} />
          My Preferences
        </button>
        <button
          onClick={() => setActiveTab('roles')}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'roles'
            ? 'border-primary text-primary font-medium'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <Shield size={16} />
          Job Titles
        </button>
        <button
          onClick={() => setActiveTab('areas')}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'areas'
            ? 'border-primary text-primary font-medium'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <MapPin size={16} />
          Work Zones
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`px-4 py-2 border-b-2 transition-colors flex items-center gap-2 ${activeTab === 'locations'
            ? 'border-primary text-primary font-medium'
            : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
        >
          <Globe size={16} />
          Locations
        </button>
      </div>

      {activeTab === 'rules' && <RulesTab />}
      {activeTab === 'roles' && <RolesTab />}
      {activeTab === 'areas' && <AreasTab />}
      {activeTab === 'locations' && <LocationsTab />}
      {activeTab === 'preferences' && <PreferencesTab />}
    </div>
  );
}

function RulesTab() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRule, setNewRule] = useState({ name: '', value: 40 });
  const [editForm, setEditForm] = useState({ name: '', value: 40 });

  useEffect(() => { loadRules(); }, []);

  const loadRules = async () => {
    const data = await api.getRules();
    setRules(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createRule(newRule);
    setNewRule({ name: '', value: 40 });
    setIsAdding(false);
    loadRules();
  };

  const handleUpdate = async (id: string) => {
    await api.updateRule(id, editForm);
    setEditingId(null);
    loadRules();
  };

  const handleDelete = async (id: string) => {
    await api.deleteRule(id);
    loadRules();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Limit
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 p-4 border rounded-lg bg-card">
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Limit Name</label>
              <input
                type="text"
                value={newRule.name}
                onChange={(e) => setNewRule({ ...newRule, name: e.target.value })}
                className="w-full p-2 rounded-md border bg-background"
                placeholder="e.g. Part Time"
                required
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium mb-1">Max Hours</label>
              <input
                type="number"
                value={newRule.value}
                onChange={(e) => setNewRule({ ...newRule, value: Number(e.target.value) })}
                className="w-full p-2 rounded-md border bg-background"
                min="0"
                required
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Create</button>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {rules.map((rule) => (
          <div key={rule.id} className="p-4 border rounded-lg bg-card flex items-center justify-between">
            {editingId === rule.id ? (
              <div className="flex-1 flex gap-4 items-center">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="flex-1 p-2 rounded-md border bg-background"
                />
                <input
                  type="number"
                  value={editForm.value}
                  onChange={(e) => setEditForm({ ...editForm, value: Number(e.target.value) })}
                  className="w-24 p-2 rounded-md border bg-background"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(rule.id)} className="p-2 text-green-600 hover:bg-green-50 rounded"><Save size={20} /></button>
                  <button onClick={() => setEditingId(null)} className="p-2 text-muted-foreground hover:bg-accent rounded"><X size={20} /></button>
                </div>
              </div>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold">{rule.name}</h3>
                  <p className="text-sm text-muted-foreground">Max {rule.value} hours / week</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(rule.id); setEditForm({ name: rule.name, value: rule.value }); }} className="p-2 text-muted-foreground hover:bg-accent rounded"><Edit2 size={20} /></button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-2 text-destructive hover:bg-destructive/10 rounded"><Trash2 size={20} /></button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Limit?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this work limit? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(rule.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RolesTab() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newRole, setNewRole] = useState({ name: '', color: '#3b82f6' });
  const [editForm, setEditForm] = useState({ name: '', color: '#3b82f6' });

  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    const data = await api.getRoles();
    setRoles(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createRole(newRole);
    setNewRole({ name: '', color: '#3b82f6' });
    setIsAdding(false);
    loadRoles();
  };

  const handleUpdate = async (id: string) => {
    await api.updateRole(id, editForm);
    setEditingId(null);
    loadRoles();
  };

  const handleDelete = async (id: string) => {
    await api.deleteRole(id);
    loadRoles();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Job Title
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 p-4 border rounded-lg bg-card">
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Job Title</label>
              <input
                type="text"
                value={newRole.name}
                onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                className="w-full p-2 rounded-md border bg-background"
                placeholder="e.g. Server"
                required
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="color"
                value={newRole.color}
                onChange={(e) => setNewRole({ ...newRole, color: e.target.value })}
                className="w-full h-10 p-1 rounded-md border bg-background cursor-pointer"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Create</button>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {roles.map((role) => (
          <div key={role.id} className="p-4 border rounded-lg bg-card flex items-center justify-between">
            {editingId === role.id ? (
              <div className="flex-1 flex gap-4 items-center">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="flex-1 p-2 rounded-md border bg-background"
                />
                <input
                  type="color"
                  value={editForm.color}
                  onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                  className="w-12 h-10 p-1 rounded-md border bg-background cursor-pointer"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(role.id)} className="p-2 text-green-600 hover:bg-green-50 rounded"><Save size={20} /></button>
                  <button onClick={() => setEditingId(null)} className="p-2 text-muted-foreground hover:bg-accent rounded"><X size={20} /></button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: role.color }} />
                  <h3 className="font-semibold">{role.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(role.id); setEditForm({ name: role.name, color: role.color }); }} className="p-2 text-muted-foreground hover:bg-accent rounded"><Edit2 size={20} /></button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-2 text-destructive hover:bg-destructive/10 rounded"><Trash2 size={20} /></button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Job Title?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this job title? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(role.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function AreasTab() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [areas, setAreas] = useState<Area[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newArea, setNewArea] = useState({ name: '', color: '#3b82f6' });
  const [editForm, setEditForm] = useState({ name: '', color: '#3b82f6' });

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
      loadAreas();
    }
  }, [selectedLocationId]);

  const loadAreas = async () => {
    const data = await api.getAreas(selectedLocationId);
    setAreas(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createArea({ ...newArea, locationId: selectedLocationId });
    setNewArea({ name: '', color: '#3b82f6' });
    setIsAdding(false);
    loadAreas();
  };

  const handleUpdate = async (id: string) => {
    await api.updateArea(id, editForm);
    setEditingId(null);
    loadAreas();
  };

  const handleDelete = async (id: string) => {
    await api.deleteArea(id);
    loadAreas();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
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
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Zone
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 p-4 border rounded-lg bg-card">
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Zone Name</label>
              <input
                type="text"
                value={newArea.name}
                onChange={(e) => setNewArea({ ...newArea, name: e.target.value })}
                className="w-full p-2 rounded-md border bg-background"
                placeholder="e.g. Patio"
                required
              />
            </div>
            <div className="w-32">
              <label className="block text-sm font-medium mb-1">Color</label>
              <input
                type="color"
                value={newArea.color}
                onChange={(e) => setNewArea({ ...newArea, color: e.target.value })}
                className="w-full h-10 p-1 rounded-md border bg-background cursor-pointer"
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Create</button>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {areas.map((area) => (
          <div key={area.id} className="border rounded-lg bg-card overflow-hidden">
            <div className="p-4 flex items-center justify-between">
              {editingId === area.id ? (
                <div className="flex-1 flex gap-4 items-center">
                  <input
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="flex-1 p-2 rounded-md border bg-background"
                  />
                  <input
                    type="color"
                    value={editForm.color}
                    onChange={(e) => setEditForm({ ...editForm, color: e.target.value })}
                    className="w-12 h-10 p-1 rounded-md border bg-background cursor-pointer"
                  />
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(area.id)} className="p-2 text-green-600 hover:bg-green-50 rounded"><Save size={20} /></button>
                    <button onClick={() => setEditingId(null)} className="p-2 text-muted-foreground hover:bg-accent rounded"><X size={20} /></button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded-full" style={{ backgroundColor: area.color }} />
                    <h3 className="font-semibold">{area.name}</h3>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setExpandedId(expandedId === area.id ? null : area.id)}
                      className={`p-2 rounded flex items-center gap-2 text-sm ${expandedId === area.id ? 'bg-accent text-accent-foreground' : 'text-muted-foreground hover:bg-accent'}`}
                    >
                      {expandedId === area.id ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                      Requirements
                    </button>
                    <button onClick={() => { setEditingId(area.id); setEditForm({ name: area.name, color: area.color }); }} className="p-2 text-muted-foreground hover:bg-accent rounded"><Edit2 size={20} /></button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <button className="p-2 text-destructive hover:bg-destructive/10 rounded"><Trash2 size={20} /></button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Zone?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this zone? This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(area.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </>
              )}
            </div>
            {expandedId === area.id && (
              <div className="px-4 pb-4">
                <RequirementsManager areaId={area.id} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function RequirementsManager({ areaId }: { areaId: string }) {
  const [requirements, setRequirements] = useState<StaffingRequirement[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedDay, setSelectedDay] = useState('monday');
  const [newReq, setNewReq] = useState({ roleId: '', count: 1 });

  useEffect(() => {
    loadData();
  }, [areaId]);

  const loadData = async () => {
    const [reqs, rolesData] = await Promise.all([
      api.getRequirements(areaId),
      api.getRoles()
    ]);
    setRequirements(reqs);
    setRoles(rolesData);
    if (rolesData.length > 0 && !newReq.roleId) {
      setNewReq(prev => ({ ...prev, roleId: rolesData[0].id }));
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReq.roleId) return;
    await api.createRequirement({
      areaId,
      dayOfWeek: selectedDay,
      roleId: newReq.roleId,
      count: newReq.count
    });
    loadData();
  };

  const handleDelete = async (id: string) => {
    await api.deleteRequirement(id);
    loadData();
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
  const currentDayReqs = requirements.filter(r => r.dayOfWeek === selectedDay);

  return (
    <div className="p-4 bg-accent/20 rounded-lg border">
      <h4 className="font-semibold mb-4">Staffing Requirements</h4>

      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {days.map(day => (
          <button
            key={day}
            onClick={() => setSelectedDay(day)}
            className={`px-3 py-1 rounded-full text-sm capitalize whitespace-nowrap ${selectedDay === day
              ? 'bg-primary text-primary-foreground'
              : 'bg-background hover:bg-accent'
              }`}
          >
            {day}
          </button>
        ))}
      </div>

      <div className="space-y-2 mb-4">
        {currentDayReqs.map(req => {
          const role = roles.find(r => r.id === req.roleId);
          return (
            <div key={req.id} className="flex items-center justify-between bg-background p-2 rounded border">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: role?.color }} />
                <span>{role?.name || 'Unknown Role'}</span>
                <span className="text-muted-foreground">x{req.count}</span>
              </div>
              <button onClick={() => handleDelete(req.id)} className="text-destructive hover:bg-destructive/10 p-1 rounded">
                <Trash2 size={16} />
              </button>
            </div>
          );
        })}
        {currentDayReqs.length === 0 && (
          <p className="text-sm text-muted-foreground italic">No requirements set for {selectedDay}</p>
        )}
      </div>

      <form onSubmit={handleAdd} className="flex gap-2 items-end">
        <div className="flex-1">
          <label className="block text-xs font-medium mb-1">Role</label>
          <select
            value={newReq.roleId}
            onChange={e => setNewReq({ ...newReq, roleId: e.target.value })}
            className="w-full p-2 rounded-md border bg-background text-sm"
          >
            {roles.map(role => (
              <option key={role.id} value={role.id}>{role.name}</option>
            ))}
          </select>
        </div>
        <div className="w-20">
          <label className="block text-xs font-medium mb-1">Count</label>
          <input
            type="number"
            min="1"
            value={newReq.count}
            onChange={e => setNewReq({ ...newReq, count: Number(e.target.value) })}
            className="w-full p-2 rounded-md border bg-background text-sm"
          />
        </div>
        <button type="submit" className="p-2 bg-primary text-primary-foreground rounded-md">
          <Plus size={20} />
        </button>
      </form>
    </div>
  );
}

function LocationsTab() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newLocation, setNewLocation] = useState({ name: '' });
  const [editForm, setEditForm] = useState({ name: '' });

  useEffect(() => { loadLocations(); }, []);

  const loadLocations = async () => {
    const data = await api.getLocations();
    setLocations(data);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await api.createLocation(newLocation);
    setNewLocation({ name: '' });
    setIsAdding(false);
    loadLocations();
  };

  const handleUpdate = async (id: string) => {
    await api.updateLocation(id, editForm);
    setEditingId(null);
    loadLocations();
  };

  const handleDelete = async (id: string) => {
    await api.deleteLocation(id);
    loadLocations();
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md hover:bg-primary/90 transition-colors"
        >
          <Plus size={20} />
          Add Location
        </button>
      </div>

      {isAdding && (
        <div className="mb-8 p-4 border rounded-lg bg-card">
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Location Name</label>
              <input
                type="text"
                value={newLocation.name}
                onChange={(e) => setNewLocation({ ...newLocation, name: e.target.value })}
                className="w-full p-2 rounded-md border bg-background"
                required
              />
            </div>
            <button type="submit" className="px-4 py-2 bg-primary text-primary-foreground rounded-md">Create</button>
          </form>
        </div>
      )}

      <div className="grid gap-4">
        {locations.map((location) => (
          <div key={location.id} className="p-4 border rounded-lg bg-card flex items-center justify-between">
            {editingId === location.id ? (
              <div className="flex-1 flex gap-4 items-center">
                <input
                  type="text"
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="flex-1 p-2 rounded-md border bg-background"
                />
                <div className="flex gap-2">
                  <button onClick={() => handleUpdate(location.id)} className="p-2 text-green-600 hover:bg-green-50 rounded"><Save size={20} /></button>
                  <button onClick={() => setEditingId(null)} className="p-2 text-muted-foreground hover:bg-accent rounded"><X size={20} /></button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{location.name}</h3>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => { setEditingId(location.id); setEditForm({ name: location.name }); }} className="p-2 text-muted-foreground hover:bg-accent rounded"><Edit2 size={20} /></button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <button className="p-2 text-destructive hover:bg-destructive/10 rounded"><Trash2 size={20} /></button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Location?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this location? This will delete all areas, shifts, and assignments associated with this location. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(location.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function PreferencesTab() {
  const { user, updateUser } = useAuth();
  const [timeFormat, setTimeFormat] = useState<'12h' | '24h'>('24h');

  useEffect(() => {
    if (user?.timeFormat) {
      setTimeFormat(user.timeFormat);
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    await updateUser({ timeFormat });
  };

  return (
    <div className="max-w-xl">
      <div className="p-6 border rounded-lg bg-card mb-6">
        <h3 className="text-lg font-semibold mb-4">Time Display</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Time Format</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeFormat"
                  value="12h"
                  checked={timeFormat === '12h'}
                  onChange={(e) => setTimeFormat(e.target.value as '12h')}
                  className="w-4 h-4 text-primary"
                />
                <span>12-hour (e.g. 2:00 PM)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeFormat"
                  value="24h"
                  checked={timeFormat === '24h'}
                  onChange={(e) => setTimeFormat(e.target.value as '24h')}
                  className="w-4 h-4 text-primary"
                />
                <span>24-hour (e.g. 14:00)</span>
              </label>
            </div>
          </div>

          <div className="pt-4 border-t flex justify-end">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md flex items-center gap-2"
            >
              <Save size={16} />
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

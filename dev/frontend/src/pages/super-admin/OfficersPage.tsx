import { useState, useMemo, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Shield, MoreVertical, UserCheck, UserX, Key, X, Check, ChevronRight } from 'lucide-react';
import { useOfficerStore, useToast, useStationStore } from '@/store';
import { ConfirmDialog } from '@/components/shared';

type Role = 'officer' | 'supervisor' | 'admin' | 'super-admin';
type ViewMode = 'list' | 'add';

interface UserData {
  id: string;
  name: string;
  badgeNumber: string;
  email: string;
  phone: string;
  role: Role;
  stationName: string;
  regionName: string;
  isActive: boolean;
  lastLogin?: string;
}

const ROLE_LABELS: Record<Role, string> = {
  'officer': 'Field Officer',
  'supervisor': 'Supervisor',
  'admin': 'Station Admin',
  'super-admin': 'Super Admin',
};

const ROLE_COLORS: Record<Role, string> = {
  'officer': 'bg-gray-100 text-gray-700',
  'supervisor': 'bg-blue-50 text-blue-700',
  'admin': 'bg-[#F9A825]/10 text-[#F9A825]',
  'super-admin': 'bg-[#1A1F3A]/10 text-[#1A1F3A]',
};


const RANKS = [
  'Constable', 'Lance Corporal', 'Corporal', 'Sergeant', 'Staff Sergeant',
  'Warrant Officer Class II', 'Warrant Officer Class I', 'Inspector',
  'Chief Inspector', 'Assistant Superintendent', 'Deputy Superintendent', 'Superintendent',
];

interface OnboardingData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  nationalId: string;
  regionId: string;
  divisionId: string;
  districtId: string;
  stationId: string;
  role: 'officer' | 'supervisor' | 'admin';
  badgeNumber: string;
  rank: string;
}

const INITIAL_ONBOARDING: OnboardingData = {
  firstName: '', lastName: '', email: '', phone: '', dateOfBirth: '', nationalId: '',
  regionId: '', divisionId: '', districtId: '', stationId: '',
  role: 'officer', badgeNumber: '', rank: '',
};

export function OfficersPage() {
  const { officers } = useOfficerStore();
  const fetchOfficers = useOfficerStore((state) => state.fetchOfficers);
  const toast = useToast();

  const storeRegions = useStationStore((state) => state.regions);
  const storeDivisions = useStationStore((state) => state.divisions);
  const storeDistricts = useStationStore((state) => state.districts);
  const storeStations = useStationStore((state) => state.stations);
  const fetchRegions = useStationStore((state) => state.fetchRegions);
  const fetchDivisions = useStationStore((state) => state.fetchDivisions);
  const fetchDistricts = useStationStore((state) => state.fetchDistricts);
  const fetchStations = useStationStore((state) => state.fetchStations);

  useEffect(() => {
    fetchRegions();
    fetchDivisions();
    fetchDistricts();
    fetchStations();
  }, [fetchRegions, fetchDivisions, fetchDistricts, fetchStations]);

  useEffect(() => { fetchOfficers(); }, [fetchOfficers]);

  // View state
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [currentStep, setCurrentStep] = useState(1);
  
  // List filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | Role>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  
  // Onboarding form
  const [formData, setFormData] = useState<OnboardingData>(INITIAL_ONBOARDING);

  // Map officers to user data format
  const demoUsers: UserData[] = officers.map(o => ({
    id: o.id,
    name: o.fullName || `${o.firstName} ${o.lastName}`,
    badgeNumber: o.badgeNumber,
    email: o.email || `${o.badgeNumber.toLowerCase()}@police.gov.gh`,
    phone: o.phone || '+233 24 123 4567',
    role: (o.rank?.includes('inspector') ? 'supervisor' : 'officer') as Role,
    stationName: o.stationName || 'Unassigned',
    regionName: o.regionId || '',
    isActive: o.isActive,
    lastLogin: '',
  }));

  const filteredUsers = useMemo(() => {
    return demoUsers.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.badgeNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           user.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && user.isActive) ||
                           (statusFilter === 'inactive' && !user.isActive);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [demoUsers, searchQuery, roleFilter, statusFilter]);

  const handleAction = (_userId: string, action: string) => {
    switch (action) {
      case 'reset-password':
        toast.success('Password Reset', 'Password reset email sent');
        break;
      case 'activate':
        toast.success('User Activated', 'User account activated');
        break;
      case 'deactivate':
        toast.success('User Deactivated', 'User account deactivated');
        break;
    }
    setActiveDropdown(null);
  };

  const updateField = <K extends keyof OnboardingData>(field: K, value: OnboardingData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmitOnboarding = () => {
    toast.success('Officer Added', `${formData.firstName} ${formData.lastName} has been onboarded`);
    setFormData(INITIAL_ONBOARDING);
    setCurrentStep(1);
    setViewMode('list');
  };

  const filteredDivisions = storeDivisions.filter(d => d.regionId === formData.regionId);
  const filteredDistricts = storeDistricts.filter(d => d.divisionId === formData.divisionId);
  const filteredStations = storeStations.filter(s => s.districtId === formData.districtId);

  // ADD NEW OFFICER VIEW
  if (viewMode === 'add') {
    return (
      <div className="space-y-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Add New Officer</h1>
            <p className="mt-1 text-sm text-gray-500">Step {currentStep} of 3</p>
          </div>
          <button 
            title="Close"
            onClick={() => { setViewMode('list'); setCurrentStep(1); setFormData(INITIAL_ONBOARDING); }}
            className="p-2 hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center gap-2 flex-1">
              <div className={`w-8 h-8 flex items-center justify-center text-sm font-medium ${
                step < currentStep ? 'bg-green-600 text-white' :
                step === currentStep ? 'bg-[#1A1F3A] text-white' : 'bg-gray-100 text-gray-400'
              }`}>
                {step < currentStep ? <Check className="w-4 h-4" /> : step}
              </div>
              {step < 3 && <div className={`flex-1 h-0.5 ${step < currentStep ? 'bg-green-600' : 'bg-gray-200'}`} />}
            </div>
          ))}
        </div>

        {/* Form */}
        <div className="bg-white border border-gray-200 p-6">
          {/* Step 1: Personal Info */}
          {currentStep === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input type="text" value={formData.firstName} onChange={(e) => updateField('firstName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" placeholder="First name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input type="text" value={formData.lastName} onChange={(e) => updateField('lastName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" placeholder="Last name" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" value={formData.email} onChange={(e) => updateField('email', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" placeholder="email@police.gov.gh" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                  <input type="tel" value={formData.phone} onChange={(e) => updateField('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" placeholder="+233 XX XXX XXXX" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Badge Number *</label>
                  <input type="text" value={formData.badgeNumber} onChange={(e) => updateField('badgeNumber', e.target.value.toUpperCase())}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] font-mono" placeholder="GPS001" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Rank *</label>
                  <select aria-label="Select rank" value={formData.rank} onChange={(e) => updateField('rank', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                    <option value="">Select Rank</option>
                    {RANKS.map(rank => <option key={rank} value={rank}>{rank}</option>)}
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Step 2: Assignment */}
          {currentStep === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Station Assignment</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                  <select aria-label="Select region" value={formData.regionId}
                    onChange={(e) => { updateField('regionId', e.target.value); updateField('divisionId', ''); updateField('districtId', ''); updateField('stationId', ''); }}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                    <option value="">Select Region</option>
                    {storeRegions.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Division *</label>
                  <select aria-label="Select division" value={formData.divisionId} disabled={!formData.regionId}
                    onChange={(e) => { updateField('divisionId', e.target.value); updateField('districtId', ''); updateField('stationId', ''); }}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white disabled:bg-gray-50">
                    <option value="">Select Division</option>
                    {filteredDivisions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">District *</label>
                  <select aria-label="Select district" value={formData.districtId} disabled={!formData.divisionId}
                    onChange={(e) => { updateField('districtId', e.target.value); updateField('stationId', ''); }}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white disabled:bg-gray-50">
                    <option value="">Select District</option>
                    {filteredDistricts.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Station *</label>
                  <select aria-label="Select station" value={formData.stationId} disabled={!formData.districtId}
                    onChange={(e) => updateField('stationId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white disabled:bg-gray-50">
                    <option value="">Select Station</option>
                    {filteredStations.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Role *</label>
                <div className="flex gap-4">
                  {(['officer', 'supervisor', 'admin'] as const).map((role) => (
                    <button key={role} type="button" onClick={() => updateField('role', role)}
                      className={`flex-1 p-3 border text-center ${formData.role === role ? 'border-[#1A1F3A] bg-[#1A1F3A]/5' : 'border-gray-200'}`}>
                      <p className={`font-medium capitalize ${formData.role === role ? 'text-[#1A1F3A]' : 'text-gray-700'}`}>
                        {role === 'admin' ? 'Station Admin' : role === 'supervisor' ? 'Supervisor' : 'Field Officer'}
                      </p>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Step 3: Review */}
          {currentStep === 3 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Review & Confirm</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div><p className="text-gray-500">Full Name</p><p className="font-medium">{formData.firstName} {formData.lastName}</p></div>
                <div><p className="text-gray-500">Badge Number</p><p className="font-medium font-mono">{formData.badgeNumber || '-'}</p></div>
                <div><p className="text-gray-500">Email</p><p className="font-medium">{formData.email || '-'}</p></div>
                <div><p className="text-gray-500">Phone</p><p className="font-medium">{formData.phone || '-'}</p></div>
                <div><p className="text-gray-500">Rank</p><p className="font-medium">{formData.rank || '-'}</p></div>
                <div><p className="text-gray-500">Role</p><p className="font-medium capitalize">{formData.role}</p></div>
              </div>
            </div>
          )}

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <button type="button" onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : setViewMode('list')}
              className="px-6 py-2 border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">
              {currentStep === 1 ? 'Cancel' : 'Back'}
            </button>
            {currentStep < 3 ? (
              <button type="button" onClick={() => setCurrentStep(currentStep + 1)}
                className="flex items-center gap-2 px-6 py-2 bg-[#1A1F3A] text-white font-medium hover:bg-[#1A1F3A]/90">
                Continue <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" onClick={handleSubmitOnboarding}
                className="flex items-center gap-2 px-6 py-2 bg-[#1A1F3A] text-white font-medium hover:bg-[#1A1F3A]/90">
                <Check className="w-4 h-4" /> Add Officer
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // LIST VIEW
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Officers & Users</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all system users</p>
        </div>
        <button onClick={() => setViewMode('add')} className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] text-white font-medium hover:bg-[#1A1F3A]/90">
          <Plus className="w-4 h-4" /> Add Officer
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, badge, or email..." className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" />
        </div>
        <select aria-label="Filter by role" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
          <option value="all">All Roles</option>
          <option value="officer">Field Officers</option>
          <option value="supervisor">Supervisors</option>
          <option value="admin">Admins</option>
          <option value="super-admin">Super Admins</option>
        </select>
        <select aria-label="Filter by status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total</p>
          <p className="text-2xl font-bold text-gray-900">{demoUsers.length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Officers</p>
          <p className="text-2xl font-bold text-gray-700">{demoUsers.filter(u => u.role === 'officer').length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Admins</p>
          <p className="text-2xl font-bold text-[#F9A825]">{demoUsers.filter(u => u.role === 'admin' || u.role === 'super-admin').length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-gray-400">{demoUsers.filter(u => !u.isActive).length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">User</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Badge #</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Role</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Station</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-[#1A1F3A] flex items-center justify-center">
                        <span className="text-white font-medium text-sm">{user.name.split(' ').map(n => n[0]).join('')}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><span className="text-sm font-mono text-gray-700">{user.badgeNumber}</span></td>
                  <td className="px-4 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium ${ROLE_COLORS[user.role]}`}>
                      <Shield className="w-3 h-3" />{ROLE_LABELS[user.role]}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <p className="text-sm text-gray-700">{user.stationName}</p>
                    <p className="text-xs text-gray-500">{user.regionName}</p>
                  </td>
                  <td className="px-4 py-4">
                    {user.isActive ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                        <span className="w-1.5 h-1.5 bg-green-600" />Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400">
                        <span className="w-1.5 h-1.5 bg-gray-400" />Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="relative flex items-center justify-end gap-2">
                      <button title="Edit user" className="p-2 hover:bg-gray-100 text-gray-600"><Edit2 className="w-4 h-4" /></button>
                      <button title="More actions" onClick={() => setActiveDropdown(activeDropdown === user.id ? null : user.id)} className="p-2 hover:bg-gray-100 text-gray-600">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {activeDropdown === user.id && (
                        <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-gray-200 z-10">
                          <button onClick={() => handleAction(user.id, 'reset-password')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                            <Key className="w-4 h-4" />Reset Password
                          </button>
                          {user.isActive ? (
                            <button onClick={() => handleAction(user.id, 'deactivate')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <UserX className="w-4 h-4" />Deactivate
                            </button>
                          ) : (
                            <button onClick={() => handleAction(user.id, 'activate')} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                              <UserCheck className="w-4 h-4" />Activate
                            </button>
                          )}
                          <button onClick={() => { setShowDeleteConfirm(user.id); setActiveDropdown(null); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50">
                            <Trash2 className="w-4 h-4" />Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && <div className="p-8 text-center text-gray-500">No users found.</div>}
      </div>

      <ConfirmDialog isOpen={!!showDeleteConfirm} title="Delete User" message="Are you sure? This cannot be undone."
        confirmText="Delete" onConfirm={() => { toast.success('Deleted', 'User removed'); setShowDeleteConfirm(null); }}
        onClose={() => setShowDeleteConfirm(null)} />
    </div>
  );
}

export default OfficersPage;

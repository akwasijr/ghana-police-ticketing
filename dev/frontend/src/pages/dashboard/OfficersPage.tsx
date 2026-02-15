import { useState, useMemo, useEffect } from 'react';
import { Search, UserPlus, MapPin, Phone, Eye } from 'lucide-react';
import { useOfficerStore } from '@/store/officer.store';
import { useStationStore } from '@/store/station.store';
import { useUIStore } from '@/store/ui.store';
import { cn } from '@/lib/utils';
import { DataTable, Modal, type Column } from '@/components/shared';
import type { OfficerRank, Officer } from '@/types/officer.types';

// Initial form state
const initialFormState = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  badgeNumber: '',
  rank: '' as OfficerRank | '',
  dateJoined: '',
  status: 'active' as 'active' | 'inactive',
  stationId: '',
};

export function OfficersPage() {
  const officers = useOfficerStore((state) => state.officers);
  const addOfficer = useOfficerStore((state) => state.addOfficer);
  const fetchOfficers = useOfficerStore((state) => state.fetchOfficers);
  const addToast = useUIStore((state) => state.addToast);
  const storeStations = useStationStore((state) => state.stations);
  const fetchStations = useStationStore((state) => state.fetchStations);
  const [searchTerm, setSearchTerm] = useState('');
  const [stationFilter, setStationFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [selectedOfficerId, setSelectedOfficerId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState(initialFormState);
  const [noStationException, setNoStationException] = useState(false);

  useEffect(() => { fetchStations(); }, [fetchStations]);
  useEffect(() => { fetchOfficers(); }, [fetchOfficers]);

  const stations = storeStations;

  const filteredOfficers = officers.filter(officer => {
    const matchesSearch =
      officer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      officer.badgeNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (officer.stationName && officer.stationName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStation = stationFilter === 'all' || officer.stationName === stationFilter;
    const matchesStatus = statusFilter === 'all' || officer.status === statusFilter;

    return matchesSearch && matchesStation && matchesStatus;
  });

  const selectedOfficer = officers.find(o => o.id === selectedOfficerId);

  const officerColumns = useMemo<Column<Officer>[]>(() => [
    {
      header: 'Badge Number',
      accessor: 'badgeNumber',
      render: (value) => <span className="font-mono font-medium text-gray-900">{String(value)}</span>
    },
    {
      header: 'Name',
      accessor: 'fullName',
      render: (value) => <span className="font-medium text-gray-900">{String(value)}</span>
    },
    {
      header: 'Rank',
      accessor: 'rankDisplay',
      render: (value) => <span className="text-gray-600">{String(value)}</span>
    },
    {
      header: 'Station',
      accessor: 'stationName',
      render: (value) => (
        <div className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-900">{String(value)}</span>
        </div>
      )
    },
    {
      header: 'Phone',
      accessor: 'phone',
      render: (value) => (
        <div className="flex items-center gap-1.5">
          <Phone className="h-3.5 w-3.5 text-gray-400" />
          <span className="text-gray-600">{String(value)}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessor: 'status',
      render: (value) => (
        <span className={cn(
          'inline-block px-2 py-0.5 text-[10px] font-medium uppercase',
          value === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        )}>
          {String(value)}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: 'id',
      align: 'right' as const,
      render: () => (
        <button className="text-gray-400 hover:text-[#1A1F3A]" aria-label="View officer">
          <Eye className="h-4 w-4" />
        </button>
      )
    }
  ], []);

  // Detail View
  if (selectedOfficerId && selectedOfficer) {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setSelectedOfficerId(null)}
            className="text-xs text-[#1A1F3A] hover:underline"
          >
            ← Back to Officers
          </button>
        </div>

        <div>
          <h1 className="text-lg font-semibold text-gray-900">Officer Profile</h1>
          <p className="text-xs text-gray-500">{selectedOfficer.badgeNumber}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Main Info */}
          <div className="col-span-2 space-y-4">
            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Full Name:</span>
                  <p className="font-medium text-gray-900 mt-1">{selectedOfficer.fullName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Badge Number:</span>
                  <p className="font-mono font-medium text-gray-900 mt-1">{selectedOfficer.badgeNumber}</p>
                </div>
                <div>
                  <span className="text-gray-500">Rank:</span>
                  <p className="text-gray-900 mt-1">{selectedOfficer.rankDisplay}</p>
                </div>
                <div>
                  <span className="text-gray-500">Status:</span>
                  <p className="mt-1">
                    <span className={cn(
                      'inline-flex items-center px-2 py-1 text-xs font-medium uppercase',
                      selectedOfficer.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    )}>
                      {selectedOfficer.status}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Phone:</span>
                  <p className="text-gray-900 mt-1">{selectedOfficer.phone}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="text-gray-900 mt-1">{selectedOfficer.email}</p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 p-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-4">Assignment Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Station:</span>
                  <p className="font-medium text-gray-900 mt-1">{selectedOfficer.stationName}</p>
                </div>
                <div>
                  <span className="text-gray-500">Region:</span>
                  <p className="text-gray-900 mt-1">{selectedOfficer.regionId}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar Stats */}
          <div className="space-y-4">
            <div className="bg-white border border-gray-200 p-4">
              <h3 className="text-xs font-semibold text-gray-900 mb-3">Statistics</h3>
              <div className="space-y-3">
                <div>
                  <span className="text-xs text-gray-500">Total Tickets Issued</span>
                  <p className="text-2xl font-bold text-gray-900 mt-1">0</p>
                </div>
                <div>
                  <span className="text-xs text-gray-500">This Month</span>
                  <p className="text-lg font-bold text-gray-900 mt-1">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Add Officer Modal
  const handleAddOfficer = () => {
    // Validate required fields
    if (!formData.firstName || !formData.lastName || !formData.phone || !formData.badgeNumber || !formData.rank) {
      addToast({ title: 'Validation Error', message: 'Please fill in all required fields', type: 'error' });
      return;
    }
    
    if (!noStationException && !formData.stationId) {
      addToast({ title: 'Validation Error', message: 'Please select a station or check "No station assignment"', type: 'error' });
      return;
    }
    
    // Find station details
    const selectedStation = stations.find(s => s.id === formData.stationId);
    
    // Add officer to store
    const officerId = `OFF-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();
    
    addOfficer({
      id: officerId,
      firstName: formData.firstName,
      lastName: formData.lastName,
      fullName: `${formData.firstName} ${formData.lastName}`,
      email: formData.email || `${formData.firstName.toLowerCase()}.${formData.lastName.toLowerCase()}@gps.gov.gh`,
      phone: formData.phone,
      badgeNumber: formData.badgeNumber,
      rank: formData.rank as OfficerRank,
      rankDisplay: formData.rank.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      stationId: formData.stationId || '',
      stationName: selectedStation?.name,
      regionId: selectedStation?.regionId || '',
      station: selectedStation ? {
        id: selectedStation.id,
        name: selectedStation.name,
        code: selectedStation.code,
        address: selectedStation.address,
        phone: selectedStation.phone,
        regionId: selectedStation.regionId,
        regionName: selectedStation.regionName,
        divisionId: selectedStation.divisionId,
        divisionName: selectedStation.divisionName,
        districtId: selectedStation.districtId,
        districtName: selectedStation.districtName,
        isActive: selectedStation.status === 'active',
      } : {
        id: '',
        name: 'Unassigned',
        code: '',
        address: '',
        phone: '',
        regionId: '',
        regionName: '',
        divisionId: '',
        divisionName: '',
        districtId: '',
        districtName: '',
        isActive: true,
      },
      role: 'officer',
      isActive: formData.status === 'active',
      status: formData.status,
      joinedDate: formData.dateJoined || now.split('T')[0],
      createdAt: now,
    });
    
    addToast({ title: 'Success', message: `Officer ${formData.firstName} ${formData.lastName} has been onboarded successfully`, type: 'success' });
    setFormData(initialFormState);
    setNoStationException(false);
    setShowAddModal(false);
  };

  const AddOfficerModalContent = () => (
    <div className="space-y-6">
      {/* Personal Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Personal Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">First Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="Enter first name" 
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Last Name <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="Enter last name" 
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number <span className="text-red-500">*</span></label>
            <input 
              type="tel" 
              placeholder="e.g., 024-XXX-XXXX" 
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Email Address</label>
            <input 
              type="email" 
              placeholder="officer@gps.gov.gh" 
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
            />
          </div>
        </div>
      </div>

      {/* Service Information */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Service Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Badge Number <span className="text-red-500">*</span></label>
            <input 
              type="text" 
              placeholder="e.g., GPS-1234" 
              value={formData.badgeNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, badgeNumber: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Rank <span className="text-red-500">*</span></label>
            <select 
              value={formData.rank}
              onChange={(e) => setFormData(prev => ({ ...prev, rank: e.target.value as OfficerRank }))}
              className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
            >
              <option value="">Select Rank</option>
              <option value="constable">Constable</option>
              <option value="lance_corporal">Lance Corporal</option>
              <option value="corporal">Corporal</option>
              <option value="sergeant">Sergeant</option>
              <option value="inspector">Inspector</option>
              <option value="chief_inspector">Chief Inspector</option>
              <option value="asp">Assistant Superintendent</option>
              <option value="dsp">Deputy Superintendent</option>
              <option value="superintendent">Superintendent</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Date Joined</label>
            <input 
              type="date" 
              value={formData.dateJoined}
              onChange={(e) => setFormData(prev => ({ ...prev, dateJoined: e.target.value }))}
              className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={formData.status}
              onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
              className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Station Assignment */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-3">Station Assignment</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Assigned Station {!noStationException && <span className="text-red-500">*</span>}
            </label>
            <select 
              disabled={noStationException}
              value={formData.stationId}
              onChange={(e) => setFormData(prev => ({ ...prev, stationId: e.target.value }))}
              className={cn(
                "w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white",
                noStationException && "opacity-50 cursor-not-allowed bg-gray-50"
              )}
            >
              <option value="">Select Station</option>
              {stations.map((station) => (
                <option key={station.id} value={station.id}>{station.name}</option>
              ))}
            </select>
          </div>
          <label className="flex items-start gap-2 cursor-pointer">
            <input 
              type="checkbox" 
              checked={noStationException}
              onChange={(e) => {
                setNoStationException(e.target.checked);
                if (e.target.checked) {
                  setFormData(prev => ({ ...prev, stationId: '' }));
                }
              }}
              className="mt-0.5 h-4 w-4 border-gray-300 text-[#1A1F3A] focus:ring-[#1A1F3A]"
            />
            <div>
              <span className="text-xs font-medium text-gray-700">No station assignment (Exception)</span>
              <p className="text-xs text-gray-500 mt-0.5">Check this for officers in special units, HQ staff, or those pending assignment</p>
            </div>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Modal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setFormData(initialFormState);
          setNoStationException(false);
        }}
        onConfirm={handleAddOfficer}
        title="Onboard New Officer"
        confirmText="Onboard Officer"
        size="lg"
      >
        <AddOfficerModalContent />
      </Modal>
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Officers</h1>
          <p className="text-xs text-gray-500">Manage police personnel and assignments</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          style={{ 
            height: '36px', 
            padding: '0 20px', 
            fontSize: '12px',
            fontWeight: 500,
            color: 'white',
            backgroundColor: '#1A1F3A',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <UserPlus className="h-4 w-4" />
          Add Officer
        </button>
      </div>

      {/* Status Filter Tabs - Underline Style */}
      <div className="inline-flex gap-8 border-b-2 border-gray-200">
        {[
          { id: 'all', label: 'All Officers' },
          { id: 'active', label: 'Active' },
          { id: 'inactive', label: 'Inactive' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setStatusFilter(tab.id as any)}
            className={cn(
              'relative py-3 text-sm font-normal transition-colors',
              statusFilter === tab.id
                ? 'text-[#1A1F3A]'
                : 'text-gray-400 hover:text-gray-600'
            )}
          >
            {tab.label}
            {statusFilter === tab.id && (
              <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#1A1F3A]" />
            )}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white p-3 border border-gray-200 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          <input
            type="text"
            placeholder="Search officers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full h-8 pl-8 pr-3 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
          />
        </div>
        <select
          value={stationFilter}
          onChange={(e) => setStationFilter(e.target.value)}
          className="h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
          aria-label="Station filter"
        >
          <option value="all">All Stations</option>
          {stations.map((s) => (
            <option key={s.id} value={s.name}>{s.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable<Officer>
        columns={officerColumns}
        data={filteredOfficers}
        emptyMessage="No officers found"
        onRowClick={(officer) => setSelectedOfficerId(officer.id)}
      />
    </div>
  );
}

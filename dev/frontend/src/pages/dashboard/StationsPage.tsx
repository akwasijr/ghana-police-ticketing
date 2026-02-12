import { useState, useMemo } from 'react';
import { 
  Building2, 
  Search, 
  Plus, 
  MapPin, 
  MoreVertical,
  List,
  Map
} from 'lucide-react';
import { Modal } from '@/components/shared';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { Icon } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { cn } from '@/lib/utils';
import { useJurisdiction } from '@/store/auth.store';
import { useToast } from '@/store/ui.store';
import { MOCK_STATIONS, MOCK_REGIONS, MOCK_DIVISIONS, MOCK_DISTRICTS } from '@/lib/mock-data';
import { matchesJurisdiction } from '@/lib/demo/jurisdiction';

// Fix for default marker icon
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete (Icon.Default.prototype as any)._getIconUrl;
Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export function StationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [divisionFilter, setDivisionFilter] = useState('all');
  const [districtFilter, setDistrictFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [showAddModal, setShowAddModal] = useState(false);

  const jurisdiction = useJurisdiction();
  const toast = useToast();

  // Form state for add modal
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    type: '' as string,
    regionId: '',
    divisionId: '',
    districtId: '',
    address: '',
    latitude: '',
    longitude: '',
    phone: '',
    email: ''
  });

  const handleAddStation = () => {
    if (!formData.name || !formData.code || !formData.regionId) {
      toast.error('Missing Required Fields', 'Please fill in station name, code, and region');
      return;
    }
    
    // In production, this would call an API
    // For now, show success message
    toast.success('Station Added', `${formData.name} has been added successfully`);
    setFormData({
      name: '', code: '', type: '', regionId: '', divisionId: '',
      districtId: '', address: '', latitude: '', longitude: '', phone: '', email: ''
    });
    setShowAddModal(false);
  };

  // Cascading filter logic
  const scopedStations = MOCK_STATIONS.filter((s) => matchesJurisdiction(jurisdiction, s));
  
  // Get available options based on current selections
  const availableRegions = useMemo(() => MOCK_REGIONS, []);
  
  const availableDivisions = useMemo(() => {
    if (regionFilter === 'all') return MOCK_DIVISIONS;
    return MOCK_DIVISIONS.filter(d => d.regionId === regionFilter);
  }, [regionFilter]);
  
  const availableDistricts = useMemo(() => {
    if (divisionFilter === 'all') return MOCK_DISTRICTS;
    return MOCK_DISTRICTS.filter(d => d.divisionId === divisionFilter);
  }, [divisionFilter]);

  // Reset dependent filters when parent changes
  const handleRegionChange = (value: string) => {
    setRegionFilter(value);
    setDivisionFilter('all');
    setDistrictFilter('all');
  };

  const handleDivisionChange = (value: string) => {
    setDivisionFilter(value);
    setDistrictFilter('all');
  };

  const filteredStations = scopedStations.filter(station => {
    const matchesSearch =
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      station.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRegion = regionFilter === 'all' || station.regionId === regionFilter;
    const matchesDivision = divisionFilter === 'all' || station.divisionId === divisionFilter;
    const matchesDistrict = districtFilter === 'all' || station.districtId === districtFilter;
    const matchesStatus = statusFilter === 'all' || (station.isActive ? 'active' : 'inactive') === statusFilter;
    return matchesSearch && matchesRegion && matchesDivision && matchesDistrict && matchesStatus;
  });

  const totalStations = scopedStations.length;
  const activeStations = scopedStations.filter((s) => s.isActive).length;
  const inactiveStations = scopedStations.filter((s) => !s.isActive).length;

  return (
    <div className="space-y-4">
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onConfirm={handleAddStation}
        title="Add New Station"
        confirmText="Add Station"
        size="lg"
      >
        <div className="space-y-6">
          {/* Station Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Station Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Station Name <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g., Accra Central Police Station" 
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Station Code <span className="text-red-500">*</span></label>
                <input 
                  type="text" 
                  placeholder="e.g., ACS-001"
                  value={formData.code}
                  onChange={(e) => setFormData({...formData, code: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Station Type</label>
                <select 
                  value={formData.type}
                  onChange={(e) => setFormData({...formData, type: e.target.value as any})}
                  className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
                >
                  <option value="">Select Type</option>
                  <option value="regional">Regional HQ</option>
                  <option value="divisional">Divisional HQ</option>
                  <option value="district">District Station</option>
                  <option value="patrol">Patrol Station</option>
                </select>
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Region <span className="text-red-500">*</span></label>
                <select 
                  value={formData.regionId}
                  onChange={(e) => setFormData({...formData, regionId: e.target.value, divisionId: '', districtId: ''})}
                  className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
                >
                  <option value="">Select Region</option>
                  {availableRegions.map((r) => (
                    <option key={r.id} value={r.id}>{r.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Division</label>
                <select 
                  value={formData.divisionId}
                  onChange={(e) => setFormData({...formData, divisionId: e.target.value, districtId: ''})}
                  className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
                >
                  <option value="">Select Division</option>
                  {MOCK_DIVISIONS.filter(d => !formData.regionId || d.regionId === formData.regionId).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">District</label>
                <select 
                  value={formData.districtId}
                  onChange={(e) => setFormData({...formData, districtId: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
                >
                  <option value="">Select District</option>
                  {MOCK_DISTRICTS.filter(d => !formData.divisionId || d.divisionId === formData.divisionId).map((d) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Address</label>
                <input 
                  type="text" 
                  placeholder="Street address"
                  value={formData.address}
                  onChange={(e) => setFormData({...formData, address: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Latitude</label>
                <input 
                  type="text" 
                  placeholder="e.g., 5.5560"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Longitude</label>
                <input 
                  type="text" 
                  placeholder="e.g., -0.1969"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phone Number</label>
                <input 
                  type="tel" 
                  placeholder="e.g., 030-2123456"
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Email</label>
                <input 
                  type="email" 
                  placeholder="e.g., accra.central@gps.gov.gh"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full h-9 px-3 text-sm border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" 
                />
              </div>
            </div>
          </div>
        </div>
      </Modal>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Police Stations</h1>
          <p className="text-xs text-gray-500">Manage stations and assignments</p>
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
          <Plus className="h-4 w-4" />
          Add Station
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white p-3 border border-gray-200 space-y-2">
        {/* Search and View Toggle Row */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
            <input
              type="text"
              placeholder="Search stations..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-8 pl-8 pr-3 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
              aria-label="Search stations"
            />
          </div>
          
          {/* View Switcher - Positioned Far Right */}
          <div 
            role="tablist" 
            aria-label="View options"
            className="flex items-center gap-2 ml-auto"
          >
            <button
              onClick={() => setView('list')}
              aria-selected={view === 'list'}
              aria-label="List view"
              style={{ 
                height: '32px', 
                padding: '0 12px', 
                fontSize: '12px',
                fontWeight: 500,
                color: view === 'list' ? 'white' : '#1A1F3A',
                backgroundColor: view === 'list' ? '#1A1F3A' : 'white',
                border: '2px solid #1A1F3A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <List className="h-4 w-4" />
              List
            </button>
            <button
              onClick={() => setView('map')}
              aria-selected={view === 'map'}
              aria-label="Map view"
              style={{ 
                height: '32px', 
                padding: '0 12px', 
                fontSize: '12px',
                fontWeight: 500,
                color: view === 'map' ? 'white' : '#1A1F3A',
                backgroundColor: view === 'map' ? '#1A1F3A' : 'white',
                border: '2px solid #1A1F3A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Map className="h-4 w-4" />
              Map
            </button>
          </div>
        </div>

        {/* Cascading Filters Row */}
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={regionFilter}
            onChange={(e) => handleRegionChange(e.target.value)}
            className="h-8 px-2 text-xs border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#1A1F3A]"
            aria-label="Region filter"
          >
            <option value="all">All Regions</option>
            {availableRegions.map((r) => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          
          <select
            value={divisionFilter}
            onChange={(e) => handleDivisionChange(e.target.value)}
            disabled={regionFilter === 'all'}
            className={cn(
              "h-8 px-2 text-xs border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#1A1F3A]",
              regionFilter === 'all' && "opacity-50 cursor-not-allowed"
            )}
            aria-label="Division filter"
          >
            <option value="all">All Divisions</option>
            {availableDivisions.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            disabled={divisionFilter === 'all'}
            className={cn(
              "h-8 px-2 text-xs border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#1A1F3A]",
              divisionFilter === 'all' && "opacity-50 cursor-not-allowed"
            )}
            aria-label="District filter"
          >
            <option value="all">All Districts</option>
            {availableDistricts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-8 px-2 text-xs border border-gray-200 bg-white text-gray-700 focus:outline-none focus:border-[#1A1F3A]"
            aria-label="Status filter"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Total</p>
          <p className="text-lg font-bold text-gray-900">{totalStations}</p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Active</p>
          <p className="text-lg font-bold text-gray-900">{activeStations}</p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Inactive</p>
          <p className="text-lg font-bold text-gray-900">{inactiveStations}</p>
        </div>
        <div className="bg-white p-3 border border-gray-200">
          <p className="text-xs text-gray-500">Filtered</p>
          <p className="text-lg font-bold text-gray-900">{filteredStations.length}</p>
        </div>
      </div>

      {view === 'map' ? (
        <div className="bg-white border border-gray-200 overflow-hidden">
          <div className="h-[380px]">
            <MapContainer
              center={[5.5600, -0.1900]}
              zoom={12}
              className="h-full w-full"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              {filteredStations.map((station) => (
                <Marker key={station.id} position={[station.latitude!, station.longitude!]}>
                  <Popup>
                    <div className="p-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{station.name}</h3>
                      <p className="text-xs text-gray-500 font-mono">{station.code}</p>
                      <p className="text-[10px] text-gray-500 mt-1">
                        {station.districtName}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {station.divisionName}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        {station.regionName}
                      </p>
                    </div>
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {filteredStations.map((station) => (
            <div key={station.id} className="bg-white border border-gray-200 hover:border-[#1A1F3A] transition-colors">
              <div className="p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-50 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-blue-600" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">{station.name}</h3>
                      <p className="text-[10px] font-mono text-gray-500">{station.code}</p>
                    </div>
                  </div>
                  <button type="button" className="text-gray-400 hover:text-gray-600" aria-label="More options">
                    <MoreVertical className="h-4 w-4" />
                  </button>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="h-3 w-3 text-gray-400 flex-shrink-0" />
                    <span className="truncate">{station.address}</span>
                  </div>
                  <div className="text-[10px] text-gray-500 space-y-0.5">
                    <div>📍 {station.districtName}</div>
                    <div>🏛️ {station.divisionName}</div>
                    <div>🗺️ {station.regionName}</div>
                  </div>
                </div>

                <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className={cn(
                    "px-1.5 py-0.5 text-[10px] font-medium capitalize",
                    station.isActive ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                  )}>
                    {station.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <button className="text-xs font-medium text-[#1A1F3A] hover:underline">
                    View
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

import { useState, useMemo } from 'react';
import { Plus, Search, Edit2, Trash2, MapPin, Phone, ToggleLeft, ToggleRight, X, Check } from 'lucide-react';
import { useStationStore, useToast } from '@/store';
import { ConfirmDialog } from '@/components/shared';

export function StationsPage() {
  const { stations } = useStationStore();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Demo data if store is empty - using type assertion for extended properties
  type ExtendedStation = { id: string; name: string; code: string; address: string; phone: string; regionId: string; regionName: string; divisionName: string; districtName: string; isActive: boolean };
  const demoStations: ExtendedStation[] = stations.length > 0 
    ? stations.map(s => ({ 
        id: s.id, 
        name: s.name, 
        code: s.code, 
        address: s.address, 
        phone: s.phone, 
        regionId: s.regionId, 
        regionName: s.regionName, 
        divisionName: s.divisionName || '', 
        districtName: s.districtName || '', 
        isActive: s.status === 'active' 
      }))
    : [
    { id: 'st-1', name: 'Accra Central Station', code: 'ACC-01', address: 'Ring Road Central, Accra', phone: '0302123456', regionId: 'region-1', regionName: 'Greater Accra', divisionName: 'Accra Metro', districtName: 'Accra Central', isActive: true },
    { id: 'st-2', name: 'Tema Industrial Station', code: 'TEM-01', address: 'Community 1, Tema', phone: '0303456789', regionId: 'region-1', regionName: 'Greater Accra', divisionName: 'Tema Division', districtName: 'Tema Central', isActive: true },
    { id: 'st-3', name: 'Kumasi Central Station', code: 'KUM-01', address: 'Adum, Kumasi', phone: '0322123456', regionId: 'region-2', regionName: 'Ashanti', divisionName: 'Kumasi Metro', districtName: 'Kumasi Central', isActive: true },
    { id: 'st-4', name: 'Obuasi Station', code: 'OBU-01', address: 'Main Street, Obuasi', phone: '0322789456', regionId: 'region-2', regionName: 'Ashanti', divisionName: 'Obuasi Division', districtName: 'Obuasi District', isActive: false },
    { id: 'st-5', name: 'Takoradi Station', code: 'TAK-01', address: 'Market Circle, Takoradi', phone: '0312456789', regionId: 'region-3', regionName: 'Western', divisionName: 'Takoradi Division', districtName: 'Takoradi Central', isActive: true },
  ];

  const regions = useMemo(() => {
    const uniqueRegions = [...new Set(demoStations.map(s => s.regionName))];
    return uniqueRegions.sort();
  }, [demoStations]);

  const filteredStations = useMemo(() => {
    return demoStations.filter(station => {
      const matchesSearch = station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           station.code.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRegion = regionFilter === 'all' || station.regionName === regionFilter;
      const matchesStatus = statusFilter === 'all' || 
                           (statusFilter === 'active' && station.isActive) ||
                           (statusFilter === 'inactive' && !station.isActive);
      return matchesSearch && matchesRegion && matchesStatus;
    });
  }, [demoStations, searchQuery, regionFilter, statusFilter]);

  const handleToggleStatus = (_stationId: string, currentStatus: boolean) => {
    toast.success('Status Updated', `Station ${currentStatus ? 'deactivated' : 'activated'} successfully`);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Police Stations</h1>
          <p className="mt-1 text-sm text-gray-500">Manage all police stations nationwide</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] text-white font-medium hover:bg-[#1A1F3A]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Station
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or code..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
          />
        </div>
        <select
          aria-label="Filter by region"
          value={regionFilter}
          onChange={(e) => setRegionFilter(e.target.value)}
          className="px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
        >
          <option value="all">All Regions</option>
          {regions.map(region => (
            <option key={region} value={region}>{region}</option>
          ))}
        </select>
        <select
          aria-label="Filter by status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-4 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Total Stations</p>
          <p className="text-2xl font-bold text-gray-900">{demoStations.length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Active</p>
          <p className="text-2xl font-bold text-green-600">{demoStations.filter(s => s.isActive).length}</p>
        </div>
        <div className="bg-white border border-gray-200 p-4">
          <p className="text-sm text-gray-500">Inactive</p>
          <p className="text-2xl font-bold text-gray-400">{demoStations.filter(s => !s.isActive).length}</p>
        </div>
      </div>

      {/* Stations Table */}
      <div className="bg-white border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Station</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Code</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Region</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Division</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Contact</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredStations.map((station) => (
                <tr key={station.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-gray-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{station.name}</p>
                        <p className="text-xs text-gray-500">{station.address}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm font-mono text-gray-700">{station.code}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-700">{station.regionName}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-700">{station.divisionName}</span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Phone className="w-3 h-3" />
                      {station.phone}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <button 
                      onClick={() => handleToggleStatus(station.id, station.isActive)}
                      className="flex items-center gap-2"
                    >
                      {station.isActive ? (
                        <>
                          <ToggleRight className="w-6 h-6 text-green-600" />
                          <span className="text-xs font-medium text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <ToggleLeft className="w-6 h-6 text-gray-400" />
                          <span className="text-xs font-medium text-gray-400">Inactive</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-end gap-2">
                      <button title="Edit station" className="p-2 hover:bg-gray-100 text-gray-600">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        title="Delete station"
                        onClick={() => setShowDeleteConfirm(station.id)}
                        className="p-2 hover:bg-gray-100 text-gray-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredStations.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No stations found matching your criteria.
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        title="Delete Station"
        message="Are you sure you want to delete this station? Officers assigned to this station will need to be reassigned."
        confirmText="Delete"
        onConfirm={() => {
          toast.success('Station Deleted', 'The station has been removed');
          setShowDeleteConfirm(null);
        }}
        onClose={() => setShowDeleteConfirm(null)}
      />

      {/* Add Station Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white w-full max-w-md border border-gray-200">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Add New Station</h3>
              <button title="Close" onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={(e) => { e.preventDefault(); toast.success('Station Added', 'New station created successfully'); setShowAddModal(false); }} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Station Name *</label>
                <input type="text" required placeholder="e.g. Accra Central Station" className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Station Code *</label>
                  <input type="text" required placeholder="e.g. ACC-01" className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] font-mono uppercase" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input type="tel" placeholder="0302123456" className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input type="text" placeholder="Station address" className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Region *</label>
                <select aria-label="Select region" required className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white">
                  <option value="">Select Region</option>
                  {regions.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-medium hover:bg-gray-50">Cancel</button>
                <button type="submit" className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1A1F3A] text-white font-medium hover:bg-[#1A1F3A]/90">
                  <Check className="w-4 h-4" /> Add Station
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default StationsPage;

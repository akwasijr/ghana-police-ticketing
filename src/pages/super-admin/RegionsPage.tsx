import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, ChevronDown, ChevronRight, Building2, MapPin, X, Check } from 'lucide-react';
import { useStationStore, useToast } from '@/store';
import { ConfirmDialog } from '@/components/shared';

type ModalType = 'region' | 'division' | 'district' | 'station' | null;

interface AddModalProps {
  type: ModalType;
  parentName?: string;
  onClose: () => void;
  onAdd: (data: any) => void;
}

function AddModal({ type, parentName, onClose, onAdd }: AddModalProps) {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [capital, setCapital] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onAdd({ name, code, capital, address });
  };

  const getTitle = () => {
    switch (type) {
      case 'region': return 'Add New Region';
      case 'division': return `Add Division to ${parentName}`;
      case 'district': return `Add District to ${parentName}`;
      case 'station': return `Add Station to ${parentName}`;
      default: return 'Add';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white w-full max-w-md border border-gray-200">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">{getTitle()}</h3>
          <button onClick={onClose} className="p-2 hover:bg-gray-100" title="Close modal">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === 'region' ? 'e.g. Greater Accra' : type === 'station' ? 'e.g. Accra Central Station' : `Enter ${type} name`}
              className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
              required
            />
          </div>
          
          {type === 'region' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. GAR"
                  maxLength={4}
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Capital City</label>
                <input
                  type="text"
                  value={capital}
                  onChange={(e) => setCapital(e.target.value)}
                  placeholder="e.g. Accra"
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
                />
              </div>
            </>
          )}

          {type === 'station' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Station Code *</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  placeholder="e.g. ACC-01"
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A] font-mono uppercase"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Station address"
                  className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
                />
              </div>
            </>
          )}

          <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-700 font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[#1A1F3A] text-white font-medium hover:bg-[#1A1F3A]/90"
            >
              <Check className="w-4 h-4" /> Add
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RegionsPage() {
  const { regions } = useStationStore();
  const toast = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRegions, setExpandedRegions] = useState<string[]>([]);
  const [expandedDivisions, setExpandedDivisions] = useState<string[]>([]);
  const [expandedDistricts, setExpandedDistricts] = useState<string[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  
  // Modal state
  const [modalType, setModalType] = useState<ModalType>(null);
  const [modalParent, setModalParent] = useState<{ id: string; name: string } | null>(null);

  // Demo data if store is empty
  const [demoRegions, setDemoRegions] = useState(regions.length > 0 ? regions : [
    { id: 'region-1', name: 'Greater Accra', capital: 'Accra', code: 'GAR' },
    { id: 'region-2', name: 'Ashanti', capital: 'Kumasi', code: 'ASH' },
    { id: 'region-3', name: 'Western', capital: 'Sekondi-Takoradi', code: 'WES' },
    { id: 'region-4', name: 'Central', capital: 'Cape Coast', code: 'CEN' },
    { id: 'region-5', name: 'Eastern', capital: 'Koforidua', code: 'EAS' },
  ]);

  const [demoDivisions, setDemoDivisions] = useState<Record<string, Array<{id: string; name: string}>>>({
    'region-1': [
      { id: 'div-1', name: 'Accra Metropolitan Division' },
      { id: 'div-2', name: 'Tema Division' },
    ],
    'region-2': [
      { id: 'div-3', name: 'Kumasi Metropolitan Division' },
      { id: 'div-4', name: 'Obuasi Division' },
    ],
  });

  const [demoDistricts, setDemoDistricts] = useState<Record<string, Array<{id: string; name: string}>>>({
    'div-1': [
      { id: 'dist-1', name: 'Accra Central District' },
      { id: 'dist-2', name: 'Accra East District' },
    ],
    'div-2': [
      { id: 'dist-3', name: 'Tema Central District' },
    ],
  });

  const [demoStations, setDemoStations] = useState<Record<string, Array<{id: string; name: string; code: string; isActive: boolean}>>>({
    'dist-1': [
      { id: 'st-1', name: 'Accra Central Station', code: 'ACC-01', isActive: true },
      { id: 'st-2', name: 'Ring Road Station', code: 'ACC-02', isActive: true },
    ],
    'dist-2': [
      { id: 'st-3', name: 'East Legon Station', code: 'ACC-03', isActive: true },
    ],
  });

  const openAddModal = (type: ModalType, parent?: { id: string; name: string }) => {
    setModalType(type);
    setModalParent(parent || null);
  };

  const handleAdd = (data: any) => {
    const id = `${modalType}-${Date.now()}`;
    
    switch (modalType) {
      case 'region':
        setDemoRegions(prev => [...prev, { id, ...data }]);
        toast.success('Region Added', `${data.name} has been added`);
        break;
      case 'division':
        if (modalParent) {
          setDemoDivisions(prev => ({
            ...prev,
            [modalParent.id]: [...(prev[modalParent.id] || []), { id, name: data.name }]
          }));
          toast.success('Division Added', `${data.name} has been added to ${modalParent.name}`);
        }
        break;
      case 'district':
        if (modalParent) {
          setDemoDistricts(prev => ({
            ...prev,
            [modalParent.id]: [...(prev[modalParent.id] || []), { id, name: data.name }]
          }));
          toast.success('District Added', `${data.name} has been added to ${modalParent.name}`);
        }
        break;
      case 'station':
        if (modalParent) {
          setDemoStations(prev => ({
            ...prev,
            [modalParent.id]: [...(prev[modalParent.id] || []), { id, name: data.name, code: data.code, isActive: true }]
          }));
          toast.success('Station Added', `${data.name} has been added to ${modalParent.name}`);
        }
        break;
    }
    
    setModalType(null);
    setModalParent(null);
  };

  const toggleRegion = (regionId: string) => {
    setExpandedRegions(prev => 
      prev.includes(regionId) ? prev.filter(id => id !== regionId) : [...prev, regionId]
    );
  };

  const toggleDivision = (divisionId: string) => {
    setExpandedDivisions(prev => 
      prev.includes(divisionId) ? prev.filter(id => id !== divisionId) : [...prev, divisionId]
    );
  };

  const toggleDistrict = (districtId: string) => {
    setExpandedDistricts(prev => 
      prev.includes(districtId) ? prev.filter(id => id !== districtId) : [...prev, districtId]
    );
  };

  const filteredRegions = demoRegions.filter(r => 
    r.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Regions & Hierarchy</h1>
          <p className="mt-1 text-sm text-gray-500">Manage regions, divisions, districts, and stations</p>
        </div>
        <button 
          onClick={() => openAddModal('region')}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1F3A] text-white font-medium hover:bg-[#1A1F3A]/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Region
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search regions..."
          className="w-full pl-10 pr-4 py-2 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
        />
      </div>

      {/* Hierarchy Tree */}
      <div className="bg-white border border-gray-200">
        {filteredRegions.map((region) => {
          const isRegionExpanded = expandedRegions.includes(region.id);
          const regionDivisions = demoDivisions[region.id] || [];
          
          return (
            <div key={region.id} className="border-b border-gray-100 last:border-0">
              {/* Region Row */}
              <div className="flex items-center gap-3 p-4 hover:bg-gray-50">
                <button 
                  onClick={() => toggleRegion(region.id)}
                  className="p-1 hover:bg-gray-200"
                  title="Toggle region"
                >
                  {isRegionExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-600" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                <div className="w-8 h-8 bg-[#1A1F3A] flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-[#F9A825]" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{region.name}</p>
                  <p className="text-xs text-gray-500">Capital: {region.capital} • Code: {region.code}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button 
                    title="Add division"
                    onClick={() => openAddModal('division', { id: region.id, name: region.name })}
                    className="p-2 hover:bg-gray-200 text-[#1A1F3A]"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  <button title="Edit region" className="p-2 hover:bg-gray-200 text-gray-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button 
                    title="Delete region"
                    onClick={() => setShowDeleteConfirm(region.id)}
                    className="p-2 hover:bg-gray-200 text-gray-600"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Divisions */}
              {isRegionExpanded && (
                <>
                  {regionDivisions.map((division) => {
                    const isDivisionExpanded = expandedDivisions.includes(division.id);
                    const divisionDistricts = demoDistricts[division.id] || [];

                    return (
                      <div key={division.id} className="ml-8 border-l border-gray-200">
                        {/* Division Row */}
                        <div className="flex items-center gap-3 p-3 hover:bg-gray-50">
                          <button 
                            onClick={() => toggleDivision(division.id)}
                            className="p-1 hover:bg-gray-200"
                            title="Toggle division"
                          >
                            {isDivisionExpanded ? (
                              <ChevronDown className="w-4 h-4 text-gray-600" />
                            ) : (
                              <ChevronRight className="w-4 h-4 text-gray-600" />
                            )}
                          </button>
                          <div className="w-6 h-6 bg-gray-200 flex items-center justify-center">
                            <span className="text-xs font-medium text-gray-600">D</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900 text-sm">{division.name}</p>
                          </div>
                          <button 
                            title="Add district"
                            onClick={() => openAddModal('district', { id: division.id, name: division.name })}
                            className="p-1 hover:bg-gray-200 text-[#1A1F3A]"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                          <button title="Edit division" className="p-1 hover:bg-gray-200 text-gray-500">
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>

                        {/* Districts */}
                        {isDivisionExpanded && (
                          <>
                            {divisionDistricts.map((district) => {
                              const isDistrictExpanded = expandedDistricts.includes(district.id);
                              const districtStations = demoStations[district.id] || [];

                              return (
                                <div key={district.id} className="ml-8 border-l border-gray-100">
                                  {/* District Row */}
                                  <div className="flex items-center gap-3 p-2 hover:bg-gray-50">
                                    <button 
                                      onClick={() => toggleDistrict(district.id)}
                                      className="p-1 hover:bg-gray-200"
                                      title="Toggle district"
                                    >
                                      {isDistrictExpanded ? (
                                        <ChevronDown className="w-3 h-3 text-gray-500" />
                                      ) : (
                                        <ChevronRight className="w-3 h-3 text-gray-500" />
                                      )}
                                    </button>
                                    <div className="w-5 h-5 bg-gray-100 flex items-center justify-center">
                                      <span className="text-xs text-gray-500">d</span>
                                    </div>
                                    <p className="flex-1 text-sm text-gray-700">{district.name}</p>
                                    <span className="text-xs text-gray-400">{districtStations.length} stations</span>
                                    <button 
                                      title="Add station"
                                      onClick={() => openAddModal('station', { id: district.id, name: district.name })}
                                      className="p-1 hover:bg-gray-200 text-[#1A1F3A]"
                                    >
                                      <Plus className="w-3 h-3" />
                                    </button>
                                  </div>

                                  {/* Stations */}
                                  {isDistrictExpanded && districtStations.map((station) => (
                                    <div key={station.id} className="ml-8 flex items-center gap-3 p-2 pl-4 hover:bg-gray-50 border-l border-gray-50">
                                      <Building2 className="w-4 h-4 text-gray-400" />
                                      <p className="flex-1 text-sm text-gray-600">{station.name}</p>
                                      <span className="text-xs text-gray-400">{station.code}</span>
                                      <span className={`text-xs px-2 py-0.5 ${station.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                        {station.isActive ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </>
                        )}
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          );
        })}

        {filteredRegions.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No regions found matching your search.
          </div>
        )}
      </div>

      {/* Add Modal */}
      {modalType && (
        <AddModal
          type={modalType}
          parentName={modalParent?.name}
          onClose={() => { setModalType(null); setModalParent(null); }}
          onAdd={handleAdd}
        />
      )}

      <ConfirmDialog
        isOpen={!!showDeleteConfirm}
        title="Delete Region"
        message="Are you sure you want to delete this region? This will also remove all associated divisions, districts, and stations."
        confirmText="Delete"
        onConfirm={() => {
          setDemoRegions(prev => prev.filter(r => r.id !== showDeleteConfirm));
          toast.success('Region Deleted', 'Region and all sub-items removed');
          setShowDeleteConfirm(null);
        }}
        onClose={() => setShowDeleteConfirm(null)}
      />
    </div>
  );
}

export default RegionsPage;

// Station Store - for managing police stations and hierarchy

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export interface Region {
  id: string;
  name: string;
  code: string;
  capital?: string;
}

export interface Division {
  id: string;
  name: string;
  regionId: string;
}

export interface District {
  id: string;
  name: string;
  divisionId: string;
  regionId: string;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  regionId: string;
  regionName: string;
  divisionId: string;
  divisionName: string;
  districtId: string;
  districtName: string;
  address: string;
  phone: string;
  email?: string;
  lat: number;
  lng: number;
  officers: number;
  status: 'active' | 'maintenance' | 'inactive';
  type: 'HQ' | 'District' | 'Outpost';
  createdAt: string;
  updatedAt: string;
}

export interface StationFilters {
  search?: string;
  status?: Station['status'] | Station['status'][];
  type?: Station['type'] | Station['type'][];
  regionId?: string;
  divisionId?: string;
  districtId?: string;
}

// Demo data
const DEMO_REGIONS: Region[] = [
  { id: 'ga', name: 'Greater Accra', code: 'GA', capital: 'Accra' },
  { id: 'as', name: 'Ashanti', code: 'AS', capital: 'Kumasi' },
  { id: 'wr', name: 'Western', code: 'WR', capital: 'Sekondi-Takoradi' },
  { id: 'er', name: 'Eastern', code: 'ER', capital: 'Koforidua' },
  { id: 'cr', name: 'Central', code: 'CR', capital: 'Cape Coast' },
];

const DEMO_DIVISIONS: Division[] = [
  { id: 'ga-accra-metro', name: 'Accra Metropolitan Division', regionId: 'ga' },
  { id: 'ga-tema', name: 'Tema Division', regionId: 'ga' },
  { id: 'as-kumasi-metro', name: 'Kumasi Metropolitan Division', regionId: 'as' },
  { id: 'wr-sekondi', name: 'Sekondi-Takoradi Division', regionId: 'wr' },
];

const DEMO_DISTRICTS: District[] = [
  { id: 'ga-accra-central', name: 'Accra Central District', divisionId: 'ga-accra-metro', regionId: 'ga' },
  { id: 'ga-accra-east', name: 'Accra East District', divisionId: 'ga-accra-metro', regionId: 'ga' },
  { id: 'ga-tema-central', name: 'Tema Central District', divisionId: 'ga-tema', regionId: 'ga' },
  { id: 'as-kumasi-central', name: 'Kumasi Central District', divisionId: 'as-kumasi-metro', regionId: 'as' },
  { id: 'wr-sekondi-central', name: 'Sekondi Central District', divisionId: 'wr-sekondi', regionId: 'wr' },
];

const DEMO_STATIONS: Station[] = [
  {
    id: 'st-accra-central',
    name: 'Accra Central Station',
    code: 'GPS-GA-ACC-001',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    address: 'Kwame Nkrumah Avenue, Accra',
    phone: '030 266 4611',
    email: 'accra.central@gps.gov.gh',
    lat: 5.55,
    lng: -0.2,
    officers: 45,
    status: 'active',
    type: 'HQ',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'st-osu',
    name: 'Osu Police Station',
    code: 'GPS-GA-ACC-002',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    address: 'Cantonments Rd, Osu',
    phone: '030 277 5739',
    lat: 5.556,
    lng: -0.183,
    officers: 28,
    status: 'active',
    type: 'District',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'st-airport',
    name: 'Airport Police Station',
    code: 'GPS-GA-ACC-003',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    address: 'Liberation Rd, Airport City',
    phone: '030 277 7592',
    lat: 5.603,
    lng: -0.17,
    officers: 32,
    status: 'active',
    type: 'District',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'st-nima',
    name: 'Nima Police Station',
    code: 'GPS-GA-ACC-004',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-east',
    districtName: 'Accra East District',
    address: 'Nima Hwy, Accra',
    phone: '030 222 2333',
    lat: 5.578,
    lng: -0.195,
    officers: 30,
    status: 'maintenance',
    type: 'District',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'st-cantonments',
    name: 'Cantonments Station',
    code: 'GPS-GA-ACC-005',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-east',
    districtName: 'Accra East District',
    address: 'Circular Rd, Cantonments',
    phone: '030 277 6655',
    lat: 5.585,
    lng: -0.16,
    officers: 25,
    status: 'active',
    type: 'District',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'st-tema',
    name: 'Tema Community 1 Station',
    code: 'GPS-GA-TEM-001',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-tema',
    divisionName: 'Tema Division',
    districtId: 'ga-tema-central',
    districtName: 'Tema Central District',
    address: 'Community 1, Tema',
    phone: '030 220 1234',
    lat: 5.67,
    lng: 0.0,
    officers: 35,
    status: 'active',
    type: 'HQ',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'st-kumasi',
    name: 'Kumasi Central Station',
    code: 'GPS-AS-KUM-001',
    regionId: 'as',
    regionName: 'Ashanti',
    divisionId: 'as-kumasi-metro',
    divisionName: 'Kumasi Metropolitan Division',
    districtId: 'as-kumasi-central',
    districtName: 'Kumasi Central District',
    address: 'Adum, Kumasi',
    phone: '032 202 2345',
    lat: 6.687,
    lng: -1.624,
    officers: 52,
    status: 'active',
    type: 'HQ',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'st-sekondi',
    name: 'Sekondi Central Station',
    code: 'GPS-WR-SEK-001',
    regionId: 'wr',
    regionName: 'Western',
    divisionId: 'wr-sekondi',
    divisionName: 'Sekondi-Takoradi Division',
    districtId: 'wr-sekondi-central',
    districtName: 'Sekondi Central District',
    address: 'Market Circle, Sekondi',
    phone: '031 204 5678',
    lat: 4.94,
    lng: -1.71,
    officers: 38,
    status: 'active',
    type: 'HQ',
    createdAt: '2020-01-01T00:00:00.000Z',
    updatedAt: new Date().toISOString(),
  },
];

interface StationStats {
  total: number;
  active: number;
  maintenance: number;
  inactive: number;
  totalOfficers: number;
  byType: {
    HQ: number;
    District: number;
    Outpost: number;
  };
  byRegion: Record<string, number>;
}

interface StationState {
  // State
  stations: Station[];
  regions: Region[];
  divisions: Division[];
  districts: District[];
  selectedStation: Station | null;
  filters: StationFilters;
  isLoading: boolean;
  error: string | null;
  
  // Actions - Station CRUD
  setStations: (stations: Station[]) => void;
  addStation: (station: Omit<Station, 'id' | 'createdAt' | 'updatedAt'>) => Station;
  updateStation: (id: string, updates: Partial<Station>) => void;
  deleteStation: (id: string) => void;
  
  // Actions - Selection
  setSelectedStation: (station: Station | null) => void;
  selectStationById: (id: string) => void;
  
  // Actions - Filters
  setFilters: (filters: StationFilters) => void;
  clearFilters: () => void;
  
  // Actions - Status
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - Station Status
  setStationStatus: (id: string, status: Station['status']) => void;
  updateOfficerCount: (id: string, count: number) => void;
  
  // Getters - Hierarchy
  getRegions: () => Region[];
  getDivisionsByRegion: (regionId: string) => Division[];
  getDistrictsByDivision: (divisionId: string) => District[];
  getStationsByDistrict: (districtId: string) => Station[];
  getStationsByRegion: (regionId: string) => Station[];
  
  // Getters - Filtered
  getFilteredStations: () => Station[];
  getActiveStations: () => Station[];
  
  // Getters - Stats
  getStationStats: () => StationStats;
  getTotalOfficers: () => number;
  
  // Getters - Single
  getStationById: (id: string) => Station | undefined;
  getStationByCode: (code: string) => Station | undefined;
}

// Helper to generate IDs
const generateId = () => `st-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

export const useStationStore = create<StationState>()(
  persist(
    (set, get) => ({
      // Initial state
      stations: DEMO_STATIONS,
      regions: DEMO_REGIONS,
      divisions: DEMO_DIVISIONS,
      districts: DEMO_DISTRICTS,
      selectedStation: null,
      filters: {},
      isLoading: false,
      error: null,
      
      // Station CRUD
      setStations: (stations) => set({ stations }),
      
      addStation: (stationData) => {
        const now = new Date().toISOString();
        const newStation: Station = {
          ...stationData,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        
        set((state) => ({
          stations: [...state.stations, newStation],
        }));
        
        return newStation;
      },
      
      updateStation: (id, updates) => {
        set((state) => ({
          stations: state.stations.map((s) =>
            s.id === id ? { ...s, ...updates, updatedAt: new Date().toISOString() } : s
          ),
          selectedStation:
            state.selectedStation?.id === id
              ? { ...state.selectedStation, ...updates }
              : state.selectedStation,
        }));
      },
      
      deleteStation: (id) => {
        set((state) => ({
          stations: state.stations.filter((s) => s.id !== id),
          selectedStation:
            state.selectedStation?.id === id ? null : state.selectedStation,
        }));
      },
      
      // Selection
      setSelectedStation: (station) => set({ selectedStation: station }),
      
      selectStationById: (id) => {
        const station = get().stations.find((s) => s.id === id) || null;
        set({ selectedStation: station });
      },
      
      // Filters
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),
      
      // Status
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      // Station Status
      setStationStatus: (id, status) => {
        get().updateStation(id, { status });
      },
      
      updateOfficerCount: (id, count) => {
        get().updateStation(id, { officers: count });
      },
      
      // Hierarchy Getters
      getRegions: () => get().regions,
      
      getDivisionsByRegion: (regionId) => {
        return get().divisions.filter((d) => d.regionId === regionId);
      },
      
      getDistrictsByDivision: (divisionId) => {
        return get().districts.filter((d) => d.divisionId === divisionId);
      },
      
      getStationsByDistrict: (districtId) => {
        return get().stations.filter((s) => s.districtId === districtId);
      },
      
      getStationsByRegion: (regionId) => {
        return get().stations.filter((s) => s.regionId === regionId);
      },
      
      // Filtered Getters
      getFilteredStations: () => {
        const { stations, filters } = get();
        
        return stations.filter((station) => {
          // Search filter
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesSearch =
              station.name.toLowerCase().includes(search) ||
              station.code.toLowerCase().includes(search) ||
              station.address.toLowerCase().includes(search) ||
              station.phone.includes(search);
            if (!matchesSearch) return false;
          }
          
          // Status filter
          if (filters.status) {
            const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
            if (!statuses.includes(station.status)) return false;
          }
          
          // Type filter
          if (filters.type) {
            const types = Array.isArray(filters.type) ? filters.type : [filters.type];
            if (!types.includes(station.type)) return false;
          }
          
          // Region filter
          if (filters.regionId && station.regionId !== filters.regionId) {
            return false;
          }
          
          // Division filter
          if (filters.divisionId && station.divisionId !== filters.divisionId) {
            return false;
          }
          
          // District filter
          if (filters.districtId && station.districtId !== filters.districtId) {
            return false;
          }
          
          return true;
        });
      },
      
      getActiveStations: () => {
        return get().stations.filter((s) => s.status === 'active');
      },
      
      // Stats
      getStationStats: () => {
        const stations = get().stations;
        
        const stats: StationStats = {
          total: stations.length,
          active: stations.filter((s) => s.status === 'active').length,
          maintenance: stations.filter((s) => s.status === 'maintenance').length,
          inactive: stations.filter((s) => s.status === 'inactive').length,
          totalOfficers: stations.reduce((sum, s) => sum + s.officers, 0),
          byType: {
            HQ: stations.filter((s) => s.type === 'HQ').length,
            District: stations.filter((s) => s.type === 'District').length,
            Outpost: stations.filter((s) => s.type === 'Outpost').length,
          },
          byRegion: {},
        };
        
        // Count by region
        get().regions.forEach((region) => {
          stats.byRegion[region.id] = stations.filter((s) => s.regionId === region.id).length;
        });
        
        return stats;
      },
      
      getTotalOfficers: () => {
        return get().stations.reduce((sum, s) => sum + s.officers, 0);
      },
      
      // Single Getters
      getStationById: (id) => {
        return get().stations.find((s) => s.id === id);
      },
      
      getStationByCode: (code) => {
        return get().stations.find((s) => s.code === code);
      },
    }),
    {
      name: 'ghana-police-stations',
      partialize: (state) => ({
        stations: state.stations,
        regions: state.regions,
        divisions: state.divisions,
        districts: state.districts,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useStations = () => useStationStore((state) => state.stations);
export const useRegions = () => useStationStore((state) => state.regions);
export const useDivisions = () => useStationStore((state) => state.divisions);
export const useDistricts = () => useStationStore((state) => state.districts);
export const useSelectedStation = () => useStationStore((state) => state.selectedStation);
export const useActiveStations = () => useStationStore((state) => 
  state.stations.filter(s => s.status === 'active')
);

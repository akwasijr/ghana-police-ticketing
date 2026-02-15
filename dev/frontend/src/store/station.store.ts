// Station Store - for managing police stations and hierarchy

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { regionsAPI, divisionsAPI, districtsAPI, stationsAPI } from '@/lib/api/hierarchy.api';

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

  // API fetch actions
  fetchRegions: () => Promise<void>;
  fetchDivisions: () => Promise<void>;
  fetchDistricts: () => Promise<void>;
  fetchStations: () => Promise<void>;

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
      // Initial state - empty arrays, loaded from API
      stations: [],
      regions: [],
      divisions: [],
      districts: [],
      selectedStation: null,
      filters: {},
      isLoading: false,
      error: null,

      // API fetch actions
      fetchRegions: async () => {
        set({ isLoading: true });
        try {
          const apiRegions = await regionsAPI.list();
          const regions: Region[] = apiRegions.map((r) => ({
            id: r.id,
            name: r.name,
            code: r.code,
            capital: r.capital,
          }));
          set({ regions, isLoading: false, error: null });
        } catch {
          set({ isLoading: false });
        }
      },

      fetchDivisions: async () => {
        set({ isLoading: true });
        try {
          const apiDivisions = await divisionsAPI.list();
          const divisions: Division[] = apiDivisions.map((d) => ({
            id: d.id,
            name: d.name,
            regionId: d.regionId,
          }));
          set({ divisions, isLoading: false, error: null });
        } catch {
          set({ isLoading: false });
        }
      },

      fetchDistricts: async () => {
        set({ isLoading: true });
        try {
          const apiDistricts = await districtsAPI.list();
          const districts: District[] = apiDistricts.map((d) => ({
            id: d.id,
            name: d.name,
            divisionId: d.divisionId,
            regionId: d.regionId,
          }));
          set({ districts, isLoading: false, error: null });
        } catch {
          set({ isLoading: false });
        }
      },

      fetchStations: async () => {
        set({ isLoading: true });
        try {
          const response = await stationsAPI.list();
          const stations: Station[] = response.items.map((s) => ({
            id: s.id,
            name: s.name,
            code: s.code,
            regionId: s.regionId,
            regionName: s.regionName || '',
            divisionId: s.divisionId,
            divisionName: s.divisionName || '',
            districtId: s.districtId,
            districtName: s.districtName || '',
            address: s.address || '',
            phone: s.phone || '',
            lat: s.latitude || 0,
            lng: s.longitude || 0,
            officers: 0,
            status: s.isActive ? 'active' : 'inactive',
            type: (s.type as Station['type']) || 'District',
            createdAt: s.createdAt,
            updatedAt: s.createdAt,
          }));
          set({ stations, isLoading: false, error: null });
        } catch {
          set({ isLoading: false });
        }
      },

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

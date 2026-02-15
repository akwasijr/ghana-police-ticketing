// Hierarchy API (Regions, Divisions, Districts, Stations)

import { api, apiPaginated, buildParams } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/api.types';

// Region types (match backend JSON)
export interface Region {
  id: string;
  name: string;
  code: string;
  capital?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Division {
  id: string;
  name: string;
  code: string;
  regionId: string;
  regionName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface District {
  id: string;
  name: string;
  code: string;
  divisionId: string;
  divisionName?: string;
  regionId: string;
  regionName?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  districtId: string;
  districtName?: string;
  divisionId: string;
  divisionName?: string;
  regionId: string;
  regionName?: string;
  latitude?: number;
  longitude?: number;
  type?: string;
  isActive: boolean;
  createdAt: string;
}

export interface StationStats {
  totalStations: number;
  activeStations: number;
  byRegion: Array<{ regionId: string; regionName: string; count: number }>;
}

// Regions
export const regionsAPI = {
  async list(): Promise<Region[]> {
    return api.get<Region[]>('/regions');
  },
  async getById(id: string): Promise<Region> {
    return api.get<Region>(`/regions/${id}`);
  },
  async create(data: { name: string; code: string; capital?: string }): Promise<Region> {
    return api.post<Region>('/regions', data);
  },
  async update(id: string, data: Partial<Region>): Promise<Region> {
    return api.put<Region>(`/regions/${id}`, data);
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/regions/${id}`);
  },
};

// Divisions
export const divisionsAPI = {
  async list(regionId?: string): Promise<Division[]> {
    const qs = regionId ? `?regionId=${regionId}` : '';
    return api.get<Division[]>(`/divisions${qs}`);
  },
  async getById(id: string): Promise<Division> {
    return api.get<Division>(`/divisions/${id}`);
  },
  async create(data: { name: string; code: string; regionId: string }): Promise<Division> {
    return api.post<Division>('/divisions', data);
  },
  async update(id: string, data: Partial<Division>): Promise<Division> {
    return api.put<Division>(`/divisions/${id}`, data);
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/divisions/${id}`);
  },
};

// Districts
export const districtsAPI = {
  async list(divisionId?: string): Promise<District[]> {
    const qs = divisionId ? `?divisionId=${divisionId}` : '';
    return api.get<District[]>(`/districts${qs}`);
  },
  async getById(id: string): Promise<District> {
    return api.get<District>(`/districts/${id}`);
  },
  async create(data: { name: string; code: string; divisionId: string }): Promise<District> {
    return api.post<District>('/districts', data);
  },
  async update(id: string, data: Partial<District>): Promise<District> {
    return api.put<District>(`/districts/${id}`, data);
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/districts/${id}`);
  },
};

// Stations
export const stationsAPI = {
  async list(
    filters?: { regionId?: string; districtId?: string; isActive?: boolean },
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Station>> {
    const qs = buildParams(filters as Record<string, unknown>, pagination);
    return apiPaginated<Station>(`/stations?${qs}`);
  },
  async getById(id: string): Promise<Station> {
    return api.get<Station>(`/stations/${id}`);
  },
  async getStats(): Promise<StationStats> {
    return api.get<StationStats>('/stations/stats');
  },
  async create(data: { name: string; code: string; districtId: string; address?: string; phone?: string; latitude?: number; longitude?: number; type?: string }): Promise<Station> {
    return api.post<Station>('/stations', data);
  },
  async update(id: string, data: Partial<Station>): Promise<Station> {
    return api.put<Station>(`/stations/${id}`, data);
  },
  async delete(id: string): Promise<void> {
    await api.delete(`/stations/${id}`);
  },
};

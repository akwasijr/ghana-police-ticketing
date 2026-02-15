// Officers API

import { api, apiPaginated, buildParams } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { Officer, OfficerFilters, OfficerStats, CreateOfficerInput, UpdateOfficerInput } from '@/types/officer.types';

export const officersAPI = {
  async list(
    filters?: OfficerFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Officer>> {
    const qs = buildParams(filters as Record<string, unknown>, pagination);
    return apiPaginated<Officer>(`/officers?${qs}`);
  },

  async getById(id: string): Promise<Officer> {
    return api.get<Officer>(`/officers/${id}`);
  },

  async getStats(id: string): Promise<OfficerStats> {
    return api.get<OfficerStats>(`/officers/${id}/stats`);
  },

  async create(data: CreateOfficerInput): Promise<Officer> {
    return api.post<Officer>('/officers', data);
  },

  async update(id: string, data: Partial<UpdateOfficerInput>): Promise<Officer> {
    return api.put<Officer>(`/officers/${id}`, data);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/officers/${id}`);
  },

  async resetPassword(id: string): Promise<{ temporaryPassword: string }> {
    return api.post<{ temporaryPassword: string }>(`/officers/${id}/reset-password`);
  },
};

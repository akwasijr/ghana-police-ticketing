// Objections API

import { api, apiPaginated, buildParams } from './client';
import type { PaginatedResponse, PaginationParams, FileObjectionRequest, FileObjectionResponse, ProcessObjectionRequest } from '@/types/api.types';
import type { Objection, ObjectionFilters, ObjectionStats } from '@/types/objection.types';

export const objectionsAPI = {
  async file(data: FileObjectionRequest): Promise<FileObjectionResponse> {
    return api.post<FileObjectionResponse>('/objections', data);
  },

  async list(
    filters?: ObjectionFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Objection>> {
    const qs = buildParams(filters as Record<string, unknown>, pagination);
    return apiPaginated<Objection>(`/objections?${qs}`);
  },

  async getById(id: string): Promise<Objection> {
    return api.get<Objection>(`/objections/${id}`);
  },

  async review(id: string, data: ProcessObjectionRequest): Promise<Objection> {
    return api.post<Objection>(`/objections/${id}/review`, data);
  },

  async getStats(): Promise<ObjectionStats> {
    return api.get<ObjectionStats>('/objections/stats');
  },
};

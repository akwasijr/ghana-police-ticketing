// Audit Logs API

import { api, apiPaginated, buildParams } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/api.types';
import type { AuditLog, AuditFilters, AuditStats } from '@/types/audit.types';

export const auditAPI = {
  async list(
    filters?: AuditFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<AuditLog>> {
    const qs = buildParams(filters as Record<string, unknown>, pagination);
    return apiPaginated<AuditLog>(`/audit/logs?${qs}`);
  },

  async getById(id: string): Promise<AuditLog> {
    return api.get<AuditLog>(`/audit/logs/${id}`);
  },

  async getStats(): Promise<AuditStats> {
    return api.get<AuditStats>('/audit/stats');
  },
};

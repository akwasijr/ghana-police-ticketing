// Offences API

import { api } from './client';
import type { Offence, OffenceFormData } from '@/types/offence.types';

export const offencesAPI = {
  async list(): Promise<Offence[]> {
    return api.get<Offence[]>('/offences');
  },

  async getById(id: string): Promise<Offence> {
    return api.get<Offence>(`/offences/${id}`);
  },

  async create(data: OffenceFormData): Promise<Offence> {
    return api.post<Offence>('/offences', data);
  },

  async update(id: string, data: Partial<OffenceFormData>): Promise<Offence> {
    return api.put<Offence>(`/offences/${id}`, data);
  },

  async toggle(id: string): Promise<Offence> {
    return api.patch<Offence>(`/offences/${id}/toggle`);
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/offences/${id}`);
  },
};

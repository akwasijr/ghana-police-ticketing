// Settings API

import { api } from './client';

export interface SystemSettings {
  [section: string]: Record<string, unknown>;
}

export const settingsAPI = {
  async getAll(): Promise<SystemSettings> {
    return api.get<SystemSettings>('/settings');
  },

  async getSection(section: string): Promise<Record<string, unknown>> {
    return api.get<Record<string, unknown>>(`/settings/${section}`);
  },

  async updateAll(data: SystemSettings): Promise<SystemSettings> {
    return api.put<SystemSettings>('/settings', data);
  },

  async updateSection(section: string, data: Record<string, unknown>): Promise<Record<string, unknown>> {
    return api.put<Record<string, unknown>>(`/settings/${section}`, data);
  },
};

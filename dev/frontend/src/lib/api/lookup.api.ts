// Lookup Data API

import { api } from './client';
import type { LookupDataResponse } from '@/types/api.types';

export const lookupAPI = {
  async getAll(): Promise<LookupDataResponse> {
    return api.get<LookupDataResponse>('/lookup');
  },
};

// Sync API

import { api } from './client';
import type { SyncRequest, SyncResponse } from '@/types/api.types';

export interface DeviceSyncStatus {
  deviceId: string;
  lastSyncAt?: string;
  pendingCount: number;
  failedCount: number;
}

export const syncAPI = {
  async sync(data: SyncRequest): Promise<SyncResponse> {
    return api.post<SyncResponse>('/sync', data);
  },

  async getStatus(): Promise<DeviceSyncStatus> {
    return api.get<DeviceSyncStatus>('/sync/status');
  },
};

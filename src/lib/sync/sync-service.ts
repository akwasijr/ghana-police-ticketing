// Sync Service - Background data synchronization for offline-first PWA

import { db, STORES } from '@/lib/database/db';
import type { SyncQueueItem, SyncLogEntry } from '@/lib/database/schema';
import { registerBackgroundSync } from '@/lib/pwa/registration';

// Sync configuration
const SYNC_CONFIG = {
  MAX_RETRIES: 5,
  RETRY_DELAY_MS: 1000,
  BATCH_SIZE: 10,
  SYNC_INTERVAL_MS: 30000, // 30 seconds
};

// API endpoints (to be configured)
const API_ENDPOINTS = {
  tickets: '/api/tickets',
  photos: '/api/photos',
  payments: '/api/payments',
};

// Sync status
interface SyncStatus {
  isRunning: boolean;
  lastSync: string | null;
  pendingCount: number;
  failedCount: number;
  progress: number;
}

class SyncService {
  private isRunning = false;
  private syncInterval: number | null = null;
  private listeners: Set<(status: SyncStatus) => void> = new Set();

  // Get current sync status
  async getStatus(): Promise<SyncStatus> {
    const pendingItems = await db.query<SyncQueueItem>(STORES.SYNC_QUEUE, {
      index: 'status',
      range: IDBKeyRange.only('pending'),
    });
    
    const failedItems = await db.query<SyncQueueItem>(STORES.SYNC_QUEUE, {
      index: 'status',
      range: IDBKeyRange.only('failed'),
    });

    const logs = await db.query<SyncLogEntry>(STORES.SYNC_LOGS, {
      index: 'type',
      range: IDBKeyRange.only('sync_complete'),
      direction: 'prev',
      limit: 1,
    });

    return {
      isRunning: this.isRunning,
      lastSync: logs[0]?.timestamp || null,
      pendingCount: pendingItems.length,
      failedCount: failedItems.length,
      progress: 0,
    };
  }

  // Add item to sync queue
  async addToQueue(
    operation: SyncQueueItem['operation'],
    entityType: SyncQueueItem['entityType'],
    entityId: string,
    payload: any,
    priority: SyncQueueItem['priority'] = 3
  ): Promise<void> {
    const item: SyncQueueItem = {
      operation,
      entityType,
      entityId,
      payload,
      priority,
      status: 'pending',
      attempts: 0,
      maxAttempts: SYNC_CONFIG.MAX_RETRIES,
      createdAt: new Date().toISOString(),
    };

    await db.add(STORES.SYNC_QUEUE, item);
    
    // Trigger background sync if online
    if (navigator.onLine) {
      await registerBackgroundSync('sync-tickets');
    }
  }

  // Process sync queue
  async processQueue(): Promise<{ success: number; failed: number }> {
    if (this.isRunning) {
      console.log('[Sync] Already running, skipping');
      return { success: 0, failed: 0 };
    }

    if (!navigator.onLine) {
      console.log('[Sync] Offline, skipping sync');
      return { success: 0, failed: 0 };
    }

    this.isRunning = true;
    const startTime = Date.now();
    let success = 0;
    let failed = 0;

    // Log sync start
    await this.logSync('sync_start', 'Starting sync process');
    this.notifyListeners();

    try {
      // Get pending items, sorted by priority
      const pendingItems = await db.query<SyncQueueItem>(STORES.SYNC_QUEUE, {
        index: 'status',
        range: IDBKeyRange.only('pending'),
        limit: SYNC_CONFIG.BATCH_SIZE,
      });

      // Sort by priority (1 is highest)
      pendingItems.sort((a, b) => a.priority - b.priority);

      console.log(`[Sync] Processing ${pendingItems.length} items`);

      for (const item of pendingItems) {
        try {
          await this.processItem(item);
          await db.put(STORES.SYNC_QUEUE, { ...item, status: 'completed' as const, processedAt: new Date().toISOString() });
          success++;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';
          const newAttempts = item.attempts + 1;
          
          await db.put(STORES.SYNC_QUEUE, {
            ...item,
            status: newAttempts >= item.maxAttempts ? 'failed' as const : 'pending' as const,
            attempts: newAttempts,
            lastError: errorMessage,
          });
          
          if (newAttempts >= item.maxAttempts) {
            failed++;
            await this.logSync('sync_error', `Failed after ${newAttempts} attempts: ${errorMessage}`);
          }
        }
      }

      // Clean up completed items older than 24 hours
      await this.cleanupCompleted();

      // Log sync completion
      const duration = Date.now() - startTime;
      await this.logSync('sync_complete', `Sync completed: ${success} success, ${failed} failed`, success + failed, duration);

    } catch (error) {
      console.error('[Sync] Process error:', error);
      await this.logSync('sync_error', `Sync process error: ${error}`);
    } finally {
      this.isRunning = false;
      this.notifyListeners();
    }

    return { success, failed };
  }

  // Process individual sync item
  private async processItem(item: SyncQueueItem): Promise<void> {
    const endpoint = (API_ENDPOINTS as any)[item.entityType];
    if (!endpoint) {
      throw new Error(`Unknown entity type: ${item.entityType}`);
    }

    // Get auth token
    const authData = localStorage.getItem('auth-storage');
    const token = authData ? JSON.parse(authData)?.state?.token : null;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    let response: Response;

    switch (item.operation) {
      case 'create':
        response = await fetch(endpoint, {
          method: 'POST',
          headers,
          body: JSON.stringify(item.payload),
        });
        break;

      case 'update':
        response = await fetch(`${endpoint}/${item.entityId}`, {
          method: 'PUT',
          headers,
          body: JSON.stringify(item.payload),
        });
        break;

      case 'delete':
        response = await fetch(`${endpoint}/${item.entityId}`, {
          method: 'DELETE',
          headers,
        });
        break;

      case 'upload':
        // For photo uploads, use FormData
        if (item.entityType === 'photo') {
          const photo = await db.get<any>(STORES.PHOTOS, item.entityId);
          if (!photo?.blob) {
            throw new Error('Photo blob not found');
          }

          const formData = new FormData();
          formData.append('file', photo.blob, `${item.entityId}.jpg`);
          formData.append('ticketId', photo.ticketId);
          formData.append('type', photo.type);

          response = await fetch(`${endpoint}/upload`, {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            body: formData,
          });
        } else {
          throw new Error(`Upload not supported for: ${item.entityType}`);
        }
        break;

      default:
        throw new Error(`Unknown operation: ${item.operation}`);
    }

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new Error(`API error ${response.status}: ${errorText}`);
    }

    // Update local record with sync status
    if (item.entityType === 'ticket' && item.operation !== 'delete') {
      const ticket = await db.get<any>(STORES.TICKETS, item.entityId);
      if (ticket) {
        await db.put(STORES.TICKETS, {
          ...ticket,
          isSynced: true,
          syncedAt: new Date().toISOString(),
        });
      }
    }

    if (item.entityType === 'photo' && item.operation === 'upload') {
      const responseData = await response.json();
      const photo = await db.get<any>(STORES.PHOTOS, item.entityId);
      if (photo) {
        await db.put(STORES.PHOTOS, {
          ...photo,
          isSynced: true,
          syncedUrl: responseData.url,
          syncedAt: new Date().toISOString(),
        });
      }
    }
  }

  // Clean up old completed items
  private async cleanupCompleted(): Promise<void> {
    const cutoff = new Date();
    cutoff.setHours(cutoff.getHours() - 24);

    const completedItems = await db.query<SyncQueueItem>(STORES.SYNC_QUEUE, {
      index: 'status',
      range: IDBKeyRange.only('completed'),
    });

    const oldItems = completedItems.filter(
      item => item.processedAt && new Date(item.processedAt) < cutoff
    );

    for (const item of oldItems) {
      if (item.id) {
        await db.delete(STORES.SYNC_QUEUE, item.id);
      }
    }
  }

  // Log sync event
  private async logSync(
    type: SyncLogEntry['type'],
    details: string,
    itemCount?: number,
    duration?: number
  ): Promise<void> {
    const entry: SyncLogEntry = {
      type,
      details,
      itemCount,
      duration,
      timestamp: new Date().toISOString(),
    };
    await db.add(STORES.SYNC_LOGS, entry);

    // Keep only last 100 logs
    const allLogs = await db.getAll<SyncLogEntry>(STORES.SYNC_LOGS);
    if (allLogs.length > 100) {
      const sortedLogs = allLogs.sort((a, b) => 
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
      const toDelete = sortedLogs.slice(0, allLogs.length - 100);
      for (const log of toDelete) {
        if (log.id) {
          await db.delete(STORES.SYNC_LOGS, log.id);
        }
      }
    }
  }

  // Start automatic sync
  startAutoSync(): void {
    if (this.syncInterval) return;

    this.syncInterval = window.setInterval(() => {
      if (navigator.onLine) {
        this.processQueue();
      }
    }, SYNC_CONFIG.SYNC_INTERVAL_MS);

    // Also sync on online event
    window.addEventListener('online', this.handleOnline);

    console.log('[Sync] Auto-sync started');
  }

  // Stop automatic sync
  stopAutoSync(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    window.removeEventListener('online', this.handleOnline);
    console.log('[Sync] Auto-sync stopped');
  }

  private handleOnline = () => {
    console.log('[Sync] Online detected, triggering sync');
    this.processQueue();
  };

  // Subscribe to status updates
  subscribe(listener: (status: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Notify all listeners
  private async notifyListeners(): Promise<void> {
    const status = await this.getStatus();
    this.listeners.forEach(listener => listener(status));
  }

  // Retry failed items
  async retryFailed(): Promise<void> {
    const failedItems = await db.query<SyncQueueItem>(STORES.SYNC_QUEUE, {
      index: 'status',
      range: IDBKeyRange.only('failed'),
    });

    for (const item of failedItems) {
      await db.put(STORES.SYNC_QUEUE, {
        ...item,
        status: 'pending' as const,
        attempts: 0,
        lastError: undefined,
      });
    }

    await this.logSync('retry', `Retrying ${failedItems.length} failed items`);
    
    // Trigger sync
    this.processQueue();
  }

  // Get pending items count
  async getPendingCount(): Promise<number> {
    const items = await db.query<SyncQueueItem>(STORES.SYNC_QUEUE, {
      index: 'status',
      range: IDBKeyRange.only('pending'),
    });
    return items.length;
  }

  // Get failed items
  async getFailedItems(): Promise<SyncQueueItem[]> {
    return db.query<SyncQueueItem>(STORES.SYNC_QUEUE, {
      index: 'status',
      range: IDBKeyRange.only('failed'),
    });
  }
}

// Export singleton instance
export const syncService = new SyncService();

// React hook for sync status
import { useState, useEffect } from 'react';

export function useSyncStatus(): SyncStatus & { sync: () => Promise<void>; retryFailed: () => Promise<void> } {
  const [status, setStatus] = useState<SyncStatus>({
    isRunning: false,
    lastSync: null,
    pendingCount: 0,
    failedCount: 0,
    progress: 0,
  });

  useEffect(() => {
    // Get initial status
    syncService.getStatus().then(setStatus);

    // Subscribe to updates
    const unsubscribe = syncService.subscribe(setStatus);

    return () => {
      unsubscribe();
    };
  }, []);

  const sync = async () => {
    await syncService.processQueue();
  };

  const retryFailed = async () => {
    await syncService.retryFailed();
  };

  return { ...status, sync, retryFailed };
}

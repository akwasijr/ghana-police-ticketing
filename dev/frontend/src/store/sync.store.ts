// Sync Store - for managing offline sync state

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { syncAPI } from '@/lib/api/sync.api';
import type { SyncRequest } from '@/types/api.types';

interface SyncItem {
  id: string;
  type: 'ticket' | 'photo' | 'payment';
  action: 'create' | 'update' | 'delete';
  data: unknown;
  timestamp: string;
  retryCount: number;
  lastError?: string;
}

interface SyncState {
  // State
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: string | null;
  pendingItems: SyncItem[];
  failedItems: SyncItem[];
  syncProgress: number;

  // Actions
  setOnline: (isOnline: boolean) => void;
  setSyncing: (isSyncing: boolean) => void;
  setLastSyncTime: (time: string) => void;
  setSyncProgress: (progress: number) => void;

  // API actions
  syncWithServer: () => Promise<void>;

  // Queue management
  addToPendingQueue: (item: Omit<SyncItem, 'id' | 'timestamp' | 'retryCount'>) => void;
  removeFromPendingQueue: (id: string) => void;
  moveToFailed: (id: string, error: string) => void;
  retryFailed: (id: string) => void;
  clearPendingQueue: () => void;
  clearFailedQueue: () => void;

  // Computed
  getPendingCount: () => number;
  getFailedCount: () => number;
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      // Initial state
      isOnline: navigator.onLine,
      isSyncing: false,
      lastSyncTime: null,
      pendingItems: [],
      failedItems: [],
      syncProgress: 0,

      // Actions
      setOnline: (isOnline) => set({ isOnline }),

      setSyncing: (isSyncing) => set({ isSyncing }),

      setLastSyncTime: (lastSyncTime) => set({ lastSyncTime }),

      setSyncProgress: (syncProgress) => set({ syncProgress }),

      // Sync with server
      syncWithServer: async () => {
        const { pendingItems, lastSyncTime, isSyncing } = get();
        if (isSyncing || pendingItems.length === 0) return;

        set({ isSyncing: true, syncProgress: 0 });
        try {
          // Build sync request from pending items
          const ticketItems = pendingItems.filter((i) => i.type === 'ticket');
          const photoItems = pendingItems.filter((i) => i.type === 'photo');

          const syncRequest: SyncRequest = {
            lastSyncTimestamp: lastSyncTime || new Date(0).toISOString(),
            tickets: ticketItems.map((item) => ({
              id: item.id,
              action: item.action as 'create' | 'update',
              data: item.data,
              timestamp: item.timestamp,
            })),
            photos: photoItems.map((item) => {
              const photoData = item.data as { ticketId: string; photoId: string; data: string; type: string };
              return {
                ticketId: photoData.ticketId,
                photoId: photoData.photoId,
                data: photoData.data,
                type: photoData.type,
              };
            }),
          };

          const response = await syncAPI.sync(syncRequest);

          // Process results - remove successfully synced items
          const successTicketIds = response.results.tickets
            .filter((r) => r.status === 'success')
            .map((r) => r.localId);
          const successPhotoIds = response.results.photos
            .filter((r) => r.status === 'success')
            .map((r) => r.localId);

          const failedTickets = response.results.tickets.filter((r) => r.status === 'error');
          const failedPhotos = response.results.photos.filter((r) => r.status === 'error');

          set((state) => {
            // Remove successfully synced items from pending
            const remainingPending = state.pendingItems.filter((item) => {
              if (item.type === 'ticket') return !successTicketIds.includes(item.id);
              if (item.type === 'photo') return !successPhotoIds.includes(item.id);
              return true;
            });

            // Move failed items
            const newFailed = [
              ...state.failedItems,
              ...failedTickets.map((f) => {
                const original = state.pendingItems.find((i) => i.id === f.localId);
                return original
                  ? { ...original, lastError: f.error || 'Sync failed', retryCount: original.retryCount + 1 }
                  : null;
              }).filter(Boolean) as SyncItem[],
              ...failedPhotos.map((f) => {
                const original = state.pendingItems.find((i) => i.id === f.localId);
                return original
                  ? { ...original, lastError: 'Photo sync failed', retryCount: original.retryCount + 1 }
                  : null;
              }).filter(Boolean) as SyncItem[],
            ];

            return {
              pendingItems: remainingPending,
              failedItems: newFailed,
              lastSyncTime: response.syncTimestamp,
              isSyncing: false,
              syncProgress: 100,
            };
          });
        } catch {
          set({ isSyncing: false, syncProgress: 0 });
        }
      },

      // Queue management
      addToPendingQueue: (item) => {
        const newItem: SyncItem = {
          ...item,
          id: `sync-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          timestamp: new Date().toISOString(),
          retryCount: 0,
        };

        set((state) => ({
          pendingItems: [...state.pendingItems, newItem],
        }));
      },

      removeFromPendingQueue: (id) =>
        set((state) => ({
          pendingItems: state.pendingItems.filter((item) => item.id !== id),
        })),

      moveToFailed: (id, error) =>
        set((state) => {
          const item = state.pendingItems.find((i) => i.id === id);
          if (!item) return state;

          return {
            pendingItems: state.pendingItems.filter((i) => i.id !== id),
            failedItems: [
              ...state.failedItems,
              { ...item, lastError: error, retryCount: item.retryCount + 1 },
            ],
          };
        }),

      retryFailed: (id) =>
        set((state) => {
          const item = state.failedItems.find((i) => i.id === id);
          if (!item) return state;

          return {
            failedItems: state.failedItems.filter((i) => i.id !== id),
            pendingItems: [...state.pendingItems, { ...item, lastError: undefined }],
          };
        }),

      clearPendingQueue: () => set({ pendingItems: [] }),

      clearFailedQueue: () => set({ failedItems: [] }),

      // Computed
      getPendingCount: () => get().pendingItems.length,

      getFailedCount: () => get().failedItems.length,
    }),
    {
      name: 'sync-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        pendingItems: state.pendingItems,
        failedItems: state.failedItems,
        lastSyncTime: state.lastSyncTime,
      }),
    }
  )
);

// Selector hooks
export const useIsOnline = () => useSyncStore((state) => state.isOnline);
export const useIsSyncing = () => useSyncStore((state) => state.isSyncing);
export const usePendingCount = () => useSyncStore((state) => state.pendingItems.length);

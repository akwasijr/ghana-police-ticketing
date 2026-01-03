// Sync Store - for managing offline sync state

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

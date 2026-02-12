// useOffline hook - Offline status and sync management

import { useEffect, useCallback } from 'react';
import { useSyncStore } from '@/store';

export function useOffline() {
  const {
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingItems,
    failedItems,
    syncProgress,
    setOnline,
    setSyncing,
    setLastSyncTime,
    setSyncProgress,
    addToPendingQueue,
    removeFromPendingQueue,
    moveToFailed,
    retryFailed,
    clearPendingQueue,
    clearFailedQueue,
  } = useSyncStore();

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setOnline(true);
      // Trigger sync when coming back online
      triggerSync();
    };

    const handleOffline = () => {
      setOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial state
    setOnline(navigator.onLine);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  // Trigger sync process
  const triggerSync = useCallback(async () => {
    if (!navigator.onLine || isSyncing || pendingItems.length === 0) {
      return;
    }

    setSyncing(true);
    setSyncProgress(0);

    try {
      const total = pendingItems.length;
      let completed = 0;

      for (const item of pendingItems) {
        try {
          // Process each sync item based on type
          await processQueueItem(item);
          removeFromPendingQueue(item.id);
          completed++;
          setSyncProgress(Math.round((completed / total) * 100));
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Sync failed';
          moveToFailed(item.id, errorMessage);
        }
      }

      setLastSyncTime(new Date().toISOString());
    } finally {
      setSyncing(false);
      setSyncProgress(0);
    }
  }, [
    isSyncing,
    pendingItems,
    setSyncing,
    setSyncProgress,
    removeFromPendingQueue,
    moveToFailed,
    setLastSyncTime,
  ]);

  // Process individual queue item
  const processQueueItem = async (_item: typeof pendingItems[0]) => {
    // This would be implemented with actual API calls
    // For now, simulate processing
    await new Promise((resolve) => setTimeout(resolve, 500));
    
    // TODO: Implement actual sync logic based on item.type and item.action
    // switch (item.type) {
    //   case 'ticket':
    //     await ticketApi.create(item.data);
    //     break;
    //   case 'photo':
    //     await uploadPhoto(item.data);
    //     break;
    //   case 'payment':
    //     await paymentApi.record(item.data);
    //     break;
    // }
  };

  // Queue an item for sync
  const queueForSync = useCallback(
    (
      type: 'ticket' | 'photo' | 'payment',
      action: 'create' | 'update' | 'delete',
      data: unknown
    ) => {
      addToPendingQueue({ type, action, data });

      // If online, trigger immediate sync
      if (navigator.onLine) {
        // Debounce sync trigger
        setTimeout(triggerSync, 1000);
      }
    },
    [addToPendingQueue, triggerSync]
  );

  // Retry a specific failed item
  const retryFailedItem = useCallback(
    (id: string) => {
      retryFailed(id);
      triggerSync();
    },
    [retryFailed, triggerSync]
  );

  // Retry all failed items
  const retryAllFailed = useCallback(() => {
    failedItems.forEach((item) => {
      retryFailed(item.id);
    });
    triggerSync();
  }, [failedItems, retryFailed, triggerSync]);

  return {
    // State
    isOnline,
    isSyncing,
    lastSyncTime,
    pendingCount: pendingItems.length,
    failedCount: failedItems.length,
    syncProgress,
    pendingItems,
    failedItems,
    
    // Actions
    queueForSync,
    triggerSync,
    retryFailedItem,
    retryAllFailed,
    clearPendingQueue,
    clearFailedQueue,
  };
}

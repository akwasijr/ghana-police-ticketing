import React from 'react';
import { Wifi, WifiOff, Cloud, CloudOff, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConnectionStatusProps {
  isOnline: boolean;
  isSyncing?: boolean;
  pendingCount?: number;
  lastSyncTime?: string;
  variant?: 'minimal' | 'detailed';
  isHandheld?: boolean;
  onSync?: () => void;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  isOnline,
  isSyncing = false,
  pendingCount = 0,
  lastSyncTime,
  variant = 'minimal',
  isHandheld = false,
  onSync,
}) => {
  if (variant === 'minimal') {
    return (
      <div
        className={cn(
          'flex items-center gap-2 px-3 py-1.5 rounded-pill text-xs font-medium',
          isOnline
            ? isHandheld
              ? 'bg-status-success/20 text-[#81C784]'
              : 'bg-status-success/10 text-status-success'
            : isHandheld
              ? 'bg-status-error/20 text-[#E57373]'
              : 'bg-status-error/10 text-status-error'
        )}
      >
        {isOnline ? (
          <>
            <Wifi className="w-3.5 h-3.5" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5" />
            <span>Offline</span>
          </>
        )}
      </div>
    );
  }

  // Detailed variant
  return (
    <div
      className={cn(
        'flex items-center gap-3 px-4 py-2 rounded-lg',
        isHandheld ? 'bg-[#1E2340]' : 'bg-surface-elevated'
      )}
    >
      {/* Connection status */}
      <div
        className={cn(
          'flex items-center gap-2',
          isOnline
            ? isHandheld ? 'text-[#81C784]' : 'text-status-success'
            : isHandheld ? 'text-[#E57373]' : 'text-status-error'
        )}
      >
        {isOnline ? (
          <Cloud className="w-4 h-4" />
        ) : (
          <CloudOff className="w-4 h-4" />
        )}
        <span className="text-sm font-medium">
          {isOnline ? 'Connected' : 'Offline'}
        </span>
      </div>

      {/* Sync status */}
      {isOnline && (
        <>
          <div className={cn(
            'w-px h-4',
            isHandheld ? 'bg-[#3A4060]' : 'bg-surface-border'
          )} />
          
          <div className="flex items-center gap-2">
            {isSyncing ? (
              <>
                <RefreshCw className={cn(
                  'w-4 h-4 animate-spin',
                  isHandheld ? 'text-primary-yellow' : 'text-primary-blue'
                )} />
                <span className={cn(
                  'text-sm',
                  isHandheld ? 'text-white/70' : 'text-text-secondary'
                )}>
                  Syncing...
                </span>
              </>
            ) : pendingCount > 0 ? (
              <>
                <span className={cn(
                  'text-sm',
                  isHandheld ? 'text-[#FFB74D]' : 'text-status-warning'
                )}>
                  {pendingCount} pending
                </span>
                {onSync && (
                  <button
                    onClick={onSync}
                    className={cn(
                      'p-1 rounded hover:bg-white/10',
                      isHandheld ? 'text-primary-yellow' : 'text-primary-blue'
                    )}
                    aria-label="Sync pending items"
                  >
                    <RefreshCw className="w-4 h-4" aria-hidden="true" />
                  </button>
                )}
              </>
            ) : (
              <span className={cn(
                'text-sm',
                isHandheld ? 'text-white/70' : 'text-text-secondary'
              )}>
                {lastSyncTime ? `Synced ${lastSyncTime}` : 'All synced'}
              </span>
            )}
          </div>
        </>
      )}

      {/* Offline indicator */}
      {!isOnline && pendingCount > 0 && (
        <>
          <div className={cn(
            'w-px h-4',
            isHandheld ? 'bg-[#3A4060]' : 'bg-surface-border'
          )} />
          <span className={cn(
            'text-sm',
            isHandheld ? 'text-[#FFB74D]' : 'text-status-warning'
          )}>
            {pendingCount} pending sync
          </span>
        </>
      )}
    </div>
  );
};

// Offline banner for when user is offline
export const OfflineBanner: React.FC<{ isHandheld?: boolean }> = ({ isHandheld = false }) => (
  <div
    className={cn(
      'flex items-center justify-center gap-2 py-2 text-sm font-medium',
      isHandheld
        ? 'bg-status-error/20 text-[#E57373]'
        : 'bg-status-error/10 text-status-error'
    )}
  >
    <WifiOff className="w-4 h-4" />
    <span>You're offline. Changes will sync when connection is restored.</span>
  </div>
);

export default ConnectionStatus;

// IndexedDB Database Schema - Enhanced for PWA Offline-First

export const DB_NAME = 'ghana_police_ticketing';
export const DB_VERSION = 2;

// Store names
export const STORES = {
  TICKETS: 'tickets',
  PENDING_TICKETS: 'pending_tickets',
  OFFICERS: 'officers',
  STATIONS: 'stations',
  PAYMENTS: 'payments',
  OFFENCES: 'offences',
  PHOTOS: 'photos',
  SYNC_QUEUE: 'sync_queue',
  SETTINGS: 'settings',
  VEHICLE_CACHE: 'vehicle_cache',
  SYNC_LOGS: 'sync_logs',
} as const;

// Index definitions for each store
export const STORE_SCHEMAS = {
  [STORES.TICKETS]: {
    keyPath: 'id',
    indexes: [
      { name: 'ticketNumber', keyPath: 'ticketNumber', unique: true },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'vehicleReg', keyPath: 'vehicle.registrationNumber', unique: false },
      { name: 'officerId', keyPath: 'officerId', unique: false },
      { name: 'stationId', keyPath: 'stationId', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
      { name: 'issuedAt', keyPath: 'issuedAt', unique: false },
      { name: 'syncStatus', keyPath: 'syncStatus', unique: false },
      { name: 'isSynced', keyPath: 'isSynced', unique: false },
    ],
  },
  
  [STORES.PENDING_TICKETS]: {
    keyPath: 'id',
    indexes: [
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
      { name: 'retryCount', keyPath: 'retryCount', unique: false },
      { name: 'priority', keyPath: 'priority', unique: false },
    ],
  },
  
  [STORES.OFFICERS]: {
    keyPath: 'id',
    indexes: [
      { name: 'badgeNumber', keyPath: 'badgeNumber', unique: true },
      { name: 'email', keyPath: 'email', unique: true },
      { name: 'stationId', keyPath: 'stationId', unique: false },
      { name: 'regionId', keyPath: 'regionId', unique: false },
      { name: 'isActive', keyPath: 'isActive', unique: false },
    ],
  },
  
  [STORES.STATIONS]: {
    keyPath: 'id',
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'regionId', keyPath: 'regionId', unique: false },
    ],
  },
  
  [STORES.PAYMENTS]: {
    keyPath: 'id',
    indexes: [
      { name: 'ticketId', keyPath: 'ticketId', unique: false },
      { name: 'paymentReference', keyPath: 'paymentReference', unique: true },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
    ],
  },
  
  [STORES.OFFENCES]: {
    keyPath: 'id',
    indexes: [
      { name: 'code', keyPath: 'code', unique: true },
      { name: 'category', keyPath: 'category', unique: false },
      { name: 'isActive', keyPath: 'isActive', unique: false },
    ],
  },
  
  [STORES.PHOTOS]: {
    keyPath: 'id',
    indexes: [
      { name: 'ticketId', keyPath: 'ticketId', unique: false },
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'isSynced', keyPath: 'isSynced', unique: false },
      { name: 'capturedAt', keyPath: 'capturedAt', unique: false },
    ],
  },
  
  [STORES.SYNC_QUEUE]: {
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'entityType', keyPath: 'entityType', unique: false },
      { name: 'entityId', keyPath: 'entityId', unique: false },
      { name: 'operation', keyPath: 'operation', unique: false },
      { name: 'status', keyPath: 'status', unique: false },
      { name: 'priority', keyPath: 'priority', unique: false },
      { name: 'createdAt', keyPath: 'createdAt', unique: false },
    ],
  },
  
  [STORES.SETTINGS]: {
    keyPath: 'key',
    indexes: [],
  },
  
  [STORES.VEHICLE_CACHE]: {
    keyPath: 'id',
    indexes: [
      { name: 'registration', keyPath: 'registration', unique: true },
      { name: 'lastSeen', keyPath: 'lastSeen', unique: false },
    ],
  },
  
  [STORES.SYNC_LOGS]: {
    keyPath: 'id',
    autoIncrement: true,
    indexes: [
      { name: 'type', keyPath: 'type', unique: false },
      { name: 'timestamp', keyPath: 'timestamp', unique: false },
    ],
  },
} as const;

// Types for sync queue items
export interface SyncQueueItem {
  id?: number;
  operation: 'create' | 'update' | 'delete' | 'upload';
  entityType: 'ticket' | 'photo' | 'payment';
  entityId: string;
  payload: any;
  priority: 1 | 2 | 3 | 4 | 5;
  status: 'pending' | 'processing' | 'failed' | 'completed';
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt: string;
  processedAt?: string;
}

// Photo storage interface
export interface PhotoRecord {
  id: string;
  ticketId: string;
  type: 'evidence' | 'vehicle' | 'license' | 'other';
  blob: Blob;
  thumbnailBlob?: Blob;
  width: number;
  height: number;
  size: number;
  mimeType: string;
  latitude?: number;
  longitude?: number;
  capturedAt: string;
  isSynced: boolean;
  syncedUrl?: string;
  syncError?: string;
}

// Sync log interface
export interface SyncLogEntry {
  id?: number;
  type: 'sync_start' | 'sync_complete' | 'sync_error' | 'conflict' | 'retry';
  details: string;
  itemCount?: number;
  duration?: number;
  timestamp: string;
}

// Type definitions for stored data (legacy - kept for compatibility)
export interface StoredTicket {
  id: string;
  ticketNumber: string;
  localId?: string;
  syncAttempts?: number;
  lastSyncAttempt?: string;
  isSynced?: boolean;
  status: string;
  createdAt: string;
}

export interface StoredPhoto {
  id: string;
  ticketId: string;
  localUri: string;
  base64Data?: string;
  type: 'vehicle' | 'plate' | 'evidence' | 'other';
  timestamp: string;
  uploaded: boolean;
  remoteUrl?: string;
  size?: number;
}

export interface StoredSetting {
  key: string;
  value: unknown;
  updatedAt: string;
}

// API Request and Response Types

// Generic API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
  timestamp: string;
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    limit: number;
    totalItems: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

// Auth API
export interface LoginRequest {
  email?: string;
  badgeNumber?: string;
  password: string;
  deviceId?: string;
  deviceInfo?: {
    platform: string;
    model: string;
    osVersion: string;
    appVersion: string;
  };
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    officer?: {
      id: string;
      badgeNumber: string;
      rank: string;
      station: {
        id: string;
        name: string;
        code: string;
      };
    };
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  accessToken: string;
  expiresIn: number;
}

// Ticket API
export interface CreateTicketRequest {
  vehicle: {
    registrationNumber: string;
    make?: string;
    model?: string;
    color?: string;
    type: string;
    ownerName?: string;
    ownerPhone?: string;
  };
  driver?: {
    firstName: string;
    lastName: string;
    phone?: string;
    licenseNumber?: string;
    address?: string;
    idType?: string;
    idNumber?: string;
  };
  offences: Array<{
    id: string;
    notes?: string;
    customFine?: number;
  }>;
  location: {
    latitude: number;
    longitude: number;
    address?: string;
    landmark?: string;
  };
  notes?: string;
  clientCreatedId?: string;
}

export interface CreateTicketResponse {
  ticket: {
    id: string;
    ticketNumber: string;
    status: string;
    totalFine: number;
    dueDate: string;
    paymentReference: string;
  };
  printData: {
    qrCode: string;
    paymentInstructions: string;
  };
}

export interface UpdateTicketRequest {
  status?: string;
  notes?: string;
  offences?: Array<{
    id: string;
    notes?: string;
    customFine?: number;
  }>;
}

// Photo upload
export interface UploadPhotoRequest {
  ticketId?: string;
  photo: File | Blob;
  type: 'vehicle' | 'plate' | 'evidence' | 'other';
}

export interface UploadPhotoResponse {
  photoId: string;
  url: string;
  thumbnailUrl: string;
}

// Sync API
export interface SyncRequest {
  lastSyncTimestamp: string;
  tickets: Array<{
    id: string;
    action: 'create' | 'update';
    data: unknown;
    timestamp: string;
  }>;
  photos: Array<{
    ticketId: string;
    photoId: string;
    data: string; // Base64
    type: string;
  }>;
}

export interface SyncResponse {
  syncTimestamp: string;
  results: {
    tickets: Array<{
      localId: string;
      serverId: string;
      status: 'success' | 'conflict' | 'error';
      error?: string;
    }>;
    photos: Array<{
      localId: string;
      serverId: string;
      status: 'success' | 'error';
      url?: string;
    }>;
  };
  serverUpdates: {
    tickets: Array<{
      id: string;
      action: 'update' | 'delete';
      data?: unknown;
    }>;
  };
}

// Objection API
export interface FileObjectionRequest {
  ticketId: string;
  reason: string;
  details?: string;
  contactPhone: string;
  contactEmail?: string;
}

export interface FileObjectionResponse {
  objectionId: string;
  ticketNumber: string;
  status: 'pending';
  filedAt: string;
  reviewDeadline: string;
}

export interface ProcessObjectionRequest {
  decision: string;
  reviewNotes: string;
  adjustedFine?: number;
}

// Analytics API
export interface AnalyticsRequest {
  startDate: string;
  endDate: string;
  groupBy?: 'day' | 'week' | 'month';
  regionId?: string;
  stationId?: string;
  officerId?: string;
}

export interface AnalyticsResponse {
  summary: {
    totalTickets: number;
    totalFines: number;
    totalCollected: number;
    collectionRate: number;
    averagePerOfficer: number;
  };
  trends: Array<{
    period: string;
    tickets: number;
    fines: number;
    collected: number;
  }>;
  topOffences: Array<{
    offenceId: string;
    name: string;
    count: number;
    amount: number;
  }>;
  byRegion?: Array<{
    regionId: string;
    name: string;
    tickets: number;
    amount: number;
  }>;
}

// Lookup/Reference data
export interface LookupDataResponse {
  offences: Array<{
    id: string;
    category: string;
    name: string;
    fine: number;
  }>;
  regions: Array<{
    id: string;
    name: string;
    code: string;
  }>;
  stations: Array<{
    id: string;
    name: string;
    code: string;
    regionId: string;
  }>;
  vehicleTypes: Array<{
    id: string;
    name: string;
  }>;
  lastUpdated: string;
}

// Health check
export interface HealthCheckResponse {
  status: 'healthy' | 'degraded' | 'unhealthy';
  version: string;
  timestamp: string;
  services: {
    database: boolean;
    cache: boolean;
    storage: boolean;
  };
}

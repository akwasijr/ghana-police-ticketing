// Ticket Data Types
// Note: For full Offence type with legal basis, points, etc., import from offence.types.ts

import type { OffenceCategory } from './offence.types';

export type TicketStatus = 'unpaid' | 'paid' | 'overdue' | 'objection' | 'cancelled';

// Re-export OffenceCategory for backward compatibility
// Use OffenceCategory from offence.types.ts as the single source of truth
export type TicketOffenceCategory = OffenceCategory;

// Simple offence for ticket (embedded in ticket document)
export interface TicketOffence {
  id: string;
  category: OffenceCategory;
  name: string;
  fine: number;
}

export interface SelectedOffence extends TicketOffence {
  notes?: string;
  customFine?: number; // Officer can adjust fine within limits
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  address?: string;
  landmark?: string;
}

export interface TicketPhoto {
  id: string;
  uri: string; // Local URI or base64
  type: 'vehicle' | 'plate' | 'evidence' | 'other';
  timestamp: string;
  uploaded: boolean;
  remoteUrl?: string;
}

export interface TicketNote {
  id: string;
  content: string;
  officerId: string;
  officerName: string;
  officerEmail?: string;
  timestamp: string;
  images?: TicketPhoto[];
  edited?: boolean;
  editedAt?: string;
}

export interface VehicleInfo {
  registrationNumber: string;
  make?: string;
  model?: string;
  color?: string;
  type: VehicleType;
  ownerName?: string;
  ownerPhone?: string;
  ownerAddress?: string;
}

export type VehicleType = 
  | 'car'
  | 'motorcycle'
  | 'bus'
  | 'minibus'
  | 'truck'
  | 'trailer'
  | 'taxi'
  | 'tricycle'
  | 'other';

export interface DriverInfo {
  firstName: string;
  lastName: string;
  licenseNumber?: string;
  phone?: string;
  address?: string;
  idType?: 'license' | 'ghana_card' | 'passport' | 'voter_id';
  idNumber?: string;
  // Legacy field for backwards compatibility
  name?: string;
}

export interface Ticket {
  // Identifiers
  id: string; // UUID
  ticketNumber: string; // Human-readable: GPS-XXXXXX-XXXX
  
  // Timestamps
  createdAt: string; // ISO date string
  updatedAt: string;
  issuedAt: string;
  dueDate: string;
  
  // Status
  status: TicketStatus;
  
  // Vehicle & Driver
  vehicle: VehicleInfo;
  driver?: DriverInfo;
  
  // Offence Details
  offences: SelectedOffence[];
  totalFine: number;
  
  // Location
  location: GeoLocation;
  
  // Evidence
  photos: TicketPhoto[];
  notes?: string; // Legacy field - deprecated
  notesList?: TicketNote[]; // New field for structured notes with audit trail
  
  // Officer Info
  officerId: string;
  officerName: string;
  officerBadgeNumber: string;
  stationId: string;
  stationName: string;
  districtId?: string;
  divisionId?: string;
  regionId: string;
  
  // Payment
  paymentDeadline: string;
  paymentReference?: string;
  paidAt?: string;
  paidAmount?: number;
  paymentMethod?: string;
  
  // Objection
  objectionFiled?: boolean;
  objectionDate?: string;
  objectionReason?: string;
  objectionStatus?: 'pending' | 'approved' | 'rejected';
  
  // Sync
  syncStatus: 'pending' | 'synced' | 'failed';
  syncedAt?: string;
  localOnly?: boolean;
  
  // Print
  printed: boolean;
  printedAt?: string;
}

// Form state for creating a new ticket
export interface NewTicketForm {
  // Step 1: Vehicle
  vehicle: Partial<VehicleInfo>;
  driver: Partial<DriverInfo>;
  
  // Step 2: Offences
  offences: SelectedOffence[];
  
  // Step 3: Photos
  photos: TicketPhoto[];
  
  // Step 4: Location & Notes
  location: Partial<GeoLocation>;
  notes: string;
}

// Ticket search/filter parameters
export interface TicketFilters {
  search?: string;
  status?: TicketStatus | TicketStatus[];
  dateFrom?: string;
  dateTo?: string;
  officerId?: string;
  stationId?: string;
  regionId?: string;
  minAmount?: number;
  maxAmount?: number;
  category?: TicketOffenceCategory;
  syncStatus?: 'pending' | 'synced' | 'failed';
}

// Ticket list item (lighter version for lists)
export interface TicketListItem {
  id: string;
  ticketNumber: string;
  vehicleReg: string;
  status: TicketStatus;
  totalFine: number;
  issuedAt: string;
  dueDate: string;
  officerName: string;
  officerId?: string;
  stationId?: string;
  stationName?: string;
  districtId?: string;
  districtName?: string;
  divisionId?: string;
  divisionName?: string;
  regionId?: string;
  regionName?: string;
  offenceCount: number;
  syncStatus: 'pending' | 'synced' | 'failed';
}

// Statistics
export interface TicketStats {
  total: number;
  paid: number;
  unpaid: number;
  overdue: number;
  objection: number;
  cancelled: number;
  totalAmount: number;
  collectedAmount: number;
  pendingAmount: number;
}

export interface DailyStats {
  date: string;
  ticketsIssued: number;
  amountIssued: number;
  amountCollected: number;
}

// Officer and User Data Types

export type UserRole = 'officer' | 'admin' | 'supervisor' | 'accountant' | 'super_admin';

export type OfficerRank = 
  | 'constable'
  | 'lance_corporal'
  | 'corporal'
  | 'sergeant'
  | 'staff_sergeant'
  | 'warrant_officer_ii'
  | 'warrant_officer_i'
  | 'inspector'
  | 'chief_inspector'
  | 'assistant_superintendent'
  | 'deputy_superintendent'
  | 'superintendent'
  | 'chief_superintendent'
  | 'assistant_commissioner'
  | 'deputy_commissioner'
  | 'commissioner';

export interface Station {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  regionId: string;
  regionName: string;
  divisionId: string;
  divisionName: string;
  districtId: string;
  districtName: string;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
}

export interface Region {
  id: string;
  name: string;
  capital: string;
  code: string;
}

export interface Officer {
  id: string;
  
  // Personal Info
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  
  // Police Info
  badgeNumber: string;
  rank: OfficerRank;
  rankDisplay: string;
  stationId: string;
  station: Station;
  regionId: string;
  
  // Account
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  
  // Device
  assignedDeviceId?: string;
  
  // Profile
  profilePhoto?: string;
  
  // Display helpers
  stationName?: string;
  status?: 'active' | 'inactive';
  joinedDate?: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  phone?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
  lastLogin?: string;
  profilePhoto?: string;
  
  // Only for officers
  officer?: Officer;
}

// Authentication
export interface AuthCredentials {
  email?: string;
  badgeNumber?: string;
  password: string;
  deviceId?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
}

export interface AuthSession {
  user: User;
  tokens: AuthTokens;
  isAuthenticated: boolean;
  interfaceMode: 'handheld' | 'dashboard';
}

export interface LoginResponse {
  user: User;
  tokens: AuthTokens;
}

// Officer performance stats
export interface OfficerStats {
  officerId: string;
  period: 'day' | 'week' | 'month' | 'year';
  ticketsIssued: number;
  totalFines: number;
  collectedAmount: number;
  collectionRate: number;
  averagePerDay: number;
}

// Officer list filters
export interface OfficerFilters {
  search?: string;
  stationId?: string;
  regionId?: string;
  rank?: OfficerRank;
  isActive?: boolean;
  role?: UserRole;
}

// Create/Update officer
export interface CreateOfficerInput {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  badgeNumber: string;
  rank: OfficerRank;
  stationId: string;
  role: UserRole;
  password?: string;
}

export interface UpdateOfficerInput extends Partial<CreateOfficerInput> {
  id: string;
  isActive?: boolean;
}

// Permission definitions
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  officer: [
    'ticket:create',
    'ticket:view:own',
    'ticket:print',
  ],
  supervisor: [
    'ticket:create',
    'ticket:view:own',
    'ticket:view:station',
    'ticket:print',
    'ticket:void',
    'officer:view:station',
    'report:view:station',
  ],
  admin: [
    'ticket:create',
    'ticket:view:all',
    'ticket:edit',
    'ticket:void',
    'ticket:print',
    'officer:view:all',
    'officer:create',
    'officer:edit',
    'payment:view',
    'payment:process',
    'objection:view',
    'objection:process',
    'report:view:all',
    'report:export',
  ],
  accountant: [
    'ticket:view:all',
    'payment:view',
    'payment:process',
    'payment:reconcile',
    'report:view:all',
    'report:export',
  ],
  super_admin: [
    '*', // All permissions
  ],
};

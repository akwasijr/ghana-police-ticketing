// Organizational Hierarchy Types
// Standardized types for Region → Division → District → Station hierarchy

export interface Region {
  id: string;
  name: string;
  code: string; // e.g., 'GA', 'AS', 'WR'
  capital?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Division {
  id: string;
  name: string;
  code: string;
  regionId: string;
  regionName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface District {
  id: string;
  name: string;
  code: string;
  divisionId: string;
  divisionName?: string;
  regionId: string;
  regionName?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Station {
  id: string;
  name: string;
  code: string;
  
  // Hierarchy
  districtId: string;
  districtName?: string;
  divisionId: string;
  divisionName?: string;
  regionId: string;
  regionName?: string;
  
  // Contact
  address: string;
  phone: string;
  email?: string;
  
  // Location
  latitude?: number;
  longitude?: number;
  
  // Status
  isActive: boolean;
  type?: 'HQ' | 'District' | 'Outpost';
  
  // Stats
  officerCount?: number;
  
  // Timestamps
  createdAt?: string;
  updatedAt?: string;
}

export interface StationFilters {
  search?: string;
  regionId?: string;
  divisionId?: string;
  districtId?: string;
  isActive?: boolean;
  type?: Station['type'];
}

// Hierarchy tree for display
export interface HierarchyNode {
  id: string;
  name: string;
  type: 'region' | 'division' | 'district' | 'station';
  children?: HierarchyNode[];
  isExpanded?: boolean;
  metadata?: Record<string, any>;
}

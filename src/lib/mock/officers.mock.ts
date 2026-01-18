// Mock Officers Data
import type { Officer, OfficerRank, UserRole } from '@/types';

// Demo officers for testing
export const MOCK_OFFICERS: Officer[] = [
  {
    id: 'off-001',
    firstName: 'Kwame',
    lastName: 'Mensah',
    fullName: 'Kwame Mensah',
    email: 'kwame.mensah@gps.gov.gh',
    phone: '+233 24 123 4567',
    badgeNumber: 'GPS001',
    rank: 'sergeant' as OfficerRank,
    rankDisplay: 'Sergeant',
    stationId: 'st-accra-central',
    station: {} as any, // Will be populated dynamically
    regionId: 'ga',
    role: 'officer' as UserRole,
    isActive: true,
    createdAt: '2023-01-15T00:00:00Z',
    lastLogin: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    stationName: 'Accra Central Police Station',
    status: 'active',
    joinedDate: '2023-01-15',
  },
  {
    id: 'off-002',
    firstName: 'Akua',
    lastName: 'Osei',
    fullName: 'Akua Osei',
    email: 'akua.osei@gps.gov.gh',
    phone: '+233 24 234 5678',
    badgeNumber: 'GPS002',
    rank: 'corporal' as OfficerRank,
    rankDisplay: 'Corporal',
    stationId: 'st-osu',
    station: {} as any,
    regionId: 'ga',
    role: 'officer' as UserRole,
    isActive: true,
    createdAt: '2023-03-20T00:00:00Z',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    stationName: 'Osu Police Station',
    status: 'active',
    joinedDate: '2023-03-20',
  },
  {
    id: 'off-003',
    firstName: 'John',
    lastName: 'Appiah',
    fullName: 'John Appiah',
    email: 'john.appiah@gps.gov.gh',
    phone: '+233 24 345 6789',
    badgeNumber: 'ADMIN01',
    rank: 'inspector' as OfficerRank,
    rankDisplay: 'Inspector',
    stationId: 'st-accra-central',
    station: {} as any,
    regionId: 'ga',
    role: 'admin' as UserRole,
    isActive: true,
    createdAt: '2022-06-10T00:00:00Z',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    stationName: 'Accra Central Police Station',
    status: 'active',
    joinedDate: '2022-06-10',
  },
  {
    id: 'off-004',
    firstName: 'Grace',
    lastName: 'Nkrumah',
    fullName: 'Grace Nkrumah',
    email: 'grace.nkrumah@gps.gov.gh',
    phone: '+233 24 456 7890',
    badgeNumber: 'SUPER01',
    rank: 'superintendent' as OfficerRank,
    rankDisplay: 'Superintendent',
    stationId: 'st-accra-central',
    station: {} as any,
    regionId: 'ga',
    role: 'super_admin' as UserRole,
    isActive: true,
    createdAt: '2020-01-05T00:00:00Z',
    lastLogin: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    stationName: 'National Headquarters',
    status: 'active',
    joinedDate: '2020-01-05',
  },
  {
    id: 'off-005',
    firstName: 'Samuel',
    lastName: 'Boateng',
    fullName: 'Samuel Boateng',
    email: 'samuel.boateng@gps.gov.gh',
    phone: '+233 24 567 8901',
    badgeNumber: 'GPS003',
    rank: 'constable' as OfficerRank,
    rankDisplay: 'Constable',
    stationId: 'st-kumasi-central',
    station: {} as any,
    regionId: 'as',
    role: 'officer' as UserRole,
    isActive: false, // Inactive for testing
    createdAt: '2024-01-10T00:00:00Z',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    stationName: 'Kumasi Central Police Station',
    status: 'inactive',
    joinedDate: '2024-01-10',
  },
  {
    id: 'off-006',
    firstName: 'Esi',
    lastName: 'Asare',
    fullName: 'Esi Asare',
    email: 'esi.asare@gps.gov.gh',
    phone: '+233 24 678 9012',
    badgeNumber: 'GPS004',
    rank: 'lance_corporal' as OfficerRank,
    rankDisplay: 'Lance Corporal',
    stationId: 'st-tema-central',
    station: {} as any,
    regionId: 'ga',
    role: 'officer' as UserRole,
    isActive: true,
    createdAt: '2024-06-15T00:00:00Z',
    lastLogin: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    stationName: 'Tema Central Police Station',
    status: 'active',
    joinedDate: '2024-06-15',
  },
];

// Demo login credentials
export const DEMO_CREDENTIALS = {
  pda: { badgeNumber: 'GPS001', password: 'demo123', role: 'officer' },
  admin: { badgeNumber: 'ADMIN01', password: 'admin123', role: 'admin' },
  superAdmin: { badgeNumber: 'SUPER01', password: 'super123', role: 'super_admin' },
};

// Helpers
export const getOfficersByStation = (stationId: string): Officer[] => {
  return MOCK_OFFICERS.filter(o => o.stationId === stationId);
};

export const getOfficersByRegion = (regionId: string): Officer[] => {
  return MOCK_OFFICERS.filter(o => o.regionId === regionId);
};

export const getActiveOfficers = (): Officer[] => {
  return MOCK_OFFICERS.filter(o => o.isActive);
};

export const getOfficerStats = () => {
  const total = MOCK_OFFICERS.length;
  const active = MOCK_OFFICERS.filter(o => o.isActive).length;
  
  const byRole = {
    officer: MOCK_OFFICERS.filter(o => o.role === 'officer').length,
    supervisor: MOCK_OFFICERS.filter(o => o.role === 'supervisor').length,
    admin: MOCK_OFFICERS.filter(o => o.role === 'admin').length,
    super_admin: MOCK_OFFICERS.filter(o => o.role === 'super_admin').length,
  };
  
  return { total, active, inactive: total - active, byRole };
};

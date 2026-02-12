// Mock Stations Data
import type { Station } from '@/types';

export const MOCK_STATIONS: Station[] = [
  // Greater Accra - Accra Central District
  {
    id: 'st-accra-central',
    name: 'Accra Central Police Station',
    code: 'GPS-GA-ACC-001',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
    address: 'Kwame Nkrumah Avenue, Accra',
    phone: '030 266 4611',
    email: 'accra.central@gps.gov.gh',
    latitude: 5.55,
    longitude: -0.2,
    isActive: true,
    type: 'HQ',
    officerCount: 45,
  },
  {
    id: 'st-ring-road',
    name: 'Ring Road Police Station',
    code: 'GPS-GA-ACC-002',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
    address: 'Ring Road Central, Accra',
    phone: '030 222 3344',
    isActive: true,
    type: 'District',
    officerCount: 28,
  },
  // Greater Accra - Accra East District
  {
    id: 'st-osu',
    name: 'Osu Police Station',
    code: 'GPS-GA-OSU-001',
    districtId: 'ga-accra-east',
    districtName: 'Accra East District',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
    address: 'Cantonments Road, Osu',
    phone: '030 277 5739',
    isActive: true,
    type: 'District',
    officerCount: 32,
  },
  {
    id: 'st-airport',
    name: 'Airport Police Station',
    code: 'GPS-GA-AIR-001',
    districtId: 'ga-accra-east',
    districtName: 'Accra East District',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
    address: 'Liberation Road, Airport City',
    phone: '030 277 7592',
    isActive: true,
    type: 'District',
    officerCount: 24,
  },
  // Greater Accra - Tema
  {
    id: 'st-tema-central',
    name: 'Tema Central Police Station',
    code: 'GPS-GA-TEM-001',
    districtId: 'ga-tema-central',
    districtName: 'Tema Central District',
    divisionId: 'ga-tema',
    divisionName: 'Tema Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
    address: 'Community 1, Tema',
    phone: '030 320 1234',
    isActive: true,
    type: 'HQ',
    officerCount: 38,
  },
  {
    id: 'st-tema-harbour',
    name: 'Tema Harbour Police Station',
    code: 'GPS-GA-TEM-002',
    districtId: 'ga-tema-central',
    districtName: 'Tema Central District',
    divisionId: 'ga-tema',
    divisionName: 'Tema Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
    address: 'Harbour Area, Tema',
    phone: '030 320 5678',
    isActive: true,
    type: 'Outpost',
    officerCount: 18,
  },
  // Ashanti - Kumasi Central
  {
    id: 'st-kumasi-central',
    name: 'Kumasi Central Police Station',
    code: 'GPS-AS-KUM-001',
    districtId: 'as-kumasi-central',
    districtName: 'Kumasi Central District',
    divisionId: 'as-kumasi-metro',
    divisionName: 'Kumasi Metropolitan Division',
    regionId: 'as',
    regionName: 'Ashanti',
    address: 'Adum, Kumasi',
    phone: '032 202 3456',
    isActive: true,
    type: 'HQ',
    officerCount: 52,
  },
  {
    id: 'st-kejetia',
    name: 'Kejetia Police Station',
    code: 'GPS-AS-KUM-002',
    districtId: 'as-kumasi-central',
    districtName: 'Kumasi Central District',
    divisionId: 'as-kumasi-metro',
    divisionName: 'Kumasi Metropolitan Division',
    regionId: 'as',
    regionName: 'Ashanti',
    address: 'Kejetia Market Area, Kumasi',
    phone: '032 202 7890',
    isActive: true,
    type: 'District',
    officerCount: 22,
  },
  // Western - Sekondi
  {
    id: 'st-sekondi-central',
    name: 'Sekondi Central Police Station',
    code: 'GPS-WR-SEK-001',
    districtId: 'wr-sekondi-central',
    districtName: 'Sekondi Central District',
    divisionId: 'wr-sekondi',
    divisionName: 'Sekondi-Takoradi Division',
    regionId: 'wr',
    regionName: 'Western',
    address: 'Market Circle, Sekondi',
    phone: '031 204 5678',
    isActive: true,
    type: 'HQ',
    officerCount: 35,
  },
  {
    id: 'st-takoradi',
    name: 'Takoradi Police Station',
    code: 'GPS-WR-TAK-001',
    districtId: 'wr-sekondi-central',
    districtName: 'Sekondi Central District',
    divisionId: 'wr-sekondi',
    divisionName: 'Sekondi-Takoradi Division',
    regionId: 'wr',
    regionName: 'Western',
    address: 'CBD, Takoradi',
    phone: '031 202 3456',
    isActive: false, // Inactive for testing
    type: 'District',
    officerCount: 0,
  },
];

// Helper to get stations by district
export const getStationsByDistrict = (districtId: string): Station[] => {
  return MOCK_STATIONS.filter(s => s.districtId === districtId);
};

// Helper to get stations by region
export const getStationsByRegion = (regionId: string): Station[] => {
  return MOCK_STATIONS.filter(s => s.regionId === regionId);
};

// Helper to get active stations
export const getActiveStations = (): Station[] => {
  return MOCK_STATIONS.filter(s => s.isActive);
};

// Stats
export const getStationStats = () => {
  const total = MOCK_STATIONS.length;
  const active = MOCK_STATIONS.filter(s => s.isActive).length;
  const totalOfficers = MOCK_STATIONS.reduce((sum, s) => sum + (s.officerCount || 0), 0);
  
  const byType = {
    HQ: MOCK_STATIONS.filter(s => s.type === 'HQ').length,
    District: MOCK_STATIONS.filter(s => s.type === 'District').length,
    Outpost: MOCK_STATIONS.filter(s => s.type === 'Outpost').length,
  };
  
  return { total, active, inactive: total - active, totalOfficers, byType };
};

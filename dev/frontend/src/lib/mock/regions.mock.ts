// Mock Regions, Divisions, Districts Data
import type { Region, Division, District } from '@/types';

export const MOCK_REGIONS: Region[] = [
  { id: 'ga', name: 'Greater Accra', code: 'GA', capital: 'Accra', isActive: true },
  { id: 'as', name: 'Ashanti', code: 'AS', capital: 'Kumasi', isActive: true },
  { id: 'wr', name: 'Western', code: 'WR', capital: 'Sekondi-Takoradi', isActive: true },
  { id: 'er', name: 'Eastern', code: 'ER', capital: 'Koforidua', isActive: true },
  { id: 'cr', name: 'Central', code: 'CR', capital: 'Cape Coast', isActive: true },
  { id: 'nr', name: 'Northern', code: 'NR', capital: 'Tamale', isActive: true },
  { id: 'vr', name: 'Volta', code: 'VR', capital: 'Ho', isActive: true },
  { id: 'ue', name: 'Upper East', code: 'UE', capital: 'Bolgatanga', isActive: true },
  { id: 'uw', name: 'Upper West', code: 'UW', capital: 'Wa', isActive: true },
  { id: 'ba', name: 'Bono', code: 'BA', capital: 'Sunyani', isActive: true },
  { id: 'be', name: 'Bono East', code: 'BE', capital: 'Techiman', isActive: true },
  { id: 'ah', name: 'Ahafo', code: 'AH', capital: 'Goaso', isActive: true },
  { id: 'sv', name: 'Savannah', code: 'SV', capital: 'Damongo', isActive: true },
  { id: 'ne', name: 'North East', code: 'NE', capital: 'Nalerigu', isActive: true },
  { id: 'ot', name: 'Oti', code: 'OT', capital: 'Dambai', isActive: true },
  { id: 'wn', name: 'Western North', code: 'WN', capital: 'Sefwi Wiawso', isActive: true },
];

export const MOCK_DIVISIONS: Division[] = [
  // Greater Accra
  { id: 'ga-accra-metro', name: 'Accra Metropolitan Division', code: 'GAM', regionId: 'ga', regionName: 'Greater Accra', isActive: true },
  { id: 'ga-tema', name: 'Tema Division', code: 'GAT', regionId: 'ga', regionName: 'Greater Accra', isActive: true },
  { id: 'ga-adentan', name: 'Adentan Division', code: 'GAD', regionId: 'ga', regionName: 'Greater Accra', isActive: true },
  // Ashanti
  { id: 'as-kumasi-metro', name: 'Kumasi Metropolitan Division', code: 'ASK', regionId: 'as', regionName: 'Ashanti', isActive: true },
  { id: 'as-obuasi', name: 'Obuasi Division', code: 'ASO', regionId: 'as', regionName: 'Ashanti', isActive: true },
  // Western
  { id: 'wr-sekondi', name: 'Sekondi-Takoradi Division', code: 'WRS', regionId: 'wr', regionName: 'Western', isActive: true },
  // Eastern
  { id: 'er-koforidua', name: 'Koforidua Division', code: 'ERK', regionId: 'er', regionName: 'Eastern', isActive: true },
  // Central
  { id: 'cr-cape-coast', name: 'Cape Coast Division', code: 'CRC', regionId: 'cr', regionName: 'Central', isActive: true },
];

export const MOCK_DISTRICTS: District[] = [
  // Greater Accra - Accra Metro
  { id: 'ga-accra-central', name: 'Accra Central District', code: 'GAC', divisionId: 'ga-accra-metro', divisionName: 'Accra Metropolitan Division', regionId: 'ga', regionName: 'Greater Accra', isActive: true },
  { id: 'ga-accra-east', name: 'Accra East District', code: 'GAE', divisionId: 'ga-accra-metro', divisionName: 'Accra Metropolitan Division', regionId: 'ga', regionName: 'Greater Accra', isActive: true },
  { id: 'ga-accra-west', name: 'Accra West District', code: 'GAW', divisionId: 'ga-accra-metro', divisionName: 'Accra Metropolitan Division', regionId: 'ga', regionName: 'Greater Accra', isActive: true },
  // Greater Accra - Tema
  { id: 'ga-tema-central', name: 'Tema Central District', code: 'GTC', divisionId: 'ga-tema', divisionName: 'Tema Division', regionId: 'ga', regionName: 'Greater Accra', isActive: true },
  { id: 'ga-tema-west', name: 'Tema West District', code: 'GTW', divisionId: 'ga-tema', divisionName: 'Tema Division', regionId: 'ga', regionName: 'Greater Accra', isActive: true },
  // Ashanti - Kumasi Metro
  { id: 'as-kumasi-central', name: 'Kumasi Central District', code: 'ASC', divisionId: 'as-kumasi-metro', divisionName: 'Kumasi Metropolitan Division', regionId: 'as', regionName: 'Ashanti', isActive: true },
  // Western - Sekondi
  { id: 'wr-sekondi-central', name: 'Sekondi Central District', code: 'WSC', divisionId: 'wr-sekondi', divisionName: 'Sekondi-Takoradi Division', regionId: 'wr', regionName: 'Western', isActive: true },
];

// Helper to get divisions by region
export const getDivisionsByRegion = (regionId: string): Division[] => {
  return MOCK_DIVISIONS.filter(d => d.regionId === regionId);
};

// Helper to get districts by division
export const getDistrictsByDivision = (divisionId: string): District[] => {
  return MOCK_DISTRICTS.filter(d => d.divisionId === divisionId);
};

// Helper to get full hierarchy path
export const getHierarchyPath = (districtId: string) => {
  const district = MOCK_DISTRICTS.find(d => d.id === districtId);
  if (!district) return null;
  
  const division = MOCK_DIVISIONS.find(d => d.id === district.divisionId);
  const region = MOCK_REGIONS.find(r => r.id === district.regionId);
  
  return { region, division, district };
};

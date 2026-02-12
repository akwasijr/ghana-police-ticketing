export type DemoJurisdictionLevel = 'station' | 'district' | 'division' | 'region' | 'national';

export const DEMO_JURISDICTIONS = {
  national: { id: 'gps-national', name: 'Ghana Police Service (National)' },
  regions: [
    { id: 'ga', name: 'Greater Accra' },
    { id: 'as', name: 'Ashanti' },
    { id: 'wr', name: 'Western' },
  ],
  divisionsByRegion: {
    ga: [
      { id: 'ga-accra-metro', name: 'Accra Metropolitan Division' },
      { id: 'ga-tema', name: 'Tema Division' },
    ],
    as: [{ id: 'as-kumasi-metro', name: 'Kumasi Metropolitan Division' }],
    wr: [{ id: 'wr-sekondi', name: 'Sekondi-Takoradi Division' }],
  } as Record<string, Array<{ id: string; name: string }>>,
  districtsByDivision: {
    'ga-accra-metro': [
      { id: 'ga-accra-central', name: 'Accra Central District' },
      { id: 'ga-accra-east', name: 'Accra East District' },
    ],
    'ga-tema': [{ id: 'ga-tema-central', name: 'Tema Central District' }],
    'as-kumasi-metro': [{ id: 'as-kumasi-central', name: 'Kumasi Central District' }],
    'wr-sekondi': [{ id: 'wr-sekondi-central', name: 'Sekondi Central District' }],
  } as Record<string, Array<{ id: string; name: string }>>,
  stationsByDistrict: {
    'ga-accra-central': [
      { id: 'st-accra-central', name: 'Accra Central Station' },
      { id: 'st-osu', name: 'Osu Police Station' },
      { id: 'st-airport', name: 'Airport Police Station' },
    ],
    'ga-accra-east': [
      { id: 'st-nima', name: 'Nima Police Station' },
      { id: 'st-cantonments', name: 'Cantonments Station' },
    ],
    'ga-tema-central': [{ id: 'st-tema', name: 'Tema Community 1 Station' }],
    'as-kumasi-central': [{ id: 'st-kumasi', name: 'Kumasi Central Station' }],
    'wr-sekondi-central': [{ id: 'st-sekondi', name: 'Sekondi Central Station' }],
  } as Record<string, Array<{ id: string; name: string }>>,
};

export type DemoStation = {
  id: string;
  name: string;
  code: string;
  regionId: string;
  regionName: string;
  divisionId: string;
  divisionName: string;
  districtId: string;
  districtName: string;
  address: string;
  phone: string;
  lat: number;
  lng: number;
  officers: number;
  status: 'active' | 'maintenance';
  type: 'HQ' | 'District';
};

export const DEMO_STATIONS: DemoStation[] = [
  {
    id: 'st-accra-central',
    name: 'Accra Central Station',
    code: 'GPS-GA-ACC-001',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    address: 'Kwame Nkrumah Avenue, Accra',
    phone: '030 266 4611',
    lat: 5.55,
    lng: -0.2,
    officers: 45,
    status: 'active',
    type: 'HQ',
  },
  {
    id: 'st-osu',
    name: 'Osu Police Station',
    code: 'GPS-GA-ACC-002',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    address: 'Cantonments Rd, Osu',
    phone: '030 277 5739',
    lat: 5.556,
    lng: -0.183,
    officers: 28,
    status: 'active',
    type: 'District',
  },
  {
    id: 'st-airport',
    name: 'Airport Police Station',
    code: 'GPS-GA-ACC-003',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    address: 'Liberation Rd, Airport City',
    phone: '030 277 7592',
    lat: 5.603,
    lng: -0.17,
    officers: 32,
    status: 'active',
    type: 'District',
  },
  {
    id: 'st-nima',
    name: 'Nima Police Station',
    code: 'GPS-GA-ACC-004',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-east',
    districtName: 'Accra East District',
    address: 'Nima Hwy, Accra',
    phone: '030 222 2333',
    lat: 5.578,
    lng: -0.195,
    officers: 30,
    status: 'maintenance',
    type: 'District',
  },
  {
    id: 'st-cantonments',
    name: 'Cantonments Station',
    code: 'GPS-GA-ACC-005',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-east',
    districtName: 'Accra East District',
    address: 'Circular Rd, Cantonments',
    phone: '030 277 6655',
    lat: 5.585,
    lng: -0.16,
    officers: 25,
    status: 'active',
    type: 'District',
  },
];

export function matchesJurisdiction(
  jurisdiction:
    | null
    | {
        level: 'station' | 'district' | 'division' | 'region' | 'national';
        id: string;
        name: string;
      },
  item: {
    stationId?: string;
    stationName?: string;
    districtId?: string;
    districtName?: string;
    divisionId?: string;
    divisionName?: string;
    regionId?: string;
    regionName?: string;
  }
): boolean {
  if (!jurisdiction) return true;
  if (jurisdiction.level === 'national') return true;

  if (jurisdiction.level === 'region') {
    return (
      item.regionId === jurisdiction.id ||
      item.regionName?.toLowerCase() === jurisdiction.name.toLowerCase()
    );
  }

  if (jurisdiction.level === 'division') {
    return (
      item.divisionId === jurisdiction.id ||
      item.divisionName?.toLowerCase() === jurisdiction.name.toLowerCase()
    );
  }

  if (jurisdiction.level === 'district') {
    return (
      item.districtId === jurisdiction.id ||
      item.districtName?.toLowerCase() === jurisdiction.name.toLowerCase()
    );
  }

  // station
  return (
    item.stationId === jurisdiction.id ||
    item.stationName?.toLowerCase() === jurisdiction.name.toLowerCase()
  );
}

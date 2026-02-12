import type { TicketListItem, Ticket } from '@/types/ticket.types';
import type { Officer, Station, Region } from '@/types/officer.types';
import type { Payment } from '@/types/payment.types';

// ============================================================================
// HIERARCHICAL STRUCTURE: Regions → Divisions → Districts → Stations
// ============================================================================

export const MOCK_REGIONS: Region[] = [
  { id: 'ga', name: 'Greater Accra', capital: 'Accra', code: 'GA' },
  { id: 'as', name: 'Ashanti', capital: 'Kumasi', code: 'AS' },
  { id: 'wr', name: 'Western', capital: 'Sekondi-Takoradi', code: 'WR' },
];

export interface Division {
  id: string;
  name: string;
  regionId: string;
  regionName: string;
  code: string;
}

export const MOCK_DIVISIONS: Division[] = [
  { id: 'ga-accra-metro', name: 'Accra Metropolitan Division', regionId: 'ga', regionName: 'Greater Accra', code: 'GAM' },
  { id: 'ga-tema', name: 'Tema Division', regionId: 'ga', regionName: 'Greater Accra', code: 'GAT' },
  { id: 'as-kumasi-metro', name: 'Kumasi Metropolitan Division', regionId: 'as', regionName: 'Ashanti', code: 'ASK' },
  { id: 'wr-sekondi', name: 'Sekondi-Takoradi Division', regionId: 'wr', regionName: 'Western', code: 'WRS' },
];

export interface District {
  id: string;
  name: string;
  divisionId: string;
  divisionName: string;
  regionId: string;
  regionName: string;
  code: string;
}

export const MOCK_DISTRICTS: District[] = [
  { id: 'ga-accra-central', name: 'Accra Central District', divisionId: 'ga-accra-metro', divisionName: 'Accra Metropolitan Division', regionId: 'ga', regionName: 'Greater Accra', code: 'GAC' },
  { id: 'ga-accra-east', name: 'Accra East District', divisionId: 'ga-accra-metro', divisionName: 'Accra Metropolitan Division', regionId: 'ga', regionName: 'Greater Accra', code: 'GAE' },
  { id: 'ga-tema-central', name: 'Tema Central District', divisionId: 'ga-tema', divisionName: 'Tema Division', regionId: 'ga', regionName: 'Greater Accra', code: 'GTC' },
  { id: 'as-kumasi-central', name: 'Kumasi Central District', divisionId: 'as-kumasi-metro', divisionName: 'Kumasi Metropolitan Division', regionId: 'as', regionName: 'Ashanti', code: 'ASC' },
  { id: 'wr-sekondi-central', name: 'Sekondi Central District', divisionId: 'wr-sekondi', divisionName: 'Sekondi-Takoradi Division', regionId: 'wr', regionName: 'Western', code: 'WSC' },
];

// Standardized Station with full hierarchy
export const MOCK_STATIONS: Station[] = [
  {
    id: 'st-accra-central',
    name: 'Accra Central Station',
    code: 'GPS-GA-ACC-001',
    address: 'Kwame Nkrumah Avenue, Accra',
    phone: '030 266 4611',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    latitude: 5.55,
    longitude: -0.2,
    isActive: true
  },
  {
    id: 'st-osu',
    name: 'Osu Police Station',
    code: 'GPS-GA-ACC-002',
    address: 'Cantonments Rd, Osu',
    phone: '030 277 5739',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-east',
    districtName: 'Accra East District',
    latitude: 5.556,
    longitude: -0.183,
    isActive: true
  },
  {
    id: 'st-airport',
    name: 'Airport Police Station',
    code: 'GPS-GA-ACC-003',
    address: 'Liberation Rd, Airport City',
    phone: '030 277 7592',
    regionId: 'ga',
    regionName: 'Greater Accra',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    latitude: 5.603,
    longitude: -0.17,
    isActive: true
  },
];

// ============================================================================
// MASTER OFFENCE CATALOG
// ============================================================================

// Simple offence type for quick lookups (compatible with ticket selection)
export interface SimpleOffence {
  id: string;
  category: string;
  name: string;
  fine: number;
}

export const MOCK_OFFENCES: SimpleOffence[] = [
  // Speeding Offences
  { id: 'SPD-MINOR', category: 'speed', name: 'Speeding (10-20 km/h over limit)', fine: 150 },
  { id: 'SPD-MAJOR', category: 'speed', name: 'Speeding (21-30 km/h over limit)', fine: 200 },
  { id: 'SPD-SEVERE', category: 'speed', name: 'Speeding (31+ km/h over limit)', fine: 300 },
  
  // Parking Offences
  { id: 'ILP', category: 'parking', name: 'Illegal Parking', fine: 150 },
  { id: 'DNP', category: 'parking', name: 'Double Parking', fine: 100 },
  { id: 'PHZ', category: 'parking', name: 'Parking in Handicap Zone', fine: 250 },
  
  // Signal/Traffic Offences
  { id: 'RLV', category: 'traffic_signal', name: 'Red Light Violation', fine: 200 },
  { id: 'STV', category: 'traffic_signal', name: 'Stop Sign Violation', fine: 150 },
  { id: 'ILT', category: 'traffic_signal', name: 'Illegal U-Turn', fine: 100 },
  
  // Safety Offences
  { id: 'NSB', category: 'vehicle_condition', name: 'No Seatbelt', fine: 100 },
  { id: 'NHT', category: 'vehicle_condition', name: 'No Helmet (Motorcycle)', fine: 100 },
  { id: 'OVL', category: 'vehicle_condition', name: 'Overloading', fine: 200 },
  
  // Reckless Driving
  { id: 'PWD', category: 'dangerous_driving', name: 'Phone While Driving', fine: 150 },
  { id: 'RKD', category: 'dangerous_driving', name: 'Reckless Driving', fine: 300 },
  { id: 'TAC', category: 'dangerous_driving', name: 'Tailgating/Aggressive Driving', fine: 200 },
  
  // Documentation
  { id: 'NDL', category: 'documentation', name: 'No Driver License', fine: 200 },
  { id: 'EXL', category: 'documentation', name: 'Expired License', fine: 150 },
  { id: 'NIN', category: 'documentation', name: 'No Insurance', fine: 300 },
  { id: 'EXI', category: 'documentation', name: 'Expired Insurance', fine: 250 },
  
  // Other
  { id: 'OBR', category: 'other', name: 'Obstruction of Traffic', fine: 150 },
  { id: 'BLE', category: 'other', name: 'Blocking Emergency Vehicle', fine: 400 },
];

export const MOCK_TICKETS: TicketListItem[] = [
  {
    id: 'TKT-2026-001',
    ticketNumber: 'GPS-2026-0001',
    vehicleReg: 'GT-1234-25',
    status: 'unpaid',
    totalFine: 200,
    issuedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 mins ago
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    officerName: 'Sgt. Kwame Mensah',
    stationId: 'st-accra-central',
    stationName: 'Accra Central Station',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
    offenceCount: 1,
    syncStatus: 'synced'
  },
  {
    id: 'TKT-2026-002',
    ticketNumber: 'GPS-2026-0002',
    vehicleReg: 'GR-5678-24',
    status: 'paid',
    totalFine: 300,
    issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    officerName: 'Cpl. Sarah Osei',
    stationId: 'st-osu',
    stationName: 'Osu Police Station',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
    offenceCount: 2,
    syncStatus: 'synced'
  },
  {
    id: 'TKT-2026-003',
    ticketNumber: 'GPS-2026-0003',
    vehicleReg: 'AS-9012-25',
    status: 'objection',
    totalFine: 150,
    issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    officerName: 'Insp. John Doe',
    stationId: 'st-airport',
    stationName: 'Airport Police Station',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
    offenceCount: 1,
    syncStatus: 'synced'
  },
  {
    id: 'TKT-2026-004',
    ticketNumber: 'GPS-2026-0004',
    vehicleReg: 'GN-3456-23',
    status: 'unpaid',
    totalFine: 500,
    issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 13).toISOString(),
    officerName: 'Sgt. Kwame Mensah',
    stationId: 'st-accra-central',
    stationName: 'Accra Central Station',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
    offenceCount: 3,
    syncStatus: 'synced'
  },
  {
    id: 'TKT-2026-005',
    ticketNumber: 'GPS-2026-0005',
    vehicleReg: 'CR-7890-22',
    status: 'overdue',
    totalFine: 100,
    issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(), // 20 days ago
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    officerName: 'Cpl. Sarah Osei',
    stationId: 'st-osu',
    stationName: 'Osu Police Station',
    districtId: 'ga-accra-central',
    districtName: 'Accra Central District',
    divisionId: 'ga-accra-metro',
    divisionName: 'Accra Metropolitan Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
    offenceCount: 1,
    syncStatus: 'synced'
  }
];

// Full detailed tickets for detail view
export const MOCK_FULL_TICKETS: Ticket[] = [
  {
    id: 'TKT-2026-001',
    ticketNumber: 'GPS-2026-0001',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    issuedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    status: 'unpaid',
    vehicle: {
      registrationNumber: 'GT-1234-25',
      make: 'Toyota',
      model: 'Camry',
      color: 'Silver',
      type: 'car',
      ownerName: 'Kwabena Asare',
      ownerPhone: '0244567890',
      ownerAddress: 'House No. 23, Cantonments, Accra'
    },
    driver: {
      firstName: 'Kwabena',
      lastName: 'Asare',
      licenseNumber: 'DL-123456789',
      phone: '0244567890',
      address: 'House No. 23, Cantonments, Accra',
      idType: 'license',
      idNumber: 'DL-123456789'
    },
    offences: [
      {
        id: 'SPD',
        category: 'speed',
        name: 'Speeding (85 km/h in 60 km/h zone)',
        fine: 200,
        notes: 'Vehicle was traveling 25 km/h over the speed limit'
      }
    ],
    totalFine: 200,
    location: {
      latitude: 5.6037,
      longitude: -0.1870,
      accuracy: 10,
      address: 'Liberation Road, near Independence Square',
      landmark: 'Independence Square'
    },
    photos: [
      {
        id: 'photo-1',
        uri: '/demo-vehicle.jpg',
        type: 'vehicle',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        uploaded: true,
        remoteUrl: '/demo-vehicle.jpg'
      },
      {
        id: 'photo-2',
        uri: '/demo-plate.jpg',
        type: 'plate',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        uploaded: true,
        remoteUrl: '/demo-plate.jpg'
      },
      {
        id: 'photo-3',
        uri: '/demo-evidence.jpg',
        type: 'evidence',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        uploaded: true,
        remoteUrl: '/demo-evidence.jpg'
      }
    ],
    notes: 'Driver was cooperative. Speed was verified using radar gun. Clear weather conditions. Traffic was light. Driver acknowledged the violation.',
    notesList: [
      {
        id: 'note-1',
        content: 'Driver was cooperative. Speed was verified using radar gun. Clear weather conditions. Traffic was light. Driver acknowledged the violation.',
        officerId: 'OFF-001',
        officerName: 'Sgt. Kwame Mensah',
        officerEmail: 'kwame.mensah@gps.gov.gh',
        timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      }
    ],
    officerId: 'OFF-001',
    officerName: 'Sgt. Kwame Mensah',
    officerBadgeNumber: 'GPS-1001',
    stationId: 'st-accra-central',
    stationName: 'Accra Central Station',
    districtId: 'ga-accra-central',
    divisionId: 'ga-accra-metro',
    regionId: 'ga',
    paymentDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    syncStatus: 'synced',
    printed: true,
    printedAt: new Date(Date.now() - 1000 * 60 * 29).toISOString()
  },
  {
    id: 'TKT-2026-002',
    ticketNumber: 'GPS-2026-0002',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    status: 'paid',
    vehicle: {
      registrationNumber: 'GR-5678-24',
      make: 'Honda',
      model: 'Civic',
      color: 'Blue',
      type: 'car',
      ownerName: 'Ama Owusu',
      ownerPhone: '0201234567',
      ownerAddress: 'Plot 45, East Legon, Accra'
    },
    driver: {
      firstName: 'Ama',
      lastName: 'Owusu',
      licenseNumber: 'DL-987654321',
      phone: '0201234567',
      address: 'Plot 45, East Legon, Accra',
      idType: 'license',
      idNumber: 'DL-987654321'
    },
    offences: [
      {
        id: 'RLV',
        category: 'traffic_signal',
        name: 'Red Light Violation',
        fine: 150
      },
      {
        id: 'PWD',
        category: 'dangerous_driving',
        name: 'Phone While Driving',
        fine: 150
      }
    ],
    totalFine: 300,
    location: {
      latitude: 5.5600,
      longitude: -0.1969,
      accuracy: 15,
      address: 'Osu Oxford Street, near Danquah Circle',
      landmark: 'Danquah Circle'
    },
    photos: [
      {
        id: 'photo-4',
        uri: '/demo-vehicle-2.jpg',
        type: 'vehicle',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        uploaded: true
      },
      {
        id: 'photo-5',
        uri: '/demo-evidence-2.jpg',
        type: 'evidence',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
        uploaded: true
      }
    ],
    notes: 'Driver ran red light while using mobile phone. Both violations observed simultaneously. Driver initially denied phone usage but evidence photo shows otherwise.',
    officerId: 'OFF-002',
    officerName: 'Cpl. Sarah Osei',
    officerBadgeNumber: 'GPS-1002',
    stationId: 'st-osu',
    stationName: 'Osu Police Station',
    districtId: 'ga-accra-central',
    divisionId: 'ga-accra-metro',
    regionId: 'ga',
    paymentDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    paymentReference: 'PAY-2026-00234',
    paidAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    paidAmount: 300,
    paymentMethod: 'Mobile Money',
    syncStatus: 'synced',
    printed: true,
    printedAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString()
  },
  {
    id: 'TKT-2026-003',
    ticketNumber: 'GPS-2026-0003',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    status: 'objection',
    vehicle: {
      registrationNumber: 'AS-9012-25',
      make: 'Nissan',
      model: 'Sentra',
      color: 'Red',
      type: 'car',
      ownerName: 'Yaw Mensah',
      ownerPhone: '0247654321',
      ownerAddress: 'Street 12, Tema Community 1'
    },
    driver: {
      firstName: 'Yaw',
      lastName: 'Mensah',
      licenseNumber: 'DL-555666777',
      phone: '0247654321',
      address: 'Street 12, Tema Community 1',
      idType: 'license',
      idNumber: 'DL-555666777'
    },
    offences: [
      {
        id: 'ILP',
        category: 'parking',
        name: 'Illegal Parking',
        fine: 150
      }
    ],
    totalFine: 150,
    location: {
      latitude: 5.6200,
      longitude: -0.1752,
      accuracy: 12,
      address: 'Airport Residential Area, near Terminal 3',
      landmark: 'Kotoka International Airport'
    },
    photos: [
      {
        id: 'photo-6',
        uri: '/demo-vehicle-3.jpg',
        type: 'vehicle',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
        uploaded: true
      }
    ],
    notes: 'Vehicle was parked in a no-parking zone near the airport entrance. Driver claims he had emergency and no other parking was available.',
    officerId: 'OFF-003',
    officerName: 'Insp. John Doe',
    officerBadgeNumber: 'GPS-2001',
    stationId: 'st-airport',
    stationName: 'Airport Police Station',
    districtId: 'ga-accra-central',
    divisionId: 'ga-accra-metro',
    regionId: 'ga',
    paymentDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString(),
    objectionFiled: true,
    objectionDate: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    objectionReason: 'I had a medical emergency and there was no other place to park. I was only there for 5 minutes.',
    objectionStatus: 'pending',
    syncStatus: 'synced',
    printed: true,
    printedAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString()
  },
  {
    id: 'TKT-2026-004',
    ticketNumber: 'GPS-2026-0004',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    dueDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 13).toISOString(),
    status: 'unpaid',
    vehicle: {
      registrationNumber: 'GN-3456-23',
      make: 'Mercedes',
      model: 'E-Class',
      color: 'Black',
      type: 'car',
      ownerName: 'Akua Frimpong',
      ownerPhone: '0201112233',
      ownerAddress: 'Ridge Area, Accra'
    },
    driver: {
      firstName: 'Akua',
      lastName: 'Frimpong',
      licenseNumber: 'DL-999888777',
      phone: '0201112233',
      address: 'Ridge Area, Accra',
      idType: 'license',
      idNumber: 'DL-999888777'
    },
    offences: [
      {
        id: 'SPD',
        category: 'speed',
        name: 'Speeding',
        fine: 200
      },
      {
        id: 'PWD',
        category: 'dangerous_driving',
        name: 'Phone While Driving',
        fine: 150
      },
      {
        id: 'NSB',
        category: 'vehicle_condition',
        name: 'No Seatbelt',
        fine: 150
      }
    ],
    totalFine: 500,
    location: {
      latitude: 5.6520,
      longitude: -0.1975,
      accuracy: 8,
      address: 'Spintex Road, near Baatsona',
      landmark: 'Spintex Junction'
    },
    photos: [
      {
        id: 'photo-7',
        uri: '/demo-vehicle-4.jpg',
        type: 'vehicle',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        uploaded: true
      },
      {
        id: 'photo-8',
        uri: '/demo-evidence-4.jpg',
        type: 'evidence',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        uploaded: true
      }
    ],
    notes: 'Multiple violations observed. Driver was speeding (95 km/h in 60 zone), using phone, and not wearing seatbelt. Driver was argumentative but eventually complied.',
    officerId: 'OFF-001',
    officerName: 'Sgt. Kwame Mensah',
    officerBadgeNumber: 'GPS-1001',
    stationId: 'st-accra-central',
    stationName: 'Accra Central Station',
    districtId: 'ga-accra-central',
    divisionId: 'ga-accra-metro',
    regionId: 'ga',
    paymentDeadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 13).toISOString(),
    syncStatus: 'synced',
    printed: true,
    printedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString()
  },
  {
    id: 'TKT-2026-005',
    ticketNumber: 'GPS-2026-0005',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    updatedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    issuedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
    dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    status: 'overdue',
    vehicle: {
      registrationNumber: 'CR-7890-22',
      make: 'Hyundai',
      model: 'Elantra',
      color: 'White',
      type: 'car',
      ownerName: 'Kofi Boateng',
      ownerPhone: '0277889900',
      ownerAddress: 'Dansoman, Accra'
    },
    driver: {
      firstName: 'Kofi',
      lastName: 'Boateng',
      licenseNumber: 'DL-111222333',
      phone: '0277889900',
      address: 'Dansoman, Accra',
      idType: 'license',
      idNumber: 'DL-111222333'
    },
    offences: [
      {
        id: 'NSB',
        category: 'vehicle_condition',
        name: 'No Seatbelt',
        fine: 100
      }
    ],
    totalFine: 100,
    location: {
      latitude: 5.5563,
      longitude: -0.2069,
      accuracy: 20,
      address: 'High Street, Osu',
      landmark: 'Osu Castle Area'
    },
    photos: [
      {
        id: 'photo-9',
        uri: '/demo-evidence-5.jpg',
        type: 'evidence',
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        uploaded: true
      }
    ],
    notes: 'Driver was not wearing seatbelt. When stopped, driver became cooperative and acknowledged the violation.',
    officerId: 'OFF-002',
    officerName: 'Cpl. Sarah Osei',
    officerBadgeNumber: 'GPS-1002',
    stationId: 'st-osu',
    stationName: 'Osu Police Station',
    districtId: 'ga-accra-central',
    divisionId: 'ga-accra-metro',
    regionId: 'ga',
    paymentDeadline: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    syncStatus: 'synced',
    printed: true,
    printedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString()
  }
];

// ============================================================================
// OFFICERS - Expanded roster with proper station links
// ============================================================================

export const MOCK_OFFICERS: Officer[] = [
  {
    id: 'OFF-001',
    firstName: 'Kwame',
    lastName: 'Mensah',
    fullName: 'Kwame Mensah',
    email: 'kwame.mensah@gps.gov.gh',
    phone: '0244123456',
    badgeNumber: 'GPS-1001',
    rank: 'sergeant',
    rankDisplay: 'Sergeant',
    stationId: 'st-accra-central',
    station: MOCK_STATIONS[0],
    regionId: 'ga',
    stationName: 'Accra Central Station',
    role: 'officer',
    isActive: true,
    createdAt: '2018-05-15T00:00:00Z',
    status: 'active',
    joinedDate: '2018-05-15',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'OFF-002',
    firstName: 'Sarah',
    lastName: 'Osei',
    fullName: 'Sarah Osei',
    email: 'sarah.osei@gps.gov.gh',
    phone: '0200987654',
    badgeNumber: 'GPS-1002',
    rank: 'corporal',
    rankDisplay: 'Corporal',
    stationId: 'st-osu',
    station: MOCK_STATIONS[1],
    regionId: 'ga',
    stationName: 'Osu Police Station',
    role: 'officer',
    isActive: true,
    createdAt: '2020-02-10T00:00:00Z',
    status: 'active',
    joinedDate: '2020-02-10',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'OFF-003',
    firstName: 'John',
    lastName: 'Doe',
    fullName: 'John Doe',
    email: 'john.doe@gps.gov.gh',
    phone: '0555112233',
    badgeNumber: 'GPS-2001',
    rank: 'inspector',
    rankDisplay: 'Inspector',
    stationId: 'st-airport',
    station: MOCK_STATIONS[2],
    regionId: 'ga',
    stationName: 'Airport Police Station',
    role: 'supervisor',
    isActive: true,
    createdAt: '2015-11-20T00:00:00Z',
    status: 'active',
    joinedDate: '2015-11-20',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'OFF-004',
    firstName: 'Abena',
    lastName: 'Addo',
    fullName: 'Abena Addo',
    email: 'abena.addo@gps.gov.gh',
    phone: '0244556677',
    badgeNumber: 'GPS-1003',
    rank: 'constable',
    rankDisplay: 'Constable',
    stationId: 'st-accra-central',
    station: MOCK_STATIONS[0],
    regionId: 'ga',
    stationName: 'Accra Central Station',
    role: 'officer',
    isActive: true,
    createdAt: '2022-03-10T00:00:00Z',
    status: 'active',
    joinedDate: '2022-03-10',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'OFF-005',
    firstName: 'Kofi',
    lastName: 'Appiah',
    fullName: 'Kofi Appiah',
    email: 'kofi.appiah@gps.gov.gh',
    phone: '0201234568',
    badgeNumber: 'GPS-1004',
    rank: 'lance_corporal',
    rankDisplay: 'Lance Corporal',
    stationId: 'st-osu',
    station: MOCK_STATIONS[1],
    regionId: 'ga',
    stationName: 'Osu Police Station',
    role: 'officer',
    isActive: true,
    createdAt: '2021-07-15T00:00:00Z',
    status: 'active',
    joinedDate: '2021-07-15',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'OFF-006',
    firstName: 'Ama',
    lastName: 'Boateng',
    fullName: 'Ama Boateng',
    email: 'ama.boateng@gps.gov.gh',
    phone: '0277998877',
    badgeNumber: 'GPS-1005',
    rank: 'corporal',
    rankDisplay: 'Corporal',
    stationId: 'st-airport',
    station: MOCK_STATIONS[2],
    regionId: 'ga',
    stationName: 'Airport Police Station',
    role: 'officer',
    isActive: true,
    createdAt: '2019-09-20T00:00:00Z',
    status: 'active',
    joinedDate: '2019-09-20',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'OFF-007',
    firstName: 'Yaw',
    lastName: 'Darko',
    fullName: 'Yaw Darko',
    email: 'yaw.darko@gps.gov.gh',
    phone: '0244778899',
    badgeNumber: 'GPS-2002',
    rank: 'chief_inspector',
    rankDisplay: 'Chief Inspector',
    stationId: 'st-accra-central',
    station: MOCK_STATIONS[0],
    regionId: 'ga',
    stationName: 'Accra Central Station',
    role: 'supervisor',
    isActive: true,
    createdAt: '2012-04-05T00:00:00Z',
    status: 'active',
    joinedDate: '2012-04-05',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'OFF-008',
    firstName: 'Akosua',
    lastName: 'Frimpong',
    fullName: 'Akosua Frimpong',
    email: 'akosua.frimpong@gps.gov.gh',
    phone: '0201122334',
    badgeNumber: 'GPS-1006',
    rank: 'sergeant',
    rankDisplay: 'Sergeant',
    stationId: 'st-osu',
    station: MOCK_STATIONS[1],
    regionId: 'ga',
    stationName: 'Osu Police Station',
    role: 'officer',
    isActive: true,
    createdAt: '2017-11-12T00:00:00Z',
    status: 'active',
    joinedDate: '2017-11-12',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'OFF-009',
    firstName: 'Emmanuel',
    lastName: 'Gyasi',
    fullName: 'Emmanuel Gyasi',
    email: 'emmanuel.gyasi@gps.gov.gh',
    phone: '0555443322',
    badgeNumber: 'GPS-1007',
    rank: 'constable',
    rankDisplay: 'Constable',
    stationId: 'st-airport',
    station: MOCK_STATIONS[2],
    regionId: 'ga',
    stationName: 'Airport Police Station',
    role: 'officer',
    isActive: true,
    createdAt: '2023-01-20T00:00:00Z',
    status: 'active',
    joinedDate: '2023-01-20',
    lastLogin: new Date().toISOString()
  },
  {
    id: 'OFF-010',
    firstName: 'Grace',
    lastName: 'Hammond',
    fullName: 'Grace Hammond',
    email: 'grace.hammond@gps.gov.gh',
    phone: '0277665544',
    badgeNumber: 'GPS-3001',
    rank: 'assistant_superintendent',
    rankDisplay: 'Assistant Superintendent',
    stationId: 'st-accra-central',
    station: MOCK_STATIONS[0],
    regionId: 'ga',
    stationName: 'Accra Central Station',
    role: 'admin',
    isActive: true,
    createdAt: '2010-06-15T00:00:00Z',
    status: 'active',
    joinedDate: '2010-06-15',
    lastLogin: new Date().toISOString()
  }
];

// ============================================================================
// PAYMENTS - Complete payment records for paid tickets
// ============================================================================

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'PAY-2026-001',
    paymentReference: 'PAY-REF-234567',
    ticketId: 'TKT-2026-002',
    ticketNumber: 'GPS-2026-0002',
    amount: 300,
    currency: 'GHS',
    originalFine: 300,
    method: 'momo',
    methodName: 'MTN Mobile Money',
    phoneNumber: '0201234567',
    network: 'MTN',
    transactionId: 'MOMO-1234567890',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 1.5).toISOString(),
    processedAt: new Date(Date.now() - 1000 * 60 * 60 * 1.2).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    payerName: 'Ama Owusu',
    payerPhone: '0201234567',
    payerEmail: 'ama.owusu@email.com',
    receiptNumber: 'RCP-2026-001',
    processedById: 'OFF-002',
    processedByName: 'Cpl. Sarah Osei',
    stationId: 'st-osu'
  },
  {
    id: 'PAY-2026-002',
    paymentReference: 'PAY-REF-345678',
    ticketId: 'TKT-2026-005',
    ticketNumber: 'GPS-2026-0005',
    amount: 110,
    currency: 'GHS',
    originalFine: 100,
    lateFee: 10,
    method: 'card',
    methodName: 'Visa Card',
    cardLast4: '4532',
    cardBrand: 'Visa',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    processedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 15).toISOString(),
    payerName: 'Kofi Boateng',
    payerPhone: '0277889900',
    payerEmail: 'kofi.boateng@email.com',
    receiptNumber: 'RCP-2026-002',
    processedById: 'OFF-002',
    processedByName: 'Cpl. Sarah Osei',
    stationId: 'st-osu'
  },
  {
    id: 'PAY-2026-003',
    paymentReference: 'PAY-REF-456789',
    ticketId: 'TKT-2026-006',
    ticketNumber: 'GPS-2026-0006',
    amount: 150,
    currency: 'GHS',
    originalFine: 150,
    method: 'momo',
    methodName: 'Vodafone Cash',
    phoneNumber: '0205556677',
    network: 'Vodafone',
    transactionId: 'VODA-9876543210',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    processedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    payerName: 'Adjoa Mensah',
    payerPhone: '0205556677',
    receiptNumber: 'RCP-2026-003',
    processedById: 'OFF-004',
    processedByName: 'Abena Addo',
    stationId: 'st-accra-central'
  },
  {
    id: 'PAY-2026-004',
    paymentReference: 'PAY-REF-567890',
    ticketId: 'TKT-2026-007',
    ticketNumber: 'GPS-2026-0007',
    amount: 200,
    currency: 'GHS',
    originalFine: 200,
    method: 'cash',
    methodName: 'Cash Payment',
    status: 'completed',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    processedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    completedAt: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
    payerName: 'Kwesi Annan',
    payerPhone: '0244332211',
    receiptNumber: 'RCP-2026-004',
    processedById: 'OFF-006',
    processedByName: 'Cpl. Ama Boateng',
    stationId: 'st-airport'
  },
];

// ============================================================================
// OBJECTIONS - Linked to actual tickets
// ============================================================================

export interface Objection {
  id: string;
  ticketId: string;
  ticketNumber: string;
  vehicleReg: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedById?: string;
  reviewNotes?: string;
  driverName: string;
  driverPhone: string;
  driverEmail?: string;
  evidence?: string;
  offenceType: string;
  fineAmount: number;
}

export const MOCK_OBJECTIONS: Objection[] = [
  {
    id: 'OBJ-001',
    ticketId: 'TKT-2026-003',
    ticketNumber: 'GPS-2026-0003',
    vehicleReg: 'AS-9012-25',
    reason: 'I had a medical emergency and there was no other place to park. I was only there for 5 minutes.',
    status: 'pending',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString(),
    driverName: 'Yaw Mensah',
    driverPhone: '0247654321',
    driverEmail: 'yaw.mensah@email.com',
    evidence: 'Hospital admission slip attached',
    offenceType: 'Illegal Parking',
    fineAmount: 150
  },
  {
    id: 'OBJ-002',
    ticketId: 'TKT-2026-008',
    ticketNumber: 'GPS-2026-0008',
    vehicleReg: 'GT-5566-24',
    reason: 'The traffic light was yellow when I crossed, not red. I have dashcam footage.',
    status: 'approved',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    reviewedBy: 'Asst. Supt. Grace Hammond',
    reviewedById: 'OFF-010',
    reviewNotes: 'Dashcam footage confirms amber light at time of crossing. Objection approved.',
    driverName: 'Ama Serwaa',
    driverPhone: '0501234567',
    driverEmail: 'ama.serwaa@email.com',
    offenceType: 'Red Light Violation',
    fineAmount: 200
  },
  {
    id: 'OBJ-003',
    ticketId: 'TKT-2026-009',
    ticketNumber: 'GPS-2026-0009',
    vehicleReg: 'GN-7788-23',
    reason: 'The speed limit sign was obscured by tree branches. I was not aware of the speed limit.',
    status: 'rejected',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    reviewedBy: 'Asst. Supt. Grace Hammond',
    reviewedById: 'OFF-010',
    reviewNotes: 'Driver is responsible for knowing speed limits. Sign visibility was adequate.',
    driverName: 'Kwame Asare',
    driverPhone: '0244123456',
    driverEmail: 'kwame.asare@email.com',
    offenceType: 'Speeding',
    fineAmount: 200
  },
  {
    id: 'OBJ-004',
    ticketId: 'TKT-2026-010',
    ticketNumber: 'GPS-2026-0010',
    vehicleReg: 'CR-1122-23',
    reason: 'My car broke down and I had to stop. The hazard lights were on but may not have been visible.',
    status: 'pending',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    driverName: 'Efua Owusu',
    driverPhone: '0277889900',
    evidence: 'Mechanic receipt for towing service',
    offenceType: 'Obstruction of Traffic',
    fineAmount: 150
  }
];

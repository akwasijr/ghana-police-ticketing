// Mock Tickets Data - matches Ticket type from @/types/ticket.types.ts
import type { Ticket, TicketStatus, VehicleType, VehicleInfo, DriverInfo, GeoLocation, SelectedOffence, TicketPhoto } from '@/types';

// Helper to create tickets with consistent structure
function createTicket(
  id: string,
  ticketNumber: string,
  vehicle: VehicleInfo,
  driver: DriverInfo,
  offences: SelectedOffence[],
  location: GeoLocation,
  officer: { id: string; name: string; badge: string; stationId: string; stationName: string; regionId: string },
  status: TicketStatus,
  issuedAt: string,
  options?: {
    photos?: TicketPhoto[];
    paidAt?: string;
    paidAmount?: number;
    paymentMethod?: string;
    objectionFiled?: boolean;
    objectionStatus?: 'pending' | 'approved' | 'rejected';
    printed?: boolean;
  }
): Ticket {
  const totalFine = offences.reduce((sum, o) => sum + (o.customFine || o.fine), 0);
  const dueDate = new Date(new Date(issuedAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
  
  return {
    id,
    ticketNumber,
    createdAt: issuedAt,
    updatedAt: issuedAt,
    issuedAt,
    dueDate,
    status,
    vehicle,
    driver,
    offences,
    totalFine,
    location,
    photos: options?.photos || [],
    officerId: officer.id,
    officerName: officer.name,
    officerBadgeNumber: officer.badge,
    stationId: officer.stationId,
    stationName: officer.stationName,
    regionId: officer.regionId,
    paymentDeadline: dueDate,
    paidAt: options?.paidAt,
    paidAmount: options?.paidAmount,
    paymentMethod: options?.paymentMethod,
    objectionFiled: options?.objectionFiled,
    objectionStatus: options?.objectionStatus,
    syncStatus: 'synced',
    syncedAt: issuedAt,
    printed: options?.printed ?? true,
  };
}

// Greater Accra Region Tickets
export const MOCK_TICKETS: Ticket[] = [
  // Ticket 1 - Paid speeding ticket
  createTicket(
    'tkt-001',
    'GPS-2024-00001',
    {
      registrationNumber: 'GR-1234-21',
      make: 'Toyota',
      model: 'Camry',
      color: 'Silver',
      type: 'car' as VehicleType,
    },
    {
      firstName: 'Kofi',
      lastName: 'Asante',
      licenseNumber: 'DL-001234-2020',
      phone: '0244123456',
      idType: 'license',
      idNumber: 'DL-001234-2020',
    },
    [
      {
        id: 'off-spd-001',
        category: 'speed',
        name: 'Exceeding Speed Limit (20-30 km/h over)',
        fine: 200,
      },
    ],
    {
      latitude: 5.6037,
      longitude: -0.1870,
      accuracy: 10,
      address: 'Independence Avenue, Accra',
      landmark: 'Near Independence Arch',
    },
    {
      id: 'off-001',
      name: 'Sgt. Kwame Mensah',
      badge: 'GPS001',
      stationId: 'st-accra-central',
      stationName: 'Accra Central Station',
      regionId: 'ga',
    },
    'paid' as TicketStatus,
    '2024-12-01T10:30:00Z',
    {
      paidAt: '2024-12-05T14:20:00Z',
      paidAmount: 200,
      paymentMethod: 'momo',
    }
  ),

  // Ticket 2 - Paid parking violation
  createTicket(
    'tkt-002',
    'GPS-2024-00002',
    {
      registrationNumber: 'GN-2345-20',
      make: 'Honda',
      model: 'Civic',
      color: 'Blue',
      type: 'car' as VehicleType,
    },
    {
      firstName: 'Ama',
      lastName: 'Serwaa',
      phone: '0502345678',
    },
    [
      {
        id: 'off-prk-001',
        category: 'parking',
        name: 'Illegal Parking - No Parking Zone',
        fine: 150,
      },
    ],
    {
      latitude: 5.5560,
      longitude: -0.1969,
      accuracy: 15,
      address: 'Oxford Street, Osu',
      landmark: 'Osu Night Market area',
    },
    {
      id: 'off-002',
      name: 'Cpl. Sarah Osei',
      badge: 'GPS002',
      stationId: 'st-osu',
      stationName: 'Osu Police Station',
      regionId: 'ga',
    },
    'paid' as TicketStatus,
    '2024-12-02T09:15:00Z',
    {
      paidAt: '2024-12-03T10:05:00Z',
      paidAmount: 150,
      paymentMethod: 'vodacash',
    }
  ),

  // Ticket 3 - Pending with objection
  createTicket(
    'tkt-003',
    'GPS-2024-00003',
    {
      registrationNumber: 'GE-5678-22',
      make: 'Nissan',
      model: 'Sunny',
      color: 'White',
      type: 'car' as VehicleType,
    },
    {
      firstName: 'Emmanuel',
      lastName: 'Kwarteng',
      licenseNumber: 'DL-003456-2019',
      phone: '0244123789',
    },
    [
      {
        id: 'off-sig-001',
        category: 'traffic_signal',
        name: 'Running Red Light',
        fine: 300,
      },
    ],
    {
      latitude: 5.5913,
      longitude: -0.2228,
      accuracy: 8,
      address: 'Graphic Road Junction',
      landmark: 'Near Graphic Communications',
    },
    {
      id: 'off-001',
      name: 'Sgt. Kwame Mensah',
      badge: 'GPS001',
      stationId: 'st-accra-central',
      stationName: 'Accra Central Station',
      regionId: 'ga',
    },
    'objection' as TicketStatus,
    '2024-11-30T15:45:00Z',
    {
      objectionFiled: true,
      objectionStatus: 'pending',
    }
  ),

  // Ticket 4 - Unpaid overdue
  createTicket(
    'tkt-004',
    'GPS-2024-00004',
    {
      registrationNumber: 'GW-9012-23',
      make: 'Hyundai',
      model: 'Elantra',
      color: 'Black',
      type: 'car' as VehicleType,
    },
    {
      firstName: 'Yaw',
      lastName: 'Boateng',
      phone: '0277654321',
    },
    [
      {
        id: 'off-doc-001',
        category: 'documentation',
        name: 'Driving Without License',
        fine: 250,
      },
    ],
    {
      latitude: 5.6142,
      longitude: -0.2053,
      accuracy: 12,
      address: 'Ring Road Central',
    },
    {
      id: 'off-002',
      name: 'Cpl. Sarah Osei',
      badge: 'GPS002',
      stationId: 'st-osu',
      stationName: 'Osu Police Station',
      regionId: 'ga',
    },
    'overdue' as TicketStatus,
    '2024-10-15T11:30:00Z'
  ),

  // Ticket 5 - Cancelled
  createTicket(
    'tkt-005',
    'GPS-2024-00005',
    {
      registrationNumber: 'GT-3456-24',
      make: 'Mercedes',
      model: 'C-Class',
      color: 'Gray',
      type: 'car' as VehicleType,
    },
    {
      firstName: 'Akua',
      lastName: 'Mensah',
      phone: '0244987654',
    },
    [
      {
        id: 'off-prk-002',
        category: 'parking',
        name: 'Parking in Reserved VIP Zone',
        fine: 500,
      },
    ],
    {
      latitude: 5.6050,
      longitude: -0.1700,
      address: 'Kotoka International Airport',
      landmark: 'VIP Parking Area',
    },
    {
      id: 'off-003',
      name: 'Insp. John Appiah',
      badge: 'ADMIN01',
      stationId: 'st-airport',
      stationName: 'Airport Police Station',
      regionId: 'ga',
    },
    'cancelled' as TicketStatus,
    '2024-12-05T08:00:00Z'
  ),

  // Ticket 6 - Paid motorcycle
  createTicket(
    'tkt-006',
    'GPS-2024-00006',
    {
      registrationNumber: 'M-GR-789-22',
      make: 'Honda',
      model: 'CB125',
      color: 'Red',
      type: 'motorcycle' as VehicleType,
    },
    {
      firstName: 'Yaw',
      lastName: 'Mensah',
      phone: '0247111222',
    },
    [
      {
        id: 'off-saf-001',
        category: 'vehicle_condition',
        name: 'Riding Without Helmet',
        fine: 150,
      },
      {
        id: 'off-saf-002',
        category: 'vehicle_condition',
        name: 'No Side Mirrors',
        fine: 100,
      },
      {
        id: 'off-doc-002',
        category: 'documentation',
        name: 'Expired Registration',
        fine: 50,
      },
    ],
    {
      latitude: 5.5800,
      longitude: -0.2100,
      address: 'Adabraka Junction',
    },
    {
      id: 'off-001',
      name: 'Sgt. Kwame Mensah',
      badge: 'GPS001',
      stationId: 'st-accra-central',
      stationName: 'Accra Central Station',
      regionId: 'ga',
    },
    'paid' as TicketStatus,
    '2024-12-04T14:00:00Z',
    {
      paidAt: '2024-12-04T15:35:00Z',
      paidAmount: 300,
      paymentMethod: 'cash',
    }
  ),

  // Ticket 7 - Unpaid minibus
  createTicket(
    'tkt-007',
    'GPS-2024-00007',
    {
      registrationNumber: 'GS-4567-20',
      make: 'Toyota',
      model: 'Hiace',
      color: 'Yellow',
      type: 'minibus' as VehicleType,
    },
    {
      firstName: 'Kwesi',
      lastName: 'Darko',
      licenseNumber: 'DL-007890-2018',
      phone: '0277333444',
    },
    [
      {
        id: 'off-rck-001',
        category: 'dangerous_driving',
        name: 'Overloading Passengers',
        fine: 400,
      },
    ],
    {
      latitude: 5.5500,
      longitude: -0.2400,
      address: 'Circle Interchange',
      landmark: 'Kwame Nkrumah Circle',
    },
    {
      id: 'off-002',
      name: 'Cpl. Sarah Osei',
      badge: 'GPS002',
      stationId: 'st-accra-central',
      stationName: 'Accra Central Station',
      regionId: 'ga',
    },
    'unpaid' as TicketStatus,
    '2024-12-10T07:30:00Z'
  ),

  // Ticket 8 - Truck unpaid
  createTicket(
    'tkt-008',
    'GPS-2024-00008',
    {
      registrationNumber: 'GT-8901-21',
      make: 'MAN',
      model: 'TGS',
      color: 'Blue',
      type: 'truck' as VehicleType,
    },
    {
      firstName: 'Daniel',
      lastName: 'Asiedu',
      licenseNumber: 'DL-008901-2020',
      phone: '0244555666',
    },
    [
      {
        id: 'off-obs-001',
        category: 'other',
        name: 'Obstruction of Traffic - Improper Loading/Unloading',
        fine: 350,
      },
    ],
    {
      latitude: 5.5700,
      longitude: -0.1800,
      address: 'Ring Road West',
    },
    {
      id: 'off-001',
      name: 'Sgt. Kwame Mensah',
      badge: 'GPS001',
      stationId: 'st-accra-central',
      stationName: 'Accra Central Station',
      regionId: 'ga',
    },
    'unpaid' as TicketStatus,
    '2024-12-09T16:00:00Z'
  ),

  // Ticket 9 - Objection approved
  createTicket(
    'tkt-009',
    'GPS-2024-00009',
    {
      registrationNumber: 'AS-5678-22',
      make: 'Toyota',
      model: 'Corolla',
      color: 'White',
      type: 'car' as VehicleType,
    },
    {
      firstName: 'Grace',
      lastName: 'Addo',
      phone: '0277456123',
    },
    [
      {
        id: 'off-spd-002',
        category: 'speed',
        name: 'Exceeding Speed Limit',
        fine: 200,
      },
    ],
    {
      latitude: 5.6200,
      longitude: -0.1600,
      address: 'Liberation Road',
    },
    {
      id: 'off-002',
      name: 'Cpl. Sarah Osei',
      badge: 'GPS002',
      stationId: 'st-accra-central',
      stationName: 'Accra Central Station',
      regionId: 'ga',
    },
    'cancelled' as TicketStatus,
    '2024-11-20T09:00:00Z',
    {
      objectionFiled: true,
      objectionStatus: 'approved',
    }
  ),

  // Ticket 10 - Overdue with high fine
  createTicket(
    'tkt-010',
    'GPS-2024-00010',
    {
      registrationNumber: 'GR-1234-21',
      make: 'BMW',
      model: '3 Series',
      color: 'Black',
      type: 'car' as VehicleType,
    },
    {
      firstName: 'Daniel',
      lastName: 'Owusu',
      phone: '0502987654',
    },
    [
      {
        id: 'off-spd-003',
        category: 'speed',
        name: 'Exceeding Speed Limit (30+ km/h over)',
        fine: 350,
      },
    ],
    {
      latitude: 5.5600,
      longitude: -0.2000,
      address: 'Motorway Extension',
    },
    {
      id: 'off-001',
      name: 'Sgt. Kwame Mensah',
      badge: 'GPS001',
      stationId: 'st-osu',
      stationName: 'Osu Police Station',
      regionId: 'ga',
    },
    'overdue' as TicketStatus,
    '2024-11-01T14:30:00Z',
    {
      objectionFiled: true,
      objectionStatus: 'rejected',
    }
  ),

  // Ashanti Region Tickets
  createTicket(
    'tkt-ar-001',
    'GPS-2024-AR-00001',
    {
      registrationNumber: 'AS-1234-22',
      make: 'Toyota',
      model: 'Vitz',
      color: 'Silver',
      type: 'car' as VehicleType,
    },
    {
      firstName: 'Kofi',
      lastName: 'Antwi',
      phone: '0244999888',
    },
    [
      {
        id: 'off-spd-001',
        category: 'speed',
        name: 'Exceeding Speed Limit',
        fine: 200,
      },
    ],
    {
      latitude: 6.6885,
      longitude: -1.6244,
      address: 'Kumasi - Accra Road',
      landmark: 'Near Ahodwo Roundabout',
    },
    {
      id: 'off-ar-001',
      name: 'Sgt. Kofi Mensah',
      badge: 'GPS-AR-001',
      stationId: 'st-kumasi-central',
      stationName: 'Kumasi Central Station',
      regionId: 'ar',
    },
    'paid' as TicketStatus,
    '2024-12-08T15:00:00Z',
    {
      paidAt: '2024-12-08T16:05:00Z',
      paidAmount: 200,
      paymentMethod: 'momo',
    }
  ),

  createTicket(
    'tkt-ar-002',
    'GPS-2024-AR-00002',
    {
      registrationNumber: 'AS-5678-21',
      make: 'Nissan',
      model: 'Almera',
      color: 'Blue',
      type: 'car' as VehicleType,
    },
    {
      firstName: 'Ama',
      lastName: 'Owusu',
      phone: '0322111222',
    },
    [
      {
        id: 'off-prk-001',
        category: 'parking',
        name: 'Illegal Parking',
        fine: 150,
      },
    ],
    {
      latitude: 6.6900,
      longitude: -1.6200,
      address: 'Kejetia Market Area',
    },
    {
      id: 'off-ar-002',
      name: 'Cpl. Abena Sarpong',
      badge: 'GPS-AR-002',
      stationId: 'st-kumasi-central',
      stationName: 'Kumasi Central Station',
      regionId: 'ar',
    },
    'unpaid' as TicketStatus,
    '2024-12-10T10:00:00Z'
  ),

  // Tricycle ticket (pragya/aboboyaa)
  createTicket(
    'tkt-011',
    'GPS-2024-00011',
    {
      registrationNumber: 'M-GR-TRC-123',
      make: 'Apsonic',
      color: 'Yellow',
      type: 'tricycle' as VehicleType,
    },
    {
      firstName: 'Ibrahim',
      lastName: 'Mohammed',
      phone: '0245678901',
    },
    [
      {
        id: 'off-saf-003',
        category: 'vehicle_condition',
        name: 'Operating on Highway',
        fine: 200,
      },
    ],
    {
      latitude: 5.5800,
      longitude: -0.2300,
      address: 'Graphic Road',
    },
    {
      id: 'off-001',
      name: 'Sgt. Kwame Mensah',
      badge: 'GPS001',
      stationId: 'st-accra-central',
      stationName: 'Accra Central Station',
      regionId: 'ga',
    },
    'unpaid' as TicketStatus,
    '2024-12-11T08:00:00Z'
  ),

  // Taxi ticket
  createTicket(
    'tkt-012',
    'GPS-2024-00012',
    {
      registrationNumber: 'GT-TX-5678',
      make: 'Toyota',
      model: 'Yaris',
      color: 'Yellow/Red',
      type: 'taxi' as VehicleType,
    },
    {
      firstName: 'Samuel',
      lastName: 'Mensah',
      licenseNumber: 'DL-TAXI-001',
      phone: '0244777888',
    },
    [
      {
        id: 'off-obs-002',
        category: 'other',
        name: 'Stopping in No-Stopping Zone',
        fine: 150,
      },
    ],
    {
      latitude: 5.5560,
      longitude: -0.1969,
      address: 'Oxford Street, Osu',
    },
    {
      id: 'off-002',
      name: 'Cpl. Sarah Osei',
      badge: 'GPS002',
      stationId: 'st-osu',
      stationName: 'Osu Police Station',
      regionId: 'ga',
    },
    'objection' as TicketStatus,
    '2024-12-09T14:00:00Z',
    {
      objectionFiled: true,
      objectionStatus: 'pending',
    }
  ),
];

// Get tickets by status
export function getTicketsByStatus(tickets: Ticket[], status: TicketStatus): Ticket[] {
  return tickets.filter(t => t.status === status);
}

// Get tickets by region
export function getTicketsByRegion(tickets: Ticket[], regionId: string): Ticket[] {
  return tickets.filter(t => t.regionId === regionId);
}

// Get tickets by station
export function getTicketsByStation(tickets: Ticket[], stationId: string): Ticket[] {
  return tickets.filter(t => t.stationId === stationId);
}

// Get ticket stats
export function getTicketStats(tickets: Ticket[]) {
  const unpaid = tickets.filter(t => t.status === 'unpaid');
  const paid = tickets.filter(t => t.status === 'paid');
  const overdue = tickets.filter(t => t.status === 'overdue');
  const objections = tickets.filter(t => t.status === 'objection');
  const cancelled = tickets.filter(t => t.status === 'cancelled');

  const totalFines = tickets.reduce((sum, t) => sum + t.totalFine, 0);
  const collectedAmount = paid.reduce((sum, t) => sum + (t.paidAmount || t.totalFine), 0);
  const pendingAmount = [...unpaid, ...overdue].reduce((sum, t) => sum + t.totalFine, 0);

  return {
    total: tickets.length,
    unpaidCount: unpaid.length,
    paidCount: paid.length,
    overdueCount: overdue.length,
    objectionCount: objections.length,
    cancelledCount: cancelled.length,
    totalFines,
    collectedAmount,
    pendingAmount,
    collectionRate: totalFines > 0 ? collectedAmount / totalFines : 0,
  };
}

// Filter tickets
export function filterTickets(
  tickets: Ticket[],
  filters: {
    status?: TicketStatus | TicketStatus[];
    regionId?: string;
    stationId?: string;
    officerId?: string;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
    vehicleType?: VehicleType;
  }
): Ticket[] {
  return tickets.filter(ticket => {
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      if (!statuses.includes(ticket.status)) return false;
    }

    // Hierarchy filters
    if (filters.regionId && ticket.regionId !== filters.regionId) return false;
    if (filters.stationId && ticket.stationId !== filters.stationId) return false;
    if (filters.officerId && ticket.officerId !== filters.officerId) return false;

    // Date filters
    if (filters.dateFrom && new Date(ticket.issuedAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(ticket.issuedAt) > new Date(filters.dateTo)) return false;

    // Vehicle type
    if (filters.vehicleType && ticket.vehicle.type !== filters.vehicleType) return false;

    // Search
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      const matchesTicket = ticket.ticketNumber.toLowerCase().includes(searchLower);
      const matchesVehicle = ticket.vehicle.registrationNumber.toLowerCase().includes(searchLower);
      const matchesDriver = ticket.driver
        ? `${ticket.driver.firstName} ${ticket.driver.lastName}`.toLowerCase().includes(searchLower)
        : false;
      if (!matchesTicket && !matchesVehicle && !matchesDriver) return false;
    }

    return true;
  });
}

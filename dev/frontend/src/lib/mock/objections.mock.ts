// Mock Objections Data - matches Objection type from @/types/objection.types.ts
import type { Objection, ObjectionStatus, ObjectionStats } from '@/types';

export const MOCK_OBJECTIONS: Objection[] = [
  {
    id: 'obj-001',
    ticketId: 'tkt-003',
    ticketNumber: 'GPS-2024-00003',
    vehicleReg: 'GN-2345-20',
    reason: 'The traffic signal was malfunctioning at the time of the alleged violation. I have dashcam footage showing the light was stuck on amber for an extended period.',
    evidence: 'Dashcam video showing malfunctioning traffic light',
    attachments: [
      {
        id: 'att-001',
        type: 'video',
        url: '/uploads/obj-001/dashcam.mp4',
        name: 'dashcam_footage.mp4',
        uploadedAt: '2024-12-01T14:30:00Z',
      },
    ],
    status: 'pending' as ObjectionStatus,
    submittedAt: '2024-12-01T14:30:00Z',
    driverName: 'Emmanuel Kwarteng',
    driverPhone: '0244123789',
    driverEmail: 'e.kwarteng@email.com',
    offenceType: 'Running Red Light',
    fineAmount: 300,
    stationId: 'st-accra-central',
    stationName: 'Accra Central Station',
    districtId: 'dist-accra-metro',
    districtName: 'Accra Metropolitan',
    divisionId: 'div-accra',
    divisionName: 'Accra Division',
    regionId: 'ga',
    regionName: 'Greater Accra',
  },
  {
    id: 'obj-002',
    ticketId: 'tkt-009',
    ticketNumber: 'GPS-2024-00009',
    vehicleReg: 'AS-5678-22',
    reason: 'I was not driving the vehicle at the time. My vehicle was stolen and has since been recovered by police. I have the police report.',
    evidence: 'Police report for stolen vehicle',
    attachments: [
      {
        id: 'att-002',
        type: 'document',
        url: '/uploads/obj-002/police_report.pdf',
        name: 'police_report.pdf',
        uploadedAt: '2024-11-25T09:00:00Z',
      },
    ],
    status: 'approved' as ObjectionStatus,
    submittedAt: '2024-11-25T09:00:00Z',
    reviewedAt: '2024-11-28T09:00:00Z',
    reviewedBy: 'Insp. John Appiah',
    reviewedById: 'off-003',
    reviewNotes: 'Police report verified. Vehicle was confirmed stolen at the time of offense.',
    driverName: 'Grace Addo',
    driverPhone: '0277456123',
    offenceType: 'Speeding',
    fineAmount: 200,
    stationId: 'st-accra-central',
    stationName: 'Accra Central Station',
    regionId: 'ga',
    regionName: 'Greater Accra',
  },
  {
    id: 'obj-003',
    ticketId: 'tkt-010',
    ticketNumber: 'GPS-2024-00010',
    vehicleReg: 'GR-1234-21',
    reason: 'I was rushing to the hospital with my pregnant wife. This was a medical emergency.',
    evidence: 'Hospital admission records showing emergency admission',
    attachments: [
      {
        id: 'att-003',
        type: 'document',
        url: '/uploads/obj-003/hospital_record.pdf',
        name: 'hospital_admission.pdf',
        uploadedAt: '2024-12-06T10:00:00Z',
      },
    ],
    status: 'rejected' as ObjectionStatus,
    submittedAt: '2024-12-06T10:00:00Z',
    reviewedAt: '2024-12-08T14:00:00Z',
    reviewedBy: 'Insp. John Appiah',
    reviewedById: 'off-003',
    reviewNotes: 'While sympathetic to the circumstances, emergency does not exempt drivers from traffic laws. Recommend early payment discount.',
    driverName: 'Daniel Owusu',
    driverPhone: '0502987654',
    offenceType: 'Speeding (30+ over limit)',
    fineAmount: 350,
    stationId: 'st-osu',
    stationName: 'Osu Police Station',
    regionId: 'ga',
    regionName: 'Greater Accra',
  },
  {
    id: 'obj-004',
    ticketId: 'tkt-012',
    ticketNumber: 'GPS-2024-00012',
    vehicleReg: 'GW-7890-23',
    reason: 'The no-parking sign was obscured by overgrown vegetation. I have photos showing the sign was not visible from the approach.',
    evidence: 'Photos showing obscured sign',
    attachments: [
      {
        id: 'att-004',
        type: 'image',
        url: '/uploads/obj-004/sign_photo_1.jpg',
        name: 'obscured_sign_1.jpg',
        uploadedAt: '2024-12-09T16:00:00Z',
      },
      {
        id: 'att-005',
        type: 'image',
        url: '/uploads/obj-004/sign_photo_2.jpg',
        name: 'obscured_sign_2.jpg',
        uploadedAt: '2024-12-09T16:00:00Z',
      },
    ],
    status: 'pending' as ObjectionStatus,
    submittedAt: '2024-12-09T16:00:00Z',
    driverName: 'Akosua Mensah',
    driverPhone: '0244567890',
    driverEmail: 'akosua.m@email.com',
    offenceType: 'Illegal Parking',
    fineAmount: 150,
    stationId: 'st-airport',
    stationName: 'Airport Police Station',
    regionId: 'ga',
    regionName: 'Greater Accra',
  },
  {
    id: 'obj-005',
    ticketId: 'tkt-015',
    ticketNumber: 'GPS-2024-00015',
    vehicleReg: 'GE-3456-19',
    reason: 'License plate was incorrectly recorded. My vehicle is registered as GE-3456-19 but ticket shows GE-3456-91.',
    status: 'pending' as ObjectionStatus,
    submittedAt: '2024-12-10T11:00:00Z',
    driverName: 'Kwabena Asante',
    driverPhone: '0267123456',
    offenceType: 'Overspeeding',
    fineAmount: 250,
    stationId: 'st-tema',
    stationName: 'Tema Police Station',
    regionId: 'ga',
    regionName: 'Greater Accra',
  },
  {
    id: 'obj-006',
    ticketId: 'tkt-ar-005',
    ticketNumber: 'GPS-2024-AR-00005',
    vehicleReg: 'AR-9012-22',
    reason: 'I was parked in a designated commercial vehicle zone with valid permit. The officer did not check for my permit.',
    evidence: 'Commercial vehicle parking permit',
    attachments: [
      {
        id: 'att-006',
        type: 'document',
        url: '/uploads/obj-006/parking_permit.pdf',
        name: 'commercial_permit.pdf',
        uploadedAt: '2024-12-07T08:00:00Z',
      },
    ],
    status: 'approved' as ObjectionStatus,
    submittedAt: '2024-12-07T08:00:00Z',
    reviewedAt: '2024-12-09T10:00:00Z',
    reviewedBy: 'Sgt. Kofi Mensah',
    reviewedById: 'off-ar-001',
    reviewNotes: 'Permit verified. Ticket cancelled. Officer reminded to check for commercial permits.',
    driverName: 'Peter Agyemang',
    driverPhone: '0322456789',
    offenceType: 'Unauthorized Commercial Parking',
    fineAmount: 200,
    stationId: 'st-kumasi-central',
    stationName: 'Kumasi Central Station',
    regionId: 'ar',
    regionName: 'Ashanti Region',
  },
];

// Stats calculation
export function getObjectionStats(objections: Objection[]): ObjectionStats {
  const pending = objections.filter(o => o.status === 'pending').length;
  const approved = objections.filter(o => o.status === 'approved').length;
  const rejected = objections.filter(o => o.status === 'rejected').length;
  const total = objections.length;
  const resolved = approved + rejected;
  
  // Calculate average resolution time for resolved objections
  let totalResolutionHours = 0;
  objections.forEach(o => {
    if (o.reviewedAt && o.submittedAt) {
      const submitted = new Date(o.submittedAt).getTime();
      const reviewed = new Date(o.reviewedAt).getTime();
      totalResolutionHours += (reviewed - submitted) / (1000 * 60 * 60);
    }
  });
  
  return {
    total,
    pending,
    approved,
    rejected,
    approvalRate: resolved > 0 ? approved / resolved : 0,
    avgResolutionTime: resolved > 0 ? totalResolutionHours / resolved : 0,
  };
}

// Filter helper
export function filterObjections(
  objections: Objection[],
  filters: {
    status?: ObjectionStatus | ObjectionStatus[];
    search?: string;
    stationId?: string;
    regionId?: string;
    dateFrom?: string;
    dateTo?: string;
  }
): Objection[] {
  return objections.filter(objection => {
    // Status filter
    if (filters.status) {
      const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
      if (!statuses.includes(objection.status)) return false;
    }
    
    // Station/Region filter
    if (filters.stationId && objection.stationId !== filters.stationId) return false;
    if (filters.regionId && objection.regionId !== filters.regionId) return false;
    
    // Date filters
    if (filters.dateFrom && new Date(objection.submittedAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(objection.submittedAt) > new Date(filters.dateTo)) return false;
    
    // Search filter
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !objection.ticketNumber.toLowerCase().includes(searchLower) &&
        !objection.vehicleReg.toLowerCase().includes(searchLower) &&
        !objection.driverName.toLowerCase().includes(searchLower) &&
        !objection.reason.toLowerCase().includes(searchLower)
      ) {
        return false;
      }
    }
    
    return true;
  });
}

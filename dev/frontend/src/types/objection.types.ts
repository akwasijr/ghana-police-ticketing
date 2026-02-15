// Objection Types

export type ObjectionStatus = 'pending' | 'approved' | 'rejected';

export interface Objection {
  id: string;
  ticketId: string;
  ticketNumber: string;
  vehicleReg: string;
  
  // Reason and evidence
  reason: string;
  details?: string;
  evidence?: string;
  attachments?: ObjectionAttachment[];

  // Status tracking
  status: ObjectionStatus;
  submittedAt: string;
  reviewDeadline?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewedById?: string;
  reviewNotes?: string;
  adjustedFine?: number;
  
  // Driver info
  driverName: string;
  driverPhone: string;
  driverEmail?: string;
  
  // Ticket details
  offenceType: string;
  fineAmount: number;
  
  // Hierarchy for filtering
  stationId?: string;
  stationName?: string;
  districtId?: string;
  districtName?: string;
  divisionId?: string;
  divisionName?: string;
  regionId?: string;
  regionName?: string;
}

export interface ObjectionAttachment {
  id: string;
  type: 'image' | 'document' | 'video';
  url: string;
  name: string;
  uploadedAt: string;
}

export interface ObjectionFilters {
  search?: string;
  status?: ObjectionStatus | ObjectionStatus[];
  dateFrom?: string;
  dateTo?: string;
  stationId?: string;
  regionId?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface ObjectionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  avgResolutionTimeHours: number;
}

export interface ObjectionReviewInput {
  objectionId: string;
  decision: 'approve' | 'reject';
  reviewNotes: string;
  reviewerId: string;
  reviewerName: string;
}

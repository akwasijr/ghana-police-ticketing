export interface Offence {
  id: string;
  code: string; // e.g., "SPD-001", "RLV-002"
  name: string; // e.g., "Speeding", "Red Light Violation"
  description?: string;
  legalBasis?: string;
  category: OffenceCategory;
  defaultFine: number; // Fine amount in GH₵
  minFine: number;
  maxFine: number;
  points?: number; // Penalty points if applicable
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type OffenceCategory =
  | 'speed'
  | 'traffic_signal'
  | 'documentation'
  | 'vehicle_condition'
  | 'parking'
  | 'dangerous_driving'
  | 'licensing'
  | 'obstruction'
  | 'other';

export const OFFENCE_CATEGORIES: { value: OffenceCategory; label: string }[] = [
  { value: 'speed', label: 'Speed Violations' },
  { value: 'traffic_signal', label: 'Traffic Signal Violations' },
  { value: 'documentation', label: 'Documentation Offences' },
  { value: 'vehicle_condition', label: 'Vehicle Condition' },
  { value: 'parking', label: 'Parking Violations' },
  { value: 'dangerous_driving', label: 'Dangerous Driving' },
  { value: 'licensing', label: 'Licensing Offences' },
  { value: 'obstruction', label: 'Obstruction' },
  { value: 'other', label: 'Other Offences' },
];

export interface OffenceFormData {
  code: string;
  name: string;
  description: string;
  legalBasis: string;
  category: OffenceCategory;
  defaultFine: number;
  minFine: number;
  maxFine: number;
  points?: number;
}

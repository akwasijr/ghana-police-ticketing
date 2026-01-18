/**
 * NewTicket Types & Constants
 * 
 * Shared types and constants used across all ticket creation steps
 */

import type { LucideIcon } from 'lucide-react';
import {
  Zap,
  StopCircle,
  ShieldOff,
  Smartphone,
  ParkingCircle,
  ArrowLeftRight,
  Lightbulb,
  AlertOctagon,
  Beer,
  FileX,
  AlertTriangle,
} from 'lucide-react';
import type { OffenceCategory } from '@/types/offence.types';

// Step definitions
export const TICKET_STEPS = [
  { id: 1, name: 'Vehicle & Driver' },
  { id: 2, name: 'Select Violation' },
  { id: 3, name: 'Add Photos' },
  { id: 4, name: 'Review & Print' },
] as const;

// Vehicle types
export const VEHICLE_TYPES = [
  'Saloon Car', 'SUV', 'Pickup', 'Bus', 'Minibus (Trotro)', 
  'Motorcycle', 'Tricycle', 'Truck', 'Taxi', 'Other'
] as const;

// Icon mapping for offence IDs
export const OFFENCE_ICONS: Record<string, LucideIcon> = {
  'off-001': Zap,           // Exceeding Speed Limit
  'off-002': Zap,           // Reckless Speeding
  'off-003': StopCircle,    // Red Light Violation
  'off-004': StopCircle,    // Failure to Obey Traffic Signs
  'off-005': FileX,         // Driving Without License
  'off-006': FileX,         // Expired Vehicle Registration
  'off-007': FileX,         // No Insurance
  'off-008': ShieldOff,     // No Seatbelt
  'off-009': Smartphone,    // Using Mobile Phone While Driving
  'off-010': Beer,          // Drunk Driving
  'off-011': ParkingCircle, // Illegal Parking
  'off-012': ParkingCircle, // Double Parking
  'off-013': Lightbulb,     // Defective Lights
  'off-014': AlertOctagon,  // Overloading
  'off-015': ArrowLeftRight, // Dangerous Overtaking
};

// Default icon for categories
export const CATEGORY_ICONS: Record<OffenceCategory, LucideIcon> = {
  speed: Zap,
  traffic_signal: StopCircle,
  documentation: FileX,
  vehicle_condition: Lightbulb,
  parking: ParkingCircle,
  dangerous_driving: AlertOctagon,
  licensing: FileX,
  other: AlertTriangle,
};

// Violation item type for UI display
export interface ViolationItem {
  id: string;
  name: string;
  fine: number;
  icon: LucideIcon;
  category: OffenceCategory;
  code: string;
}

// Step navigation actions
export interface StepNavigationProps {
  onNext: () => void;
  onBack: () => void;
  canProceed: boolean;
  isLastStep?: boolean;
}

// Common step props
export interface StepProps {
  onValidChange?: (isValid: boolean) => void;
}

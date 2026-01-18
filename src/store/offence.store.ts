import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { Offence, OffenceFormData } from '@/types/offence.types';

// Default offences based on Ghana Road Traffic Regulations
const DEFAULT_OFFENCES: Offence[] = [
  {
    id: 'off-001',
    code: 'SPD-001',
    name: 'Exceeding Speed Limit',
    description: 'Driving above the posted speed limit in a designated zone',
    legalBasis: 'Road Traffic Act 2004 (Act 683), Section 15(1)',
    category: 'speed',
    defaultFine: 200,
    minFine: 100,
    maxFine: 500,
    points: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-002',
    code: 'SPD-002',
    name: 'Reckless Speeding',
    description: 'Driving at excessive speed endangering other road users',
    legalBasis: 'Road Traffic Act 2004 (Act 683), Section 15(2)',
    category: 'speed',
    defaultFine: 500,
    minFine: 300,
    maxFine: 1000,
    points: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-003',
    code: 'TRF-001',
    name: 'Red Light Violation',
    description: 'Failing to stop at a red traffic signal',
    legalBasis: 'Road Traffic Regulations 2012 (L.I. 2180), Regulation 42',
    category: 'traffic_signal',
    defaultFine: 300,
    minFine: 200,
    maxFine: 600,
    points: 4,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-004',
    code: 'TRF-002',
    name: 'Failure to Obey Traffic Signs',
    description: 'Ignoring or disobeying mandatory traffic signs',
    legalBasis: 'Road Traffic Regulations 2012 (L.I. 2180), Regulation 38',
    category: 'traffic_signal',
    defaultFine: 150,
    minFine: 100,
    maxFine: 400,
    points: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-005',
    code: 'DOC-001',
    name: 'Driving Without License',
    description: 'Operating a motor vehicle without a valid driver\'s license',
    legalBasis: 'Road Traffic Act 2004 (Act 683), Section 30',
    category: 'licensing',
    defaultFine: 400,
    minFine: 200,
    maxFine: 800,
    points: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-006',
    code: 'DOC-002',
    name: 'Expired Vehicle Registration',
    description: 'Operating a vehicle with expired registration',
    legalBasis: 'Road Traffic Act 2004 (Act 683), Section 8',
    category: 'documentation',
    defaultFine: 250,
    minFine: 150,
    maxFine: 500,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-007',
    code: 'DOC-003',
    name: 'No Insurance',
    description: 'Driving without valid third-party insurance',
    legalBasis: 'Motor Vehicles (Third Party Insurance) Act 1958 (Act 42), Section 3',
    category: 'documentation',
    defaultFine: 500,
    minFine: 300,
    maxFine: 1000,
    points: 6,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-008',
    code: 'SAF-001',
    name: 'No Seatbelt',
    description: 'Driver or passenger not wearing seatbelt',
    legalBasis: 'Road Traffic Regulations 2012 (L.I. 2180), Regulation 94',
    category: 'vehicle_condition',
    defaultFine: 120,
    minFine: 60,
    maxFine: 300,
    points: 2,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-009',
    code: 'SAF-002',
    name: 'Using Mobile Phone While Driving',
    description: 'Using handheld mobile device while operating a vehicle',
    legalBasis: 'Road Traffic Regulations 2012 (L.I. 2180), Regulation 101',
    category: 'dangerous_driving',
    defaultFine: 200,
    minFine: 100,
    maxFine: 400,
    points: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-010',
    code: 'DUI-001',
    name: 'Drunk Driving',
    description: 'Operating a vehicle under the influence of alcohol',
    legalBasis: 'Road Traffic Act 2004 (Act 683), Section 51',
    category: 'dangerous_driving',
    defaultFine: 1000,
    minFine: 500,
    maxFine: 2000,
    points: 10,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-011',
    code: 'PRK-001',
    name: 'Illegal Parking',
    description: 'Parking in a no-parking zone or restricted area',
    legalBasis: 'Road Traffic Regulations 2012 (L.I. 2180), Regulation 70',
    category: 'parking',
    defaultFine: 100,
    minFine: 50,
    maxFine: 250,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-012',
    code: 'PRK-002',
    name: 'Double Parking',
    description: 'Parking alongside another parked vehicle',
    legalBasis: 'Road Traffic Regulations 2012 (L.I. 2180), Regulation 71',
    category: 'parking',
    defaultFine: 150,
    minFine: 75,
    maxFine: 300,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-013',
    code: 'VEH-001',
    name: 'Defective Lights',
    description: 'Operating vehicle with non-functioning headlights or taillights',
    legalBasis: 'Road Traffic Regulations 2012 (L.I. 2180), Regulation 85',
    category: 'vehicle_condition',
    defaultFine: 100,
    minFine: 50,
    maxFine: 200,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-014',
    code: 'VEH-002',
    name: 'Overloading',
    description: 'Carrying passengers or cargo beyond vehicle capacity',
    legalBasis: 'Road Traffic Act 2004 (Act 683), Section 25',
    category: 'vehicle_condition',
    defaultFine: 300,
    minFine: 150,
    maxFine: 600,
    points: 3,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'off-015',
    code: 'DNG-001',
    name: 'Dangerous Overtaking',
    description: 'Overtaking in a manner that endangers other road users',
    legalBasis: 'Road Traffic Regulations 2012 (L.I. 2180), Regulation 52',
    category: 'dangerous_driving',
    defaultFine: 400,
    minFine: 200,
    maxFine: 800,
    points: 5,
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

interface OffenceState {
  offences: Offence[];
  isLoading: boolean;
  
  // Actions
  addOffence: (data: OffenceFormData) => Offence;
  updateOffence: (id: string, data: Partial<OffenceFormData>) => void;
  deleteOffence: (id: string) => void;
  toggleOffenceStatus: (id: string) => void;
  updateFine: (id: string, newFine: number) => void;
  getOffenceById: (id: string) => Offence | undefined;
  getOffencesByCategory: (category: string) => Offence[];
  getActiveOffences: () => Offence[];
  resetToDefaults: () => void;
}

export const useOffenceStore = create<OffenceState>()(
  persist(
    (set, get) => ({
      offences: DEFAULT_OFFENCES,
      isLoading: false,

      addOffence: (data: OffenceFormData) => {
        const newOffence: Offence = {
          id: `off-${Date.now()}`,
          ...data,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        set((state) => ({
          offences: [...state.offences, newOffence],
        }));

        return newOffence;
      },

      updateOffence: (id: string, data: Partial<OffenceFormData>) => {
        set((state) => ({
          offences: state.offences.map((o) =>
            o.id === id
              ? { ...o, ...data, updatedAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      deleteOffence: (id: string) => {
        set((state) => ({
          offences: state.offences.filter((o) => o.id !== id),
        }));
      },

      toggleOffenceStatus: (id: string) => {
        set((state) => ({
          offences: state.offences.map((o) =>
            o.id === id
              ? { ...o, isActive: !o.isActive, updatedAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      updateFine: (id: string, newFine: number) => {
        const offence = get().offences.find((o) => o.id === id);
        if (!offence) return;

        // Ensure fine is within min/max bounds
        const clampedFine = Math.max(offence.minFine, Math.min(offence.maxFine, newFine));

        set((state) => ({
          offences: state.offences.map((o) =>
            o.id === id
              ? { ...o, defaultFine: clampedFine, updatedAt: new Date().toISOString() }
              : o
          ),
        }));
      },

      getOffenceById: (id: string) => {
        return get().offences.find((o) => o.id === id);
      },

      getOffencesByCategory: (category: string) => {
        return get().offences.filter((o) => o.category === category);
      },

      getActiveOffences: () => {
        return get().offences.filter((o) => o.isActive);
      },

      resetToDefaults: () => {
        set({ offences: DEFAULT_OFFENCES });
      },
    }),
    {
      name: 'offences-storage',
    }
  )
);

// Selector hooks for consistency with other stores
export const useOffences = () => useOffenceStore((state) => state.offences);
export const useActiveOffences = () => useOffenceStore(
  useShallow((state) => state.offences.filter(o => o.isActive))
);
export const useOffenceLoading = () => useOffenceStore((state) => state.isLoading);

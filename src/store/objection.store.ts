// Objection Store - for managing ticket objections

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ObjectionStatus = 'pending' | 'approved' | 'rejected';

export interface Objection {
  id: string;
  ticketId: string;
  ticketNumber: string;
  vehicleReg: string;
  reason: string;
  status: ObjectionStatus;
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

export interface ObjectionFilters {
  search?: string;
  status?: ObjectionStatus | ObjectionStatus[];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
}

// Demo objections for initial state
const DEMO_OBJECTIONS: Objection[] = [
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
  },
  {
    id: 'OBJ-005',
    ticketId: 'TKT-2026-011',
    ticketNumber: 'GPS-2026-0011',
    vehicleReg: 'GW-4455-24',
    reason: 'I dispute the charge. The officer incorrectly identified my vehicle.',
    status: 'pending',
    submittedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    driverName: 'Akosua Agyeman',
    driverPhone: '0559876543',
    driverEmail: 'akosua.a@email.com',
    evidence: 'Vehicle service record showing different registration',
    offenceType: 'Running Stop Sign',
    fineAmount: 120
  },
];

interface ObjectionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  approvalRate: number;
  avgResolutionTime: number; // in hours
}

interface ObjectionState {
  // State
  objections: Objection[];
  selectedObjection: Objection | null;
  filters: ObjectionFilters;
  isLoading: boolean;
  error: string | null;
  
  // Actions - CRUD
  setObjections: (objections: Objection[]) => void;
  addObjection: (objection: Objection) => void;
  updateObjection: (id: string, updates: Partial<Objection>) => void;
  deleteObjection: (id: string) => void;
  
  // Actions - Selection
  setSelectedObjection: (objection: Objection | null) => void;
  selectObjectionById: (id: string) => void;
  
  // Actions - Filters
  setFilters: (filters: ObjectionFilters) => void;
  clearFilters: () => void;
  
  // Actions - Status
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - Review
  approveObjection: (id: string, reviewerId: string, reviewerName: string, notes: string) => void;
  rejectObjection: (id: string, reviewerId: string, reviewerName: string, notes: string) => void;
  
  // Actions - Submit new objection (from driver)
  submitObjection: (data: {
    ticketId: string;
    ticketNumber: string;
    vehicleReg: string;
    reason: string;
    driverName: string;
    driverPhone: string;
    driverEmail?: string;
    evidence?: string;
    offenceType: string;
    fineAmount: number;
  }) => Objection;
  
  // Getters
  getObjectionsByTicket: (ticketId: string) => Objection[];
  getObjectionsByStatus: (status: ObjectionStatus) => Objection[];
  getFilteredObjections: () => Objection[];
  getObjectionStats: () => ObjectionStats;
  getPendingCount: () => number;
}

// Helper to generate IDs
const generateId = () => `OBJ-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;

export const useObjectionStore = create<ObjectionState>()(
  persist(
    (set, get) => ({
      // Initial state
      objections: DEMO_OBJECTIONS,
      selectedObjection: null,
      filters: {},
      isLoading: false,
      error: null,
      
      // CRUD Actions
      setObjections: (objections) => set({ objections }),
      
      addObjection: (objection) =>
        set((state) => ({
          objections: [objection, ...state.objections],
        })),
      
      updateObjection: (id, updates) =>
        set((state) => ({
          objections: state.objections.map((o) =>
            o.id === id ? { ...o, ...updates } : o
          ),
          selectedObjection:
            state.selectedObjection?.id === id
              ? { ...state.selectedObjection, ...updates }
              : state.selectedObjection,
        })),
      
      deleteObjection: (id) =>
        set((state) => ({
          objections: state.objections.filter((o) => o.id !== id),
          selectedObjection:
            state.selectedObjection?.id === id ? null : state.selectedObjection,
        })),
      
      // Selection Actions
      setSelectedObjection: (objection) => set({ selectedObjection: objection }),
      
      selectObjectionById: (id) => {
        const objection = get().objections.find((o) => o.id === id) || null;
        set({ selectedObjection: objection });
      },
      
      // Filter Actions
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),
      
      // Status Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),
      
      // Review Actions
      approveObjection: (id, reviewerId, reviewerName, notes) => {
        const now = new Date().toISOString();
        get().updateObjection(id, {
          status: 'approved',
          reviewedAt: now,
          reviewedById: reviewerId,
          reviewedBy: reviewerName,
          reviewNotes: notes,
        });
      },
      
      rejectObjection: (id, reviewerId, reviewerName, notes) => {
        const now = new Date().toISOString();
        get().updateObjection(id, {
          status: 'rejected',
          reviewedAt: now,
          reviewedById: reviewerId,
          reviewedBy: reviewerName,
          reviewNotes: notes,
        });
      },
      
      // Submit new objection
      submitObjection: (data) => {
        const newObjection: Objection = {
          id: generateId(),
          ...data,
          status: 'pending',
          submittedAt: new Date().toISOString(),
        };
        
        get().addObjection(newObjection);
        return newObjection;
      },
      
      // Getters
      getObjectionsByTicket: (ticketId) => {
        return get().objections.filter((o) => o.ticketId === ticketId);
      },
      
      getObjectionsByStatus: (status) => {
        return get().objections.filter((o) => o.status === status);
      },
      
      getFilteredObjections: () => {
        const { objections, filters } = get();
        
        return objections.filter((objection) => {
          // Search filter
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesSearch =
              objection.id.toLowerCase().includes(search) ||
              objection.ticketNumber.toLowerCase().includes(search) ||
              objection.vehicleReg.toLowerCase().includes(search) ||
              objection.driverName.toLowerCase().includes(search) ||
              objection.driverPhone.includes(search) ||
              objection.reason.toLowerCase().includes(search);
            if (!matchesSearch) return false;
          }
          
          // Status filter
          if (filters.status) {
            const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
            if (!statuses.includes(objection.status)) return false;
          }
          
          // Date range filter
          if (filters.dateFrom) {
            const objDate = new Date(objection.submittedAt);
            const fromDate = new Date(filters.dateFrom);
            if (objDate < fromDate) return false;
          }
          
          if (filters.dateTo) {
            const objDate = new Date(objection.submittedAt);
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (objDate > toDate) return false;
          }
          
          // Amount range filter
          if (filters.minAmount !== undefined && objection.fineAmount < filters.minAmount) {
            return false;
          }
          
          if (filters.maxAmount !== undefined && objection.fineAmount > filters.maxAmount) {
            return false;
          }
          
          return true;
        });
      },
      
      getObjectionStats: () => {
        const objections = get().objections;
        const approved = objections.filter((o) => o.status === 'approved');
        const rejected = objections.filter((o) => o.status === 'rejected');
        const pending = objections.filter((o) => o.status === 'pending');
        const resolved = [...approved, ...rejected];
        
        // Calculate average resolution time (for resolved objections)
        let avgResolutionTime = 0;
        if (resolved.length > 0) {
          const totalTime = resolved.reduce((sum, o) => {
            if (o.reviewedAt) {
              const submitted = new Date(o.submittedAt).getTime();
              const reviewed = new Date(o.reviewedAt).getTime();
              return sum + (reviewed - submitted);
            }
            return sum;
          }, 0);
          avgResolutionTime = totalTime / resolved.length / (1000 * 60 * 60); // hours
        }
        
        return {
          total: objections.length,
          pending: pending.length,
          approved: approved.length,
          rejected: rejected.length,
          approvalRate: resolved.length > 0 ? (approved.length / resolved.length) * 100 : 0,
          avgResolutionTime,
        };
      },
      
      getPendingCount: () => {
        return get().objections.filter((o) => o.status === 'pending').length;
      },
    }),
    {
      name: 'ghana-police-objections',
      partialize: (state) => ({
        objections: state.objections,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useObjections = () => useObjectionStore((state) => state.objections);
export const useSelectedObjection = () => useObjectionStore((state) => state.selectedObjection);
export const useObjectionFilters = () => useObjectionStore((state) => state.filters);
export const usePendingObjectionsCount = () => useObjectionStore((state) => 
  state.objections.filter(o => o.status === 'pending').length
);

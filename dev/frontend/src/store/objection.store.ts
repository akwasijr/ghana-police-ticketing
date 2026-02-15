// Objection Store - for managing ticket objections

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Objection, ObjectionFilters, ObjectionStatus } from '@/types/objection.types';
import { objectionsAPI } from '@/lib/api/objections.api';

// Re-export types for backwards compatibility
export type { ObjectionStatus, Objection, ObjectionFilters };

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

  // API actions
  fetchObjections: () => Promise<void>;

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
  approveObjection: (id: string, reviewerId: string, reviewerName: string, notes: string) => Promise<void>;
  rejectObjection: (id: string, reviewerId: string, reviewerName: string, notes: string) => Promise<void>;

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
  }) => Promise<Objection | null>;

  // Getters
  getObjectionsByTicket: (ticketId: string) => Objection[];
  getObjectionsByStatus: (status: ObjectionStatus) => Objection[];
  getFilteredObjections: () => Objection[];
  getObjectionStats: () => ObjectionStats;
  getPendingCount: () => number;
}

export const useObjectionStore = create<ObjectionState>()(
  persist(
    (set, get) => ({
      // Initial state - empty array, loaded from API
      objections: [],
      selectedObjection: null,
      filters: {},
      isLoading: false,
      error: null,

      // API fetch action
      fetchObjections: async () => {
        set({ isLoading: true });
        try {
          const response = await objectionsAPI.list();
          set({ objections: response.items, isLoading: false, error: null });
        } catch {
          set({ isLoading: false });
        }
      },

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
      approveObjection: async (id, _reviewerId, _reviewerName, notes) => {
        try {
          const updated = await objectionsAPI.review(id, {
            decision: 'approve',
            reviewNotes: notes,
          });
          get().updateObjection(id, updated);
        } catch {
          // silent
        }
      },

      rejectObjection: async (id, _reviewerId, _reviewerName, notes) => {
        try {
          const updated = await objectionsAPI.review(id, {
            decision: 'reject',
            reviewNotes: notes,
          });
          get().updateObjection(id, updated);
        } catch {
          // silent
        }
      },

      // Submit new objection
      submitObjection: async (data) => {
        try {
          const response = await objectionsAPI.file({
            ticketId: data.ticketId,
            reason: data.reason,
            contactPhone: data.driverPhone,
            contactEmail: data.driverEmail,
          });
          // Build a local Objection object from the API response
          const newObjection: Objection = {
            id: response.objectionId,
            ticketId: data.ticketId,
            ticketNumber: response.ticketNumber,
            vehicleReg: data.vehicleReg,
            reason: data.reason,
            status: 'pending',
            submittedAt: response.filedAt,
            reviewDeadline: response.reviewDeadline,
            driverName: data.driverName,
            driverPhone: data.driverPhone,
            driverEmail: data.driverEmail,
            evidence: data.evidence,
            offenceType: data.offenceType,
            fineAmount: data.fineAmount,
          };
          get().addObjection(newObjection);
          return newObjection;
        } catch {
          return null;
        }
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

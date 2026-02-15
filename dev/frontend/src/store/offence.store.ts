import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type { Offence, OffenceFormData } from '@/types/offence.types';
import { offencesAPI } from '@/lib/api/offences.api';

interface OffenceState {
  offences: Offence[];
  isLoading: boolean;

  // API actions
  fetchOffences: () => Promise<void>;

  // CRUD actions
  addOffence: (data: OffenceFormData) => Promise<Offence | null>;
  updateOffence: (id: string, data: Partial<OffenceFormData>) => Promise<void>;
  deleteOffence: (id: string) => Promise<void>;
  toggleOffenceStatus: (id: string) => Promise<void>;
  updateFine: (id: string, newFine: number) => void;
  getOffenceById: (id: string) => Offence | undefined;
  getOffencesByCategory: (category: string) => Offence[];
  getActiveOffences: () => Offence[];
  resetToDefaults: () => Promise<void>;
}

export const useOffenceStore = create<OffenceState>()(
  persist(
    (set, get) => ({
      offences: [],
      isLoading: false,

      fetchOffences: async () => {
        set({ isLoading: true });
        try {
          const offences = await offencesAPI.list();
          set({ offences, isLoading: false });
        } catch {
          set({ isLoading: false });
        }
      },

      addOffence: async (data: OffenceFormData) => {
        try {
          const newOffence = await offencesAPI.create(data);
          set((state) => ({
            offences: [...state.offences, newOffence],
          }));
          return newOffence;
        } catch {
          return null;
        }
      },

      updateOffence: async (id: string, data: Partial<OffenceFormData>) => {
        try {
          const updated = await offencesAPI.update(id, data);
          set((state) => ({
            offences: state.offences.map((o) => (o.id === id ? updated : o)),
          }));
        } catch {
          // silent
        }
      },

      deleteOffence: async (id: string) => {
        try {
          await offencesAPI.delete(id);
          set((state) => ({
            offences: state.offences.filter((o) => o.id !== id),
          }));
        } catch {
          // silent
        }
      },

      toggleOffenceStatus: async (id: string) => {
        try {
          const updated = await offencesAPI.toggle(id);
          set((state) => ({
            offences: state.offences.map((o) => (o.id === id ? updated : o)),
          }));
        } catch {
          // silent
        }
      },

      updateFine: (id: string, newFine: number) => {
        const offence = get().offences.find((o) => o.id === id);
        if (!offence) return;
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

      resetToDefaults: async () => {
        await get().fetchOffences();
      },
    }),
    {
      name: 'offences-storage',
    }
  )
);

// Selector hooks
export const useOffences = () => useOffenceStore((state) => state.offences);
export const useActiveOffences = () => useOffenceStore(
  useShallow((state) => state.offences.filter(o => o.isActive))
);
export const useOffenceLoading = () => useOffenceStore((state) => state.isLoading);

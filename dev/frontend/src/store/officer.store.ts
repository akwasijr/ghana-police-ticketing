import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import type { Officer } from '@/types/officer.types';

interface OfficerState {
  officers: Officer[];
  isLoading: boolean;
  error: string | null;
  
  setOfficers: (officers: Officer[]) => void;
  addOfficer: (officer: Officer) => void;
  updateOfficer: (id: string, updates: Partial<Officer>) => void;
  removeOfficer: (id: string) => void;
  getOfficerById: (id: string) => Officer | undefined;
  getActiveOfficers: () => Officer[];
}

export const useOfficerStore = create<OfficerState>((set, get) => ({
  officers: [],
  isLoading: false,
  error: null,
  
  setOfficers: (officers) => set({ officers }),
  addOfficer: (officer) => set((state) => ({ officers: [officer, ...state.officers] })),
  updateOfficer: (id, updates) => set((state) => ({
    officers: state.officers.map((o) => o.id === id ? { ...o, ...updates } : o)
  })),
  removeOfficer: (id) => set((state) => ({
    officers: state.officers.filter((o) => o.id !== id)
  })),
  getOfficerById: (id: string) => get().officers.find((o) => o.id === id),
  getActiveOfficers: () => get().officers.filter((o) => o.isActive),
}));

// Selector hooks for consistency with other stores
export const useOfficers = () => useOfficerStore((state) => state.officers);
export const useActiveOfficers = () => useOfficerStore(
  useShallow((state) => state.officers.filter(o => o.isActive))
);
export const useOfficerLoading = () => useOfficerStore((state) => state.isLoading);

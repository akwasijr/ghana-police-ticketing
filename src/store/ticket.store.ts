// Ticket Store - for managing ticket creation and listing

import { create } from 'zustand';
import type { 
  Ticket, 
  TicketListItem, 
  TicketFilters, 
  SelectedOffence,
  TicketPhoto,
  VehicleInfo,
  DriverInfo,
  GeoLocation,
} from '@/types/ticket.types';

// New ticket creation state
interface NewTicketState {
  currentStep: number;
  vehicle: Partial<VehicleInfo>;
  driver: Partial<DriverInfo>;
  offences: SelectedOffence[];
  photos: TicketPhoto[];
  location: Partial<GeoLocation>;
  notes: string;
}

interface TicketState {
  // Ticket list state
  tickets: TicketListItem[];
  selectedTicket: Ticket | null;
  filters: TicketFilters;
  isLoading: boolean;
  error: string | null;
  
  // New ticket form state
  newTicket: NewTicketState;
  
  // Actions - List
  setTickets: (tickets: TicketListItem[]) => void;
  addTicket: (ticket: TicketListItem) => void;
  updateTicketInList: (id: string, updates: Partial<TicketListItem>) => void;
  setSelectedTicket: (ticket: Ticket | null) => void;
  setFilters: (filters: TicketFilters) => void;
  clearFilters: () => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Actions - New Ticket Form
  setCurrentStep: (step: number) => void;
  nextStep: () => void;
  prevStep: () => void;
  setVehicle: (vehicle: Partial<VehicleInfo>) => void;
  setDriver: (driver: Partial<DriverInfo>) => void;
  addOffence: (offence: SelectedOffence) => void;
  removeOffence: (offenceId: string) => void;
  updateOffence: (offenceId: string, updates: Partial<SelectedOffence>) => void;
  clearOffences: () => void;
  addPhoto: (photo: TicketPhoto) => void;
  removePhoto: (photoId: string) => void;
  setLocation: (location: Partial<GeoLocation>) => void;
  setNotes: (notes: string) => void;
  resetNewTicket: () => void;
  
  // Computed
  getTotalFine: () => number;
  isFormValid: () => boolean;
}

const initialNewTicketState: NewTicketState = {
  currentStep: 0,
  vehicle: {},
  driver: {},
  offences: [],
  photos: [],
  location: {},
  notes: '',
};

export const useTicketStore = create<TicketState>((set, get) => ({
  // Initial state
  tickets: [],
  selectedTicket: null,
  filters: {},
  isLoading: false,
  error: null,
  newTicket: { ...initialNewTicketState },
  
  // List actions
  setTickets: (tickets) => set({ tickets }),
  
  addTicket: (ticket) => 
    set((state) => ({ 
      tickets: [ticket, ...state.tickets] 
    })),
  
  updateTicketInList: (id, updates) =>
    set((state) => ({
      tickets: state.tickets.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    })),
  
  setSelectedTicket: (selectedTicket) => set({ selectedTicket }),
  
  setFilters: (filters) => 
    set((state) => ({ 
      filters: { ...state.filters, ...filters } 
    })),
  
  clearFilters: () => set({ filters: {} }),
  
  setLoading: (isLoading) => set({ isLoading }),
  
  setError: (error) => set({ error }),
  
  // New ticket form actions
  setCurrentStep: (currentStep) =>
    set((state) => ({
      newTicket: { ...state.newTicket, currentStep },
    })),
  
  nextStep: () =>
    set((state) => ({
      newTicket: { 
        ...state.newTicket, 
        currentStep: Math.min(state.newTicket.currentStep + 1, 3) 
      },
    })),
  
  prevStep: () =>
    set((state) => ({
      newTicket: { 
        ...state.newTicket, 
        currentStep: Math.max(state.newTicket.currentStep - 1, 0) 
      },
    })),
  
  setVehicle: (vehicle) =>
    set((state) => ({
      newTicket: { 
        ...state.newTicket, 
        vehicle: { ...state.newTicket.vehicle, ...vehicle } 
      },
    })),
  
  setDriver: (driver) =>
    set((state) => ({
      newTicket: { 
        ...state.newTicket, 
        driver: { ...state.newTicket.driver, ...driver } 
      },
    })),
  
  addOffence: (offence) =>
    set((state) => ({
      newTicket: {
        ...state.newTicket,
        offences: [...state.newTicket.offences, offence],
      },
    })),
  
  removeOffence: (offenceId) =>
    set((state) => ({
      newTicket: {
        ...state.newTicket,
        offences: state.newTicket.offences.filter((o) => o.id !== offenceId),
      },
    })),
  
  updateOffence: (offenceId, updates) =>
    set((state) => ({
      newTicket: {
        ...state.newTicket,
        offences: state.newTicket.offences.map((o) =>
          o.id === offenceId ? { ...o, ...updates } : o
        ),
      },
    })),
  
  clearOffences: () =>
    set((state) => ({
      newTicket: { ...state.newTicket, offences: [] },
    })),
  
  addPhoto: (photo) =>
    set((state) => ({
      newTicket: {
        ...state.newTicket,
        photos: [...state.newTicket.photos, photo],
      },
    })),
  
  removePhoto: (photoId) =>
    set((state) => ({
      newTicket: {
        ...state.newTicket,
        photos: state.newTicket.photos.filter((p) => p.id !== photoId),
      },
    })),
  
  setLocation: (location) =>
    set((state) => ({
      newTicket: {
        ...state.newTicket,
        location: { ...state.newTicket.location, ...location },
      },
    })),
  
  setNotes: (notes) =>
    set((state) => ({
      newTicket: { ...state.newTicket, notes },
    })),
  
  resetNewTicket: () =>
    set({ newTicket: { ...initialNewTicketState } }),
  
  // Computed
  getTotalFine: () => {
    const { offences } = get().newTicket;
    return offences.reduce((total, o) => total + (o.customFine ?? o.fine), 0);
  },
  
  isFormValid: () => {
    const { vehicle, offences } = get().newTicket;
    return !!vehicle.registrationNumber && offences.length > 0;
  },
}));

// Selector hooks
export const useNewTicket = () => useTicketStore((state) => state.newTicket);
export const useTicketList = () => useTicketStore((state) => state.tickets);
export const useSelectedTicket = () => useTicketStore((state) => state.selectedTicket);

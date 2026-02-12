// Authentication Store

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { User, AuthTokens, AuthSession } from '@/types/officer.types';
import type { InterfaceMode } from '@/types';

export type JurisdictionLevel = 'station' | 'district' | 'division' | 'region' | 'national';

export interface JurisdictionScope {
  level: JurisdictionLevel;
  id: string;
  name: string;
}

interface AuthState {
  // State
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  interfaceMode: InterfaceMode;
  jurisdiction: JurisdictionScope | null;
  
  // Actions
  setUser: (user: User | null) => void;
  setTokens: (tokens: AuthTokens | null) => void;
  setSession: (session: AuthSession) => void;
  setInterfaceMode: (mode: InterfaceMode) => void;
  setLoading: (loading: boolean) => void;
  setJurisdiction: (jurisdiction: JurisdictionScope | null) => void;
  logout: () => void;
  
  // Computed helpers
  isOfficer: () => boolean;
  isAdmin: () => boolean;
  hasPermission: (permission: string) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      tokens: null,
      isAuthenticated: false,
      isLoading: true,
      interfaceMode: 'dashboard',
      jurisdiction: null,
      
      // Actions
      setUser: (user) => 
        set({ 
          user, 
          isAuthenticated: !!user 
        }),
      
      setTokens: (tokens) => 
        set({ tokens }),
      
      setSession: (session) => 
        set({
          user: session.user,
          tokens: session.tokens,
          isAuthenticated: session.isAuthenticated,
          interfaceMode: session.interfaceMode,
          isLoading: false,
        }),
      
      setInterfaceMode: (interfaceMode) => 
        set({ interfaceMode }),
      
      setLoading: (isLoading) => 
        set({ isLoading }),

      setJurisdiction: (jurisdiction) =>
        set({ jurisdiction }),
      
      logout: () => 
        set({
          user: null,
          tokens: null,
          isAuthenticated: false,
          isLoading: false,
          jurisdiction: null,
        }),
      
      // Computed helpers
      isOfficer: () => {
        const user = get().user;
        return user?.role === 'officer' || user?.role === 'supervisor';
      },
      
      isAdmin: () => {
        const user = get().user;
        return user?.role === 'admin' || user?.role === 'super_admin';
      },
      
      hasPermission: (permission: string) => {
        const user = get().user;
        if (!user) return false;
        
        // Super admin has all permissions
        if (user.role === 'super_admin') return true;
        
        // Import role permissions
        const { ROLE_PERMISSIONS } = require('@/types/officer.types');
        const permissions = ROLE_PERMISSIONS[user.role] || [];
        
        return permissions.includes(permission) || permissions.includes('*');
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        tokens: state.tokens,
        isAuthenticated: state.isAuthenticated,
        interfaceMode: state.interfaceMode,
        jurisdiction: state.jurisdiction,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useUser = () => useAuthStore((state) => state.user);
export const useIsAuthenticated = () => useAuthStore((state) => state.isAuthenticated);
export const useInterfaceMode = () => useAuthStore((state) => state.interfaceMode);
export const useIsHandheld = () => useAuthStore((state) => state.interfaceMode === 'handheld');
export const useJurisdiction = () => useAuthStore((state) => state.jurisdiction);

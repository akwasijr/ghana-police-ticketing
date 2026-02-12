// Settings Store - for managing app and user settings

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Types
export type Currency = 'GHS' | 'USD';
export type TimeZone = 'GMT' | 'WAT';
export type DateFormat = 'DD/MM/YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type FineMultiplier = 1.0 | 1.5 | 2.0;
export type SessionTimeout = 15 | 30 | 60 | 120;
export type DataRetention = 90 | 180 | 365 | 730;
export type BackupFrequency = 'daily' | 'weekly' | 'monthly';
export type ThemeMode = 'light' | 'dark' | 'system';

export interface SystemSettings {
  systemName: string;
  currency: Currency;
  timeZone: TimeZone;
  dateFormat: DateFormat;
}

export interface TicketSettings {
  autoIncrementTicketIds: boolean;
  requireEvidencePhotos: boolean;
  fineMultiplier: FineMultiplier;
  ticketPrefix: string;
  defaultPaymentDays: number;
  lateFeePercentage: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
  // Specific notifications
  newTicketAlert: boolean;
  paymentReceivedAlert: boolean;
  objectionFiledAlert: boolean;
  dailySummary: boolean;
  weeklySummary: boolean;
}

export interface SecuritySettings {
  twoFactorAuth: boolean;
  sessionTimeout: SessionTimeout;
  requirePasswordChange: boolean;
  passwordChangeDays: number;
  maxLoginAttempts: number;
  lockoutDuration: number; // minutes
}

export interface DataSettings {
  autoBackup: boolean;
  backupFrequency: BackupFrequency;
  dataRetention: DataRetention;
  exportFormat: 'csv' | 'xlsx' | 'pdf';
  compressBackups: boolean;
}

export interface DeviceSettings {
  allowOfflineMode: boolean;
  syncOnConnect: boolean;
  maxOfflineTickets: number;
  cameraQuality: 'low' | 'medium' | 'high';
  gpsAccuracy: 'low' | 'medium' | 'high';
  printerEnabled: boolean;
  printerType: 'bluetooth' | 'wifi' | 'usb';
}

export interface UserPreferences {
  theme: ThemeMode;
  language: 'en' | 'tw' | 'ga' | 'ee'; // English, Twi, Ga, Ewe
  compactMode: boolean;
  showKPICards: boolean;
  defaultDashboardTab: string;
  tablePageSize: 10 | 25 | 50 | 100;
  soundEffects: boolean;
}

export interface AllSettings {
  system: SystemSettings;
  ticket: TicketSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  data: DataSettings;
  device: DeviceSettings;
  userPreferences: UserPreferences;
}

// Default settings
const DEFAULT_SYSTEM_SETTINGS: SystemSettings = {
  systemName: 'Ghana Police Ticketing System',
  currency: 'GHS',
  timeZone: 'GMT',
  dateFormat: 'DD/MM/YYYY',
};

const DEFAULT_TICKET_SETTINGS: TicketSettings = {
  autoIncrementTicketIds: true,
  requireEvidencePhotos: true,
  fineMultiplier: 1.0,
  ticketPrefix: 'GPS',
  defaultPaymentDays: 30,
  lateFeePercentage: 10,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
  pushNotifications: true,
  newTicketAlert: true,
  paymentReceivedAlert: true,
  objectionFiledAlert: true,
  dailySummary: false,
  weeklySummary: true,
};

const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  twoFactorAuth: false,
  sessionTimeout: 30,
  requirePasswordChange: true,
  passwordChangeDays: 90,
  maxLoginAttempts: 5,
  lockoutDuration: 15,
};

const DEFAULT_DATA_SETTINGS: DataSettings = {
  autoBackup: true,
  backupFrequency: 'daily',
  dataRetention: 365,
  exportFormat: 'xlsx',
  compressBackups: true,
};

const DEFAULT_DEVICE_SETTINGS: DeviceSettings = {
  allowOfflineMode: true,
  syncOnConnect: true,
  maxOfflineTickets: 100,
  cameraQuality: 'high',
  gpsAccuracy: 'high',
  printerEnabled: true,
  printerType: 'bluetooth',
};

const DEFAULT_USER_PREFERENCES: UserPreferences = {
  theme: 'light',
  language: 'en',
  compactMode: false,
  showKPICards: true,
  defaultDashboardTab: 'overview',
  tablePageSize: 25,
  soundEffects: true,
};

interface SettingsState {
  // State
  system: SystemSettings;
  ticket: TicketSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  data: DataSettings;
  device: DeviceSettings;
  userPreferences: UserPreferences;
  
  // Status
  isLoading: boolean;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  lastSaved: string | null;
  
  // Actions - Update settings
  updateSystemSettings: (settings: Partial<SystemSettings>) => void;
  updateTicketSettings: (settings: Partial<TicketSettings>) => void;
  updateNotificationSettings: (settings: Partial<NotificationSettings>) => void;
  updateSecuritySettings: (settings: Partial<SecuritySettings>) => void;
  updateDataSettings: (settings: Partial<DataSettings>) => void;
  updateDeviceSettings: (settings: Partial<DeviceSettings>) => void;
  updateUserPreferences: (preferences: Partial<UserPreferences>) => void;
  
  // Actions - Bulk operations
  updateAllSettings: (settings: Partial<AllSettings>) => void;
  resetToDefaults: () => void;
  resetSection: (section: keyof AllSettings) => void;
  
  // Actions - Status
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  markAsSaved: () => void;
  
  // Getters
  getAllSettings: () => AllSettings;
  getSettingValue: <K extends keyof AllSettings, V extends keyof AllSettings[K]>(
    section: K,
    key: V
  ) => AllSettings[K][V];
  
  // Helpers
  formatCurrency: (amount: number) => string;
  formatDate: (date: Date | string) => string;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      // Initial state
      system: DEFAULT_SYSTEM_SETTINGS,
      ticket: DEFAULT_TICKET_SETTINGS,
      notifications: DEFAULT_NOTIFICATION_SETTINGS,
      security: DEFAULT_SECURITY_SETTINGS,
      data: DEFAULT_DATA_SETTINGS,
      device: DEFAULT_DEVICE_SETTINGS,
      userPreferences: DEFAULT_USER_PREFERENCES,
      
      isLoading: false,
      isSaving: false,
      hasUnsavedChanges: false,
      lastSaved: null,
      
      // Update actions
      updateSystemSettings: (settings) => {
        set((state) => ({
          system: { ...state.system, ...settings },
          hasUnsavedChanges: true,
        }));
      },
      
      updateTicketSettings: (settings) => {
        set((state) => ({
          ticket: { ...state.ticket, ...settings },
          hasUnsavedChanges: true,
        }));
      },
      
      updateNotificationSettings: (settings) => {
        set((state) => ({
          notifications: { ...state.notifications, ...settings },
          hasUnsavedChanges: true,
        }));
      },
      
      updateSecuritySettings: (settings) => {
        set((state) => ({
          security: { ...state.security, ...settings },
          hasUnsavedChanges: true,
        }));
      },
      
      updateDataSettings: (settings) => {
        set((state) => ({
          data: { ...state.data, ...settings },
          hasUnsavedChanges: true,
        }));
      },
      
      updateDeviceSettings: (settings) => {
        set((state) => ({
          device: { ...state.device, ...settings },
          hasUnsavedChanges: true,
        }));
      },
      
      updateUserPreferences: (preferences) => {
        set((state) => ({
          userPreferences: { ...state.userPreferences, ...preferences },
          hasUnsavedChanges: true,
        }));
      },
      
      // Bulk operations
      updateAllSettings: (settings) => {
        set((state) => ({
          system: settings.system ? { ...state.system, ...settings.system } : state.system,
          ticket: settings.ticket ? { ...state.ticket, ...settings.ticket } : state.ticket,
          notifications: settings.notifications ? { ...state.notifications, ...settings.notifications } : state.notifications,
          security: settings.security ? { ...state.security, ...settings.security } : state.security,
          data: settings.data ? { ...state.data, ...settings.data } : state.data,
          device: settings.device ? { ...state.device, ...settings.device } : state.device,
          userPreferences: settings.userPreferences ? { ...state.userPreferences, ...settings.userPreferences } : state.userPreferences,
          hasUnsavedChanges: true,
        }));
      },
      
      resetToDefaults: () => {
        set({
          system: DEFAULT_SYSTEM_SETTINGS,
          ticket: DEFAULT_TICKET_SETTINGS,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
          security: DEFAULT_SECURITY_SETTINGS,
          data: DEFAULT_DATA_SETTINGS,
          device: DEFAULT_DEVICE_SETTINGS,
          userPreferences: DEFAULT_USER_PREFERENCES,
          hasUnsavedChanges: true,
        });
      },
      
      resetSection: (section) => {
        const defaults: Record<keyof AllSettings, unknown> = {
          system: DEFAULT_SYSTEM_SETTINGS,
          ticket: DEFAULT_TICKET_SETTINGS,
          notifications: DEFAULT_NOTIFICATION_SETTINGS,
          security: DEFAULT_SECURITY_SETTINGS,
          data: DEFAULT_DATA_SETTINGS,
          device: DEFAULT_DEVICE_SETTINGS,
          userPreferences: DEFAULT_USER_PREFERENCES,
        };
        
        set({
          [section]: defaults[section],
          hasUnsavedChanges: true,
        });
      },
      
      // Status actions
      setLoading: (loading) => set({ isLoading: loading }),
      setSaving: (saving) => set({ isSaving: saving }),
      
      markAsSaved: () => {
        set({
          hasUnsavedChanges: false,
          lastSaved: new Date().toISOString(),
        });
      },
      
      // Getters
      getAllSettings: () => {
        const state = get();
        return {
          system: state.system,
          ticket: state.ticket,
          notifications: state.notifications,
          security: state.security,
          data: state.data,
          device: state.device,
          userPreferences: state.userPreferences,
        };
      },
      
      getSettingValue: <K extends keyof AllSettings, V extends keyof AllSettings[K]>(section: K, key: V) => {
        const state = get();
        return (state[section] as AllSettings[K])[key];
      },
      
      // Helpers
      formatCurrency: (amount) => {
        const { currency } = get().system;
        const formatter = new Intl.NumberFormat('en-GH', {
          style: 'currency',
          currency: currency,
          minimumFractionDigits: 2,
        });
        return formatter.format(amount);
      },
      
      formatDate: (date) => {
        const { dateFormat } = get().system;
        const d = typeof date === 'string' ? new Date(date) : date;
        
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        
        switch (dateFormat) {
          case 'DD/MM/YYYY':
            return `${day}/${month}/${year}`;
          case 'MM/DD/YYYY':
            return `${month}/${day}/${year}`;
          case 'YYYY-MM-DD':
            return `${year}-${month}-${day}`;
          default:
            return `${day}/${month}/${year}`;
        }
      },
    }),
    {
      name: 'ghana-police-settings',
      partialize: (state) => ({
        system: state.system,
        ticket: state.ticket,
        notifications: state.notifications,
        security: state.security,
        data: state.data,
        device: state.device,
        userPreferences: state.userPreferences,
        lastSaved: state.lastSaved,
      }),
    }
  )
);

// Selector hooks for common use cases
export const useSystemSettings = () => useSettingsStore((state) => state.system);
export const useTicketSettings = () => useSettingsStore((state) => state.ticket);
export const useNotificationSettings = () => useSettingsStore((state) => state.notifications);
export const useSecuritySettings = () => useSettingsStore((state) => state.security);
export const useDataSettings = () => useSettingsStore((state) => state.data);
export const useDeviceSettings = () => useSettingsStore((state) => state.device);
export const useUserPreferences = () => useSettingsStore((state) => state.userPreferences);
export const useTheme = () => useSettingsStore((state) => state.userPreferences.theme);
export const useCurrency = () => useSettingsStore((state) => state.system.currency);

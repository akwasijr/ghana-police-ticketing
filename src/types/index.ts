// Export all types from a single entry point

export * from './ticket.types';
// export * from './officer.types'; // Avoid conflict with api.types
export * from './payment.types';
export * from './printer.types';
export * from './api.types';

// Additional shared types

export type InterfaceMode = 'handheld' | 'dashboard';

export interface AppState {
  interfaceMode: InterfaceMode;
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime?: string;
}

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface ConfirmDialog {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'danger';
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface SearchResult<T> {
  items: T[];
  query: string;
  totalCount: number;
  hasMore: boolean;
}

// Common filter/sort options
export interface SortOption {
  label: string;
  value: string;
  direction: 'asc' | 'desc';
}

export interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

// Date range
export interface DateRange {
  start: Date | null;
  end: Date | null;
}

// Form field state
export interface FieldState<T = string> {
  value: T;
  error?: string;
  touched: boolean;
  isValid: boolean;
}

// API status
export type RequestStatus = 'idle' | 'loading' | 'success' | 'error';

export interface AsyncState<T> {
  data: T | null;
  status: RequestStatus;
  error: string | null;
}

// UI Store - for managing global UI state

import { create } from 'zustand';
import type { Toast, ConfirmDialog } from '@/types';

interface UIState {
  // Sidebar
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  
  // Modals
  activeModal: string | null;
  modalProps: Record<string, unknown>;
  
  // Toasts
  toasts: Toast[];
  
  // Confirm dialog
  confirmDialog: ConfirmDialog | null;
  
  // Loading overlays
  globalLoading: boolean;
  loadingMessage: string | null;
  
  // Actions - Sidebar
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Actions - Modals
  openModal: (modalId: string, props?: Record<string, unknown>) => void;
  closeModal: () => void;
  
  // Actions - Toasts
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (id: string) => void;
  clearToasts: () => void;
  
  // Actions - Confirm Dialog
  showConfirm: (options: Omit<ConfirmDialog, 'isOpen'>) => void;
  hideConfirm: () => void;
  
  // Actions - Loading
  setGlobalLoading: (loading: boolean, message?: string) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  sidebarOpen: true,
  sidebarCollapsed: false,
  activeModal: null,
  modalProps: {},
  toasts: [],
  confirmDialog: null,
  globalLoading: false,
  loadingMessage: null,
  
  // Sidebar actions
  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  
  // Modal actions
  openModal: (modalId, props = {}) =>
    set({ activeModal: modalId, modalProps: props }),
  
  closeModal: () =>
    set({ activeModal: null, modalProps: {} }),
  
  // Toast actions
  addToast: (toast) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = { ...toast, id };
    
    set((state) => ({
      toasts: [...state.toasts, newToast],
    }));
    
    // Auto-remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        get().removeToast(id);
      }, duration);
    }
  },
  
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  
  clearToasts: () => set({ toasts: [] }),
  
  // Confirm dialog actions
  showConfirm: (options) =>
    set({
      confirmDialog: {
        ...options,
        isOpen: true,
      },
    }),
  
  hideConfirm: () =>
    set({ confirmDialog: null }),
  
  // Loading actions
  setGlobalLoading: (globalLoading, loadingMessage = undefined) =>
    set({ globalLoading, loadingMessage }),
}));

// Convenience hooks
export const useToast = () => {
  const addToast = useUIStore((state) => state.addToast);
  
  return {
    success: (title: string, message?: string) =>
      addToast({ type: 'success', title, message }),
    error: (title: string, message?: string) =>
      addToast({ type: 'error', title, message }),
    warning: (title: string, message?: string) =>
      addToast({ type: 'warning', title, message }),
    info: (title: string, message?: string) =>
      addToast({ type: 'info', title, message }),
  };
};

export const useConfirm = () => {
  const { showConfirm, hideConfirm } = useUIStore();
  
  return (options: Omit<ConfirmDialog, 'isOpen' | 'onConfirm'> & { 
    onConfirm: () => void | Promise<void>;
  }) => {
    return new Promise<boolean>((resolve) => {
      showConfirm({
        ...options,
        onConfirm: async () => {
          await options.onConfirm();
          hideConfirm();
          resolve(true);
        },
        onCancel: () => {
          hideConfirm();
          resolve(false);
        },
      });
    });
  };
};

export const useSidebar = () => ({
  isOpen: useUIStore((state) => state.sidebarOpen),
  isCollapsed: useUIStore((state) => state.sidebarCollapsed),
  toggle: useUIStore((state) => state.toggleSidebar),
  setOpen: useUIStore((state) => state.setSidebarOpen),
  setCollapsed: useUIStore((state) => state.setSidebarCollapsed),
});

// Payment Store - for managing payment records and processing

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Payment,
  PaymentStatus,
  PaymentMethod,
  PaymentFilters,
  PaymentStats
} from '@/types/payment.types';
import { paymentsAPI } from '@/lib/api/payments.api';

interface PaymentState {
  // State
  payments: Payment[];
  selectedPayment: Payment | null;
  filters: PaymentFilters;
  isLoading: boolean;
  error: string | null;

  // API actions
  fetchPayments: () => Promise<void>;

  // Actions - CRUD
  setPayments: (payments: Payment[]) => void;
  addPayment: (payment: Payment) => void;
  updatePayment: (id: string, updates: Partial<Payment>) => void;
  deletePayment: (id: string) => void;

  // Actions - Selection
  setSelectedPayment: (payment: Payment | null) => void;
  selectPaymentById: (id: string) => void;

  // Actions - Filters
  setFilters: (filters: PaymentFilters) => void;
  clearFilters: () => void;

  // Actions - Status
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Payment Processing
  initiatePayment: (ticketId: string, method: PaymentMethod, payerInfo: { name: string; phone?: string; email?: string }) => Promise<Payment | null>;
  completePayment: (id: string, transactionId?: string) => void;
  failPayment: (id: string, reason: string) => void;
  refundPayment: (id: string, reason: string) => void;

  // Actions - Cash Payment
  recordCashPayment: (ticketId: string, ticketNumber: string, amount: number, payerName: string, payerPhone?: string, processedBy?: { id: string; name: string; stationId?: string }) => Promise<Payment | null>;

  // Computed / Getters
  getPaymentsByTicket: (ticketId: string) => Payment[];
  getPaymentsByStatus: (status: PaymentStatus) => Payment[];
  getFilteredPayments: () => Payment[];
  getPaymentStats: () => PaymentStats;
  getTodayPayments: () => Payment[];
  getTodayRevenue: () => number;
}

// Method name mapping
const METHOD_NAMES: Record<PaymentMethod, string> = {
  momo: 'MTN Mobile Money',
  vodacash: 'Vodafone Cash',
  airteltigo: 'AirtelTigo Money',
  bank: 'Bank Transfer',
  card: 'Card Payment',
  cash: 'Cash at Station',
};

export const usePaymentStore = create<PaymentState>()(
  persist(
    (set, get) => ({
      // Initial state - empty array, loaded from API
      payments: [],
      selectedPayment: null,
      filters: {},
      isLoading: false,
      error: null,

      // API fetch action
      fetchPayments: async () => {
        set({ isLoading: true });
        try {
          const response = await paymentsAPI.list();
          set({ payments: response.items, isLoading: false, error: null });
        } catch {
          set({ isLoading: false });
        }
      },

      // CRUD Actions
      setPayments: (payments) => set({ payments }),

      addPayment: (payment) =>
        set((state) => ({
          payments: [payment, ...state.payments],
        })),

      updatePayment: (id, updates) =>
        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === id ? { ...p, ...updates } : p
          ),
          selectedPayment:
            state.selectedPayment?.id === id
              ? { ...state.selectedPayment, ...updates }
              : state.selectedPayment,
        })),

      deletePayment: (id) =>
        set((state) => ({
          payments: state.payments.filter((p) => p.id !== id),
          selectedPayment:
            state.selectedPayment?.id === id ? null : state.selectedPayment,
        })),

      // Selection Actions
      setSelectedPayment: (payment) => set({ selectedPayment: payment }),

      selectPaymentById: (id) => {
        const payment = get().payments.find((p) => p.id === id) || null;
        set({ selectedPayment: payment });
      },

      // Filter Actions
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),

      // Status Actions
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      // Payment Processing Actions
      initiatePayment: async (ticketId, method, payerInfo) => {
        try {
          const response = await paymentsAPI.initiate({
            ticketId,
            method,
            phoneNumber: payerInfo.phone,
            payerName: payerInfo.name,
            payerEmail: payerInfo.email,
          });
          // Build a local Payment object from the API response
          const newPayment: Payment = {
            id: response.paymentId,
            paymentReference: response.paymentReference,
            ticketId,
            ticketNumber: ticketId,
            amount: response.amount,
            currency: 'GHS',
            originalFine: response.amount,
            method,
            status: 'pending',
            createdAt: new Date().toISOString(),
            payerName: payerInfo.name,
            payerPhone: payerInfo.phone,
            payerEmail: payerInfo.email,
          };
          get().addPayment(newPayment);
          return newPayment;
        } catch {
          return null;
        }
      },

      completePayment: (id, transactionId) => {
        const now = new Date().toISOString();
        get().updatePayment(id, {
          status: 'completed',
          transactionId,
          processedAt: now,
          completedAt: now,
        });
      },

      failPayment: (id, reason) => {
        get().updatePayment(id, {
          status: 'failed',
          statusMessage: reason,
        });
      },

      refundPayment: (id, reason) => {
        get().updatePayment(id, {
          status: 'refunded',
          statusMessage: reason,
        });
      },

      // Cash Payment Recording
      recordCashPayment: async (ticketId, _ticketNumber, amount, payerName, payerPhone, _processedBy) => {
        try {
          const payment = await paymentsAPI.recordCash({
            ticketId,
            amount,
            payerName,
            payerPhone,
          });
          get().addPayment(payment);
          return payment;
        } catch {
          return null;
        }
      },

      // Getters
      getPaymentsByTicket: (ticketId) => {
        return get().payments.filter((p) => p.ticketId === ticketId);
      },

      getPaymentsByStatus: (status) => {
        return get().payments.filter((p) => p.status === status);
      },

      getFilteredPayments: () => {
        const { payments, filters } = get();

        return payments.filter((payment) => {
          // Search filter
          if (filters.search) {
            const search = filters.search.toLowerCase();
            const matchesSearch =
              payment.paymentReference.toLowerCase().includes(search) ||
              payment.ticketNumber.toLowerCase().includes(search) ||
              payment.payerName?.toLowerCase().includes(search) ||
              payment.payerPhone?.includes(search);
            if (!matchesSearch) return false;
          }

          // Status filter
          if (filters.status) {
            const statuses = Array.isArray(filters.status) ? filters.status : [filters.status];
            if (!statuses.includes(payment.status)) return false;
          }

          // Method filter
          if (filters.method) {
            const methods = Array.isArray(filters.method) ? filters.method : [filters.method];
            if (!methods.includes(payment.method)) return false;
          }

          // Date range filter
          if (filters.dateFrom) {
            const paymentDate = new Date(payment.createdAt);
            const fromDate = new Date(filters.dateFrom);
            if (paymentDate < fromDate) return false;
          }

          if (filters.dateTo) {
            const paymentDate = new Date(payment.createdAt);
            const toDate = new Date(filters.dateTo);
            toDate.setHours(23, 59, 59, 999);
            if (paymentDate > toDate) return false;
          }

          // Amount range filter
          if (filters.minAmount !== undefined && payment.amount < filters.minAmount) {
            return false;
          }

          if (filters.maxAmount !== undefined && payment.amount > filters.maxAmount) {
            return false;
          }

          // Station filter
          if (filters.stationId && payment.stationId !== filters.stationId) {
            return false;
          }

          // Processed by filter
          if (filters.processedById && payment.processedById !== filters.processedById) {
            return false;
          }

          return true;
        });
      },

      getPaymentStats: () => {
        const payments = get().payments;
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(todayStart);
        weekStart.setDate(weekStart.getDate() - 7);

        const completed = payments.filter((p) => p.status === 'completed');

        const stats: PaymentStats = {
          totalPayments: payments.length,
          totalAmount: completed.reduce((sum, p) => sum + p.amount, 0),

          byStatus: {
            pending: payments.filter((p) => p.status === 'pending').length,
            completed: completed.length,
            failed: payments.filter((p) => p.status === 'failed').length,
            refunded: payments.filter((p) => p.status === 'refunded').length,
          },

          byMethod: {
            momo: { count: 0, amount: 0 },
            vodacash: { count: 0, amount: 0 },
            airteltigo: { count: 0, amount: 0 },
            bank: { count: 0, amount: 0 },
            card: { count: 0, amount: 0 },
            cash: { count: 0, amount: 0 },
          },

          todayAmount: 0,
          weekAmount: 0,
          monthAmount: 0,
        };

        // Calculate by method
        completed.forEach((p) => {
          stats.byMethod[p.method].count++;
          stats.byMethod[p.method].amount += p.amount;
        });

        // Calculate time-based stats
        completed.forEach((p) => {
          const date = new Date(p.completedAt || p.createdAt);
          if (date >= todayStart) {
            stats.todayAmount += p.amount;
          }
          if (date >= weekStart) {
            stats.weekAmount += p.amount;
          }
        });

        return stats;
      },

      getTodayPayments: () => {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        return get().payments.filter((p) => {
          const date = new Date(p.createdAt);
          return date >= todayStart;
        });
      },

      getTodayRevenue: () => {
        const todayPayments = get().getTodayPayments();
        return todayPayments
          .filter((p) => p.status === 'completed')
          .reduce((sum, p) => sum + p.amount, 0);
      },
    }),
    {
      name: 'ghana-police-payments',
      partialize: (state) => ({
        payments: state.payments,
      }),
    }
  )
);

// Keep METHOD_NAMES exported for use in components
export { METHOD_NAMES };

// Selector hooks for common use cases
export const usePayments = () => usePaymentStore((state) => state.payments);
export const useSelectedPayment = () => usePaymentStore((state) => state.selectedPayment);
export const usePaymentFilters = () => usePaymentStore((state) => state.filters);
export const usePaymentLoading = () => usePaymentStore((state) => state.isLoading);

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

// Demo payments for initial state
const DEMO_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    paymentReference: 'PAY-2024-001234',
    ticketId: 'TKT-2024-001234',
    ticketNumber: 'TKT-2024-001234',
    amount: 200,
    currency: 'GHS',
    originalFine: 200,
    method: 'momo',
    methodName: 'MTN Mobile Money',
    phoneNumber: '0244123456',
    network: 'MTN',
    transactionId: 'MTN-TXN-123456',
    status: 'completed',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    payerName: 'Kofi Mensah',
    payerPhone: '0244123456',
    receiptNumber: 'RCP-2024-001234',
  },
  {
    id: 'pay-002',
    paymentReference: 'PAY-2024-001235',
    ticketId: 'TKT-2024-001235',
    ticketNumber: 'TKT-2024-001235',
    amount: 350,
    currency: 'GHS',
    originalFine: 300,
    lateFee: 50,
    method: 'vodacash',
    methodName: 'Vodafone Cash',
    phoneNumber: '0201234567',
    network: 'Vodafone',
    status: 'completed',
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    payerName: 'Ama Asante',
    payerPhone: '0201234567',
    receiptNumber: 'RCP-2024-001235',
  },
  {
    id: 'pay-003',
    paymentReference: 'PAY-2024-001236',
    ticketId: 'TKT-2024-001236',
    ticketNumber: 'TKT-2024-001236',
    amount: 500,
    currency: 'GHS',
    originalFine: 500,
    method: 'cash',
    methodName: 'Cash at Station',
    status: 'completed',
    createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    completedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    payerName: 'Kwame Boateng',
    payerPhone: '0551234567',
    processedById: 'off-001',
    processedByName: 'Sgt. Daniel Asare',
    stationId: 'stn-001',
    receiptNumber: 'RCP-2024-001236',
  },
  {
    id: 'pay-004',
    paymentReference: 'PAY-2024-001237',
    ticketId: 'TKT-2024-001237',
    ticketNumber: 'TKT-2024-001237',
    amount: 150,
    currency: 'GHS',
    originalFine: 150,
    method: 'momo',
    methodName: 'MTN Mobile Money',
    phoneNumber: '0271234567',
    network: 'MTN',
    status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    payerName: 'Yaw Darko',
    payerPhone: '0271234567',
  },
  {
    id: 'pay-005',
    paymentReference: 'PAY-2024-001238',
    ticketId: 'TKT-2024-001238',
    ticketNumber: 'TKT-2024-001238',
    amount: 400,
    currency: 'GHS',
    originalFine: 400,
    method: 'bank',
    methodName: 'Bank Transfer',
    bankName: 'GCB Bank',
    status: 'processing',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    processedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
    payerName: 'Efua Owusu',
    payerEmail: 'efua.owusu@email.com',
  },
  {
    id: 'pay-006',
    paymentReference: 'PAY-2024-001239',
    ticketId: 'TKT-2024-001239',
    ticketNumber: 'TKT-2024-001239',
    amount: 250,
    currency: 'GHS',
    originalFine: 250,
    method: 'airteltigo',
    methodName: 'AirtelTigo Money',
    phoneNumber: '0261234567',
    network: 'AirtelTigo',
    status: 'failed',
    statusMessage: 'Insufficient funds',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    payerName: 'Akua Sarpong',
    payerPhone: '0261234567',
  },
];

interface PaymentState {
  // State
  payments: Payment[];
  selectedPayment: Payment | null;
  filters: PaymentFilters;
  isLoading: boolean;
  error: string | null;
  
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
  initiatePayment: (ticketId: string, method: PaymentMethod, payerInfo: { name: string; phone?: string; email?: string }) => Payment;
  completePayment: (id: string, transactionId?: string) => void;
  failPayment: (id: string, reason: string) => void;
  refundPayment: (id: string, reason: string) => void;
  
  // Actions - Cash Payment
  recordCashPayment: (ticketId: string, ticketNumber: string, amount: number, payerName: string, payerPhone?: string, processedBy?: { id: string; name: string; stationId?: string }) => Payment;
  
  // Computed / Getters
  getPaymentsByTicket: (ticketId: string) => Payment[];
  getPaymentsByStatus: (status: PaymentStatus) => Payment[];
  getFilteredPayments: () => Payment[];
  getPaymentStats: () => PaymentStats;
  getTodayPayments: () => Payment[];
  getTodayRevenue: () => number;
}

// Helper to generate IDs
const generateId = () => `pay-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
const generateReference = () => `PAY-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
const generateReceipt = () => `RCP-${new Date().getFullYear()}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;

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
      // Initial state
      payments: DEMO_PAYMENTS,
      selectedPayment: null,
      filters: {},
      isLoading: false,
      error: null,
      
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
      initiatePayment: (ticketId, method, payerInfo) => {
        const newPayment: Payment = {
          id: generateId(),
          paymentReference: generateReference(),
          ticketId,
          ticketNumber: ticketId, // Will be updated with actual ticket number
          amount: 0, // Will be calculated from ticket
          currency: 'GHS',
          originalFine: 0,
          method,
          methodName: METHOD_NAMES[method],
          status: 'pending',
          createdAt: new Date().toISOString(),
          payerName: payerInfo.name,
          payerPhone: payerInfo.phone,
          payerEmail: payerInfo.email,
        };
        
        get().addPayment(newPayment);
        return newPayment;
      },
      
      completePayment: (id, transactionId) => {
        const now = new Date().toISOString();
        get().updatePayment(id, {
          status: 'completed',
          transactionId,
          processedAt: now,
          completedAt: now,
          receiptNumber: generateReceipt(),
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
      recordCashPayment: (ticketId, ticketNumber, amount, payerName, payerPhone, processedBy) => {
        const now = new Date().toISOString();
        const newPayment: Payment = {
          id: generateId(),
          paymentReference: generateReference(),
          ticketId,
          ticketNumber,
          amount,
          currency: 'GHS',
          originalFine: amount,
          method: 'cash',
          methodName: 'Cash at Station',
          status: 'completed',
          createdAt: now,
          processedAt: now,
          completedAt: now,
          payerName,
          payerPhone,
          processedById: processedBy?.id,
          processedByName: processedBy?.name,
          stationId: processedBy?.stationId,
          receiptNumber: generateReceipt(),
        };
        
        get().addPayment(newPayment);
        return newPayment;
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

// Selector hooks for common use cases
export const usePayments = () => usePaymentStore((state) => state.payments);
export const useSelectedPayment = () => usePaymentStore((state) => state.selectedPayment);
export const usePaymentFilters = () => usePaymentStore((state) => state.filters);
export const usePaymentLoading = () => usePaymentStore((state) => state.isLoading);

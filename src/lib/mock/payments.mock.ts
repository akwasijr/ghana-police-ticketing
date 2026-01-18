// Mock Payments Data - matches Payment type from @/types/payment.types.ts
import type { Payment, PaymentStatus, PaymentMethod } from '@/types';

export const MOCK_PAYMENTS: Payment[] = [
  {
    id: 'pay-001',
    paymentReference: 'PAY-2024-GA-00001',
    ticketId: 'tkt-001',
    ticketNumber: 'GPS-2024-00001',
    amount: 200,
    currency: 'GHS',
    originalFine: 200,
    method: 'momo' as PaymentMethod,
    methodName: 'MTN Mobile Money',
    phoneNumber: '0244123456',
    network: 'MTN',
    transactionId: 'MOMO-TXN-001234',
    status: 'completed' as PaymentStatus,
    statusMessage: 'Payment successful',
    createdAt: '2024-12-05T14:15:00Z',
    processedAt: '2024-12-05T14:18:00Z',
    completedAt: '2024-12-05T14:20:00Z',
    payerName: 'Kofi Asante',
    payerPhone: '0244123456',
    receiptNumber: 'RCP-2024-00001',
  },
  {
    id: 'pay-002',
    paymentReference: 'PAY-2024-GA-00002',
    ticketId: 'tkt-002',
    ticketNumber: 'GPS-2024-00002',
    amount: 150,
    currency: 'GHS',
    originalFine: 150,
    method: 'vodacash' as PaymentMethod,
    methodName: 'Vodafone Cash',
    phoneNumber: '0502345678',
    network: 'Vodafone',
    transactionId: 'VODA-TXN-002345',
    status: 'completed' as PaymentStatus,
    statusMessage: 'Payment successful',
    createdAt: '2024-12-03T10:00:00Z',
    processedAt: '2024-12-03T10:02:00Z',
    completedAt: '2024-12-03T10:05:00Z',
    payerName: 'Ama Serwaa',
    payerPhone: '0502345678',
    receiptNumber: 'RCP-2024-00002',
  },
  {
    id: 'pay-003',
    paymentReference: 'PAY-2024-GA-00003',
    ticketId: 'tkt-006',
    ticketNumber: 'GPS-2024-00006',
    amount: 300,
    currency: 'GHS',
    originalFine: 300,
    method: 'cash' as PaymentMethod,
    methodName: 'Cash at Station',
    status: 'completed' as PaymentStatus,
    statusMessage: 'Cash payment received',
    createdAt: '2024-12-04T15:30:00Z',
    processedAt: '2024-12-04T15:30:00Z',
    completedAt: '2024-12-04T15:35:00Z',
    payerName: 'Yaw Mensah',
    receiptNumber: 'RCP-2024-00003',
    processedById: 'off-003',
    processedByName: 'Insp. John Appiah',
    stationId: 'st-accra-central',
  },
  {
    id: 'pay-004',
    paymentReference: 'PAY-2024-GA-00004',
    ticketId: 'tkt-010',
    ticketNumber: 'GPS-2024-00010',
    amount: 400,
    currency: 'GHS',
    originalFine: 350,
    lateFee: 50,
    method: 'bank' as PaymentMethod,
    methodName: 'Bank Transfer',
    bankName: 'GCB Bank',
    transactionId: 'GCB-TXN-00567',
    status: 'completed' as PaymentStatus,
    statusMessage: 'Bank transfer verified',
    createdAt: '2024-12-02T09:00:00Z',
    processedAt: '2024-12-02T09:30:00Z',
    completedAt: '2024-12-02T10:00:00Z',
    payerName: 'Kwesi Boateng',
    payerPhone: '0277890123',
    payerEmail: 'kwesi.b@email.com',
    receiptNumber: 'RCP-2024-00004',
  },
  {
    id: 'pay-005',
    paymentReference: 'PAY-2024-GA-00005',
    ticketId: 'tkt-015',
    ticketNumber: 'GPS-2024-00015',
    amount: 250,
    currency: 'GHS',
    originalFine: 250,
    method: 'momo' as PaymentMethod,
    methodName: 'MTN Mobile Money',
    phoneNumber: '0244567890',
    network: 'MTN',
    status: 'pending' as PaymentStatus,
    statusMessage: 'Awaiting payment confirmation',
    createdAt: '2024-12-11T08:00:00Z',
    payerName: 'Akua Mensah',
    payerPhone: '0244567890',
  },
  {
    id: 'pay-006',
    paymentReference: 'PAY-2024-GA-00006',
    ticketId: 'tkt-020',
    ticketNumber: 'GPS-2024-00020',
    amount: 175,
    currency: 'GHS',
    originalFine: 200,
    discount: 25,
    method: 'airteltigo' as PaymentMethod,
    methodName: 'AirtelTigo Money',
    phoneNumber: '0267123456',
    network: 'AirtelTigo',
    transactionId: 'AT-TXN-003456',
    status: 'completed' as PaymentStatus,
    statusMessage: 'Payment successful (early payment discount applied)',
    createdAt: '2024-12-01T11:00:00Z',
    processedAt: '2024-12-01T11:02:00Z',
    completedAt: '2024-12-01T11:05:00Z',
    payerName: 'Esi Darkwa',
    payerPhone: '0267123456',
    receiptNumber: 'RCP-2024-00006',
  },
  {
    id: 'pay-007',
    paymentReference: 'PAY-2024-GA-00007',
    ticketId: 'tkt-025',
    ticketNumber: 'GPS-2024-00025',
    amount: 500,
    currency: 'GHS',
    originalFine: 500,
    method: 'card' as PaymentMethod,
    methodName: 'Debit Card',
    cardLast4: '4532',
    cardBrand: 'Visa',
    transactionId: 'CARD-TXN-007890',
    status: 'failed' as PaymentStatus,
    statusMessage: 'Card declined - insufficient funds',
    createdAt: '2024-12-10T14:00:00Z',
    processedAt: '2024-12-10T14:01:00Z',
    payerName: 'John Mensah',
    payerPhone: '0244111222',
    payerEmail: 'john.m@email.com',
  },
  {
    id: 'pay-008',
    paymentReference: 'PAY-2024-AR-00001',
    ticketId: 'tkt-ar-001',
    ticketNumber: 'GPS-2024-AR-00001',
    amount: 200,
    currency: 'GHS',
    originalFine: 200,
    method: 'momo' as PaymentMethod,
    methodName: 'MTN Mobile Money',
    phoneNumber: '0244999888',
    network: 'MTN',
    transactionId: 'MOMO-TXN-AR-001',
    status: 'completed' as PaymentStatus,
    statusMessage: 'Payment successful',
    createdAt: '2024-12-08T16:00:00Z',
    processedAt: '2024-12-08T16:02:00Z',
    completedAt: '2024-12-08T16:05:00Z',
    payerName: 'Kofi Antwi',
    payerPhone: '0244999888',
    receiptNumber: 'RCP-2024-AR-00001',
  },
];

// Stats helpers
export function getPaymentStats(payments: Payment[]) {
  const completed = payments.filter(p => p.status === 'completed');
  const pending = payments.filter(p => p.status === 'pending');
  const failed = payments.filter(p => p.status === 'failed');
  
  const totalCollected = completed.reduce((sum, p) => sum + p.amount, 0);
  const pendingAmount = pending.reduce((sum, p) => sum + p.amount, 0);
  
  const byMethod: Record<string, number> = {};
  completed.forEach(p => {
    byMethod[p.method] = (byMethod[p.method] || 0) + p.amount;
  });
  
  return {
    totalTransactions: payments.length,
    completedCount: completed.length,
    pendingCount: pending.length,
    failedCount: failed.length,
    totalCollected,
    pendingAmount,
    byMethod,
    successRate: completed.length / payments.length,
  };
}

// Filter helper
export function filterPayments(
  payments: Payment[],
  filters: {
    status?: PaymentStatus;
    method?: PaymentMethod;
    dateFrom?: string;
    dateTo?: string;
    search?: string;
  }
): Payment[] {
  return payments.filter(payment => {
    if (filters.status && payment.status !== filters.status) return false;
    if (filters.method && payment.method !== filters.method) return false;
    if (filters.dateFrom && new Date(payment.createdAt) < new Date(filters.dateFrom)) return false;
    if (filters.dateTo && new Date(payment.createdAt) > new Date(filters.dateTo)) return false;
    if (filters.search) {
      const searchLower = filters.search.toLowerCase();
      if (
        !payment.paymentReference.toLowerCase().includes(searchLower) &&
        !payment.ticketNumber.toLowerCase().includes(searchLower) &&
        !(payment.payerName?.toLowerCase().includes(searchLower))
      ) {
        return false;
      }
    }
    return true;
  });
}

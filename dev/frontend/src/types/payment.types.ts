// Payment Data Types

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export type PaymentMethod = 
  | 'momo'           // MTN Mobile Money
  | 'vodacash'       // Vodafone Cash
  | 'airteltigo'     // AirtelTigo Money
  | 'bank'           // Bank Transfer
  | 'card'           // Debit/Credit Card
  | 'cash';          // Cash at station

export interface Payment {
  id: string;
  
  // Reference
  paymentReference: string;
  ticketId: string;
  ticketNumber: string;
  
  // Amount
  amount: number;
  currency: string;
  originalFine: number;
  lateFee?: number;
  discount?: number;
  
  // Method
  method: PaymentMethod;

  // Mobile Money specific
  phoneNumber?: string;
  network?: string;
  transactionId?: string;
  
  // Status
  status: PaymentStatus;
  statusMessage?: string;
  
  // Timestamps
  createdAt: string;
  processedAt?: string;
  completedAt?: string;
  
  // Payer info
  payerName?: string;
  payerPhone?: string;
  payerEmail?: string;
  
  // Receipt
  receiptNumber?: string;
  
  // Processed by (for cash payments)
  processedById?: string;
  processedByName?: string;
  stationId?: string;
}

// Payment initiation
export interface InitiatePaymentInput {
  ticketId: string;
  method: PaymentMethod;
  phoneNumber?: string;
  payerName?: string;
  payerEmail?: string;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  paymentReference: string;
  amount: number;
  method: PaymentMethod;
  
  // For redirect-based payments
  redirectUrl?: string;
  
  // For USSD/Mobile Money
  ussdCode?: string;
  instructions?: string;
  
  // Timeout
  expiresAt?: string;
}

// Payment verification
export interface VerifyPaymentInput {
  paymentReference: string;
  transactionId?: string;
}

export interface VerifyPaymentResponse {
  payment: Payment;
  ticket: {
    id: string;
    ticketNumber: string;
    status: string;
  };
}

// Cash payment recording (at station)
export interface RecordCashPaymentInput {
  ticketId: string;
  amount: number;
  payerName: string;
  payerPhone?: string;
  notes?: string;
}

// Payment search/filter
export interface PaymentFilters {
  search?: string;
  status?: PaymentStatus | PaymentStatus[];
  method?: PaymentMethod | PaymentMethod[];
  dateFrom?: string;
  dateTo?: string;
  minAmount?: number;
  maxAmount?: number;
  stationId?: string;
  processedById?: string;
}

// Payment statistics
export interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  
  byStatus: Record<string, number>;
  
  byMethod: Record<string, {
    count: number;
    amount: number;
  }>;
  
  todayAmount: number;
  weekAmount: number;
  monthAmount: number;
}

// Revenue report
export interface RevenueReport {
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  startDate: string;
  endDate: string;
  
  totalRevenue: number;
  totalTickets: number;
  collectionRate: number;
  
  breakdown: Array<{
    date: string;
    ticketsIssued: number;
    finesIssued: number;
    paymentsReceived: number;
    amountCollected: number;
  }>;
  
  byRegion?: Array<{
    regionId: string;
    regionName: string;
    revenue: number;
    ticketCount: number;
  }>;
  
  byStation?: Array<{
    stationId: string;
    stationName: string;
    revenue: number;
    ticketCount: number;
  }>;
}

// Receipt data for printing
export interface PaymentReceipt {
  receiptNumber: string;
  ticketNumber: string;
  vehicleReg: string;
  payerName: string;
  amount: number;
  method: string;
  transactionId?: string;
  paidAt: string;
  processedBy?: string;
  stationName: string;
}

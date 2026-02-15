// Payments API

import { api, apiPaginated, buildParams } from './client';
import type { PaginatedResponse, PaginationParams } from '@/types/api.types';
import type {
  Payment,
  PaymentFilters,
  PaymentStats,
  PaymentReceipt,
  InitiatePaymentInput,
  InitiatePaymentResponse,
  VerifyPaymentInput,
  VerifyPaymentResponse,
  RecordCashPaymentInput,
} from '@/types/payment.types';

export const paymentsAPI = {
  async list(
    filters?: PaymentFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<Payment>> {
    const qs = buildParams(filters as Record<string, unknown>, pagination);
    return apiPaginated<Payment>(`/payments?${qs}`);
  },

  async getById(id: string): Promise<Payment> {
    return api.get<Payment>(`/payments/${id}`);
  },

  async getStats(): Promise<PaymentStats> {
    return api.get<PaymentStats>('/payments/stats');
  },

  async getReceipt(id: string): Promise<PaymentReceipt> {
    return api.get<PaymentReceipt>(`/payments/${id}/receipt`);
  },

  async initiate(data: InitiatePaymentInput): Promise<InitiatePaymentResponse> {
    return api.post<InitiatePaymentResponse>('/payments/initiate', data);
  },

  async recordCash(data: RecordCashPaymentInput): Promise<Payment> {
    return api.post<Payment>('/payments/cash', data);
  },

  async verify(data: VerifyPaymentInput): Promise<VerifyPaymentResponse> {
    return api.post<VerifyPaymentResponse>('/payments/verify', data);
  },
};

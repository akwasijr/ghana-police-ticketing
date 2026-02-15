// Tickets API

import { api, apiPaginated, buildParams } from './client';
import type {
  CreateTicketRequest,
  CreateTicketResponse,
  UpdateTicketRequest,
  PaginatedResponse,
  PaginationParams,
  UploadPhotoResponse
} from '@/types/api.types';
import type { Ticket, TicketListItem, TicketFilters, TicketStats } from '@/types/ticket.types';

export interface TicketsAPI {
  create(data: CreateTicketRequest): Promise<CreateTicketResponse>;
  getById(id: string): Promise<Ticket>;
  getByNumber(ticketNumber: string): Promise<Ticket>;
  update(id: string, data: UpdateTicketRequest): Promise<Ticket>;
  list(filters?: TicketFilters, pagination?: PaginationParams): Promise<PaginatedResponse<TicketListItem>>;
  getStats(filters?: { dateFrom?: string; dateTo?: string; stationId?: string; officerId?: string }): Promise<TicketStats>;
  void(id: string, reason: string): Promise<Ticket>;
  uploadPhoto(ticketId: string, photo: File, type: string): Promise<UploadPhotoResponse>;
  search(query: string): Promise<TicketListItem[]>;
}

export const ticketsAPI: TicketsAPI = {
  /**
   * Create a new ticket
   */
  async create(data: CreateTicketRequest): Promise<CreateTicketResponse> {
    return api.post<CreateTicketResponse>('/tickets', data);
  },
  
  /**
   * Get ticket by ID
   */
  async getById(id: string): Promise<Ticket> {
    return api.get<Ticket>(`/tickets/${id}`);
  },
  
  /**
   * Get ticket by ticket number
   */
  async getByNumber(ticketNumber: string): Promise<Ticket> {
    return api.get<Ticket>(`/tickets/number/${ticketNumber}`);
  },
  
  /**
   * Update a ticket
   */
  async update(id: string, data: UpdateTicketRequest): Promise<Ticket> {
    return api.patch<Ticket>(`/tickets/${id}`, data);
  },
  
  /**
   * List tickets with filters and pagination
   */
  async list(
    filters?: TicketFilters,
    pagination?: PaginationParams
  ): Promise<PaginatedResponse<TicketListItem>> {
    const qs = buildParams(filters as Record<string, unknown>, pagination);
    return apiPaginated<TicketListItem>(`/tickets?${qs}`);
  },
  
  /**
   * Get ticket statistics
   */
  async getStats(filters?: {
    dateFrom?: string;
    dateTo?: string;
    stationId?: string;
    officerId?: string;
  }): Promise<TicketStats> {
    const params = new URLSearchParams();
    
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value);
      });
    }
    
    return api.get<TicketStats>(`/tickets/stats?${params.toString()}`);
  },
  
  /**
   * Void/cancel a ticket
   */
  async void(id: string, reason: string): Promise<Ticket> {
    return api.post<Ticket>(`/tickets/${id}/void`, { reason });
  },
  
  /**
   * Upload photo for a ticket
   */
  async uploadPhoto(ticketId: string, photo: File, type: string): Promise<UploadPhotoResponse> {
    const formData = new FormData();
    formData.append('photo', photo);
    formData.append('type', type);
    
    return api.post<UploadPhotoResponse>(`/tickets/${ticketId}/photos`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },
  
  /**
   * Search tickets
   */
  async search(query: string): Promise<TicketListItem[]> {
    return api.get<TicketListItem[]>(`/tickets/search?q=${encodeURIComponent(query)}`);
  },
};

// Offline-first ticket operations
export const offlineTicketsAPI = {
  /**
   * Get tickets from local database
   */
  async getLocalTickets(): Promise<Ticket[]> {
    const { db, STORES } = await import('@/lib/database/db');
    return db.getAll<Ticket>(STORES.TICKETS);
  },
  
  /**
   * Save ticket to local database
   */
  async saveLocalTicket(ticket: Ticket): Promise<void> {
    const { db, STORES } = await import('@/lib/database/db');
    await db.put(STORES.TICKETS, ticket);
  },
  
  /**
   * Get pending (unsynced) tickets
   */
  async getPendingTickets(): Promise<Ticket[]> {
    const { db, STORES } = await import('@/lib/database/db');
    return db.getByIndex<Ticket>(STORES.TICKETS, 'syncStatus', 'pending');
  },
};

// Analytics API

import { api } from './client';

export interface AnalyticsSummary {
  totalTickets: number;
  totalFines: number;
  totalCollected: number;
  collectionRate: number;
  totalOfficers: number;
  totalStations: number;
}

export interface TrendPoint {
  period: string;
  ticketCount: number;
  fineAmount: number;
  collectedAmount: number;
}

export interface TopOffence {
  offenceId: string;
  code: string;
  name: string;
  count: number;
  totalFines: number;
}

export interface RegionAnalytics {
  regionId: string;
  regionName: string;
  ticketCount: number;
  fineAmount: number;
  collectedAmount: number;
  collectionRate: number;
}

export interface RevenueReport {
  totalRevenue: number;
  byMethod: Record<string, { count: number; amount: number }>;
  byPeriod: Array<{ period: string; amount: number; count: number }>;
}

export interface OfficerPerformance {
  officerId: string;
  officerName: string;
  badgeNumber: string;
  ticketCount: number;
  totalFines: number;
  collectionRate: number;
}

interface AnalyticsParams {
  startDate: string;
  endDate: string;
  regionId?: string;
  stationId?: string;
  officerId?: string;
}

function toQueryString(params: AnalyticsParams): string {
  const qs = new URLSearchParams();
  qs.append('startDate', params.startDate);
  qs.append('endDate', params.endDate);
  if (params.regionId) qs.append('regionId', params.regionId);
  if (params.stationId) qs.append('stationId', params.stationId);
  if (params.officerId) qs.append('officerId', params.officerId);
  return qs.toString();
}

export const analyticsAPI = {
  async getSummary(params: AnalyticsParams): Promise<AnalyticsSummary> {
    return api.get<AnalyticsSummary>(`/analytics/summary?${toQueryString(params)}`);
  },

  async getTrends(params: AnalyticsParams & { groupBy?: string }): Promise<TrendPoint[]> {
    const qs = toQueryString(params);
    const extra = params.groupBy ? `&groupBy=${params.groupBy}` : '';
    return api.get<TrendPoint[]>(`/analytics/trends?${qs}${extra}`);
  },

  async getTopOffences(params: AnalyticsParams & { limit?: number }): Promise<TopOffence[]> {
    const qs = toQueryString(params);
    const extra = params.limit ? `&limit=${params.limit}` : '';
    return api.get<TopOffence[]>(`/analytics/top-offences?${qs}${extra}`);
  },

  async getByRegion(params: AnalyticsParams): Promise<RegionAnalytics[]> {
    return api.get<RegionAnalytics[]>(`/analytics/by-region?${toQueryString(params)}`);
  },

  async getRevenue(params: AnalyticsParams & { groupBy?: string }): Promise<RevenueReport> {
    const qs = toQueryString(params);
    const extra = params.groupBy ? `&groupBy=${params.groupBy}` : '';
    return api.get<RevenueReport>(`/analytics/revenue?${qs}${extra}`);
  },

  async getOfficerPerformance(params: AnalyticsParams & { limit?: number }): Promise<OfficerPerformance[]> {
    const qs = toQueryString(params);
    const extra = params.limit ? `&limit=${params.limit}` : '';
    return api.get<OfficerPerformance[]>(`/analytics/officer-performance?${qs}${extra}`);
  },
};

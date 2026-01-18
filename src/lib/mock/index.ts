// Centralized Mock Data Module
// All demo/mock data in one place with environment toggle

// Geographic hierarchy
export * from './regions.mock';
export * from './stations.mock';

// Personnel
export * from './officers.mock';

// Operations
export * from './offences.mock';
export * from './tickets.mock';
export * from './payments.mock';
export * from './objections.mock';

// System
export * from './audit.mock';

// Re-export environment check
export { shouldUseMock, ENV } from '@/config/environment';

// Utility to get mock data summary (for dev tools/debugging)
export const getMockDataSummary = async () => {
  const regions = await import('./regions.mock');
  const stations = await import('./stations.mock');
  const officers = await import('./officers.mock');
  const offences = await import('./offences.mock');
  const tickets = await import('./tickets.mock');
  const payments = await import('./payments.mock');
  const objections = await import('./objections.mock');
  const audit = await import('./audit.mock');

  return {
    regions: { count: regions.MOCK_REGIONS.length },
    divisions: { count: regions.MOCK_DIVISIONS.length },
    districts: { count: regions.MOCK_DISTRICTS.length },
    stations: stations.getStationStats(),
    officers: officers.getOfficerStats(),
    offences: offences.getOffenceStats(),
    tickets: tickets.getTicketStats(tickets.MOCK_TICKETS),
    payments: payments.getPaymentStats(payments.MOCK_PAYMENTS),
    objections: objections.getObjectionStats(objections.MOCK_OBJECTIONS),
    auditLogs: audit.getAuditLogStats(),
  };
};

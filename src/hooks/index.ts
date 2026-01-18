// Custom hooks barrel export

export { useAuth } from './useAuth';
export { useOffline } from './useOffline';
export { usePrinter } from './usePrinter';
export { useLocation, calculateDistance } from './useLocation';
export { useCamera, resizeImage } from './useCamera';
export { usePageFilters } from './usePageFilters';
export { useTicketForm } from './useTicketForm';

export type { DateRange, PageFiltersOptions, PageFiltersResult } from './usePageFilters';
export type { UseTicketFormReturn, ViolationItem, UseTicketFormOptions } from './useTicketForm';

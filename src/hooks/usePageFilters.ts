import { useState, useMemo, useCallback } from 'react';

export interface DateRange {
  from: string;
  to: string;
}

export interface PageFiltersOptions<T> {
  data: T[];
  searchFields: (keyof T)[];
  dateField?: keyof T;
  jurisdictionFilter?: (item: T) => boolean;
}

export interface PageFiltersResult<T> {
  // State
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  dateRange: DateRange;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  clearDateRange: () => void;
  
  // Filtered data
  filteredData: T[];
  
  // Helpers
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

export function usePageFilters<T extends Record<string, unknown>>({
  data,
  searchFields,
  dateField,
  jurisdictionFilter,
}: PageFiltersOptions<T>): PageFiltersResult<T> {
  const [searchTerm, setSearchTerm] = useState('');
  const [dateRange, setDateRange] = useState<DateRange>({ from: '', to: '' });

  const setDateFrom = useCallback((date: string) => {
    setDateRange((prev) => ({ ...prev, from: date }));
  }, []);

  const setDateTo = useCallback((date: string) => {
    setDateRange((prev) => ({ ...prev, to: date }));
  }, []);

  const clearDateRange = useCallback(() => {
    setDateRange({ from: '', to: '' });
  }, []);

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setDateRange({ from: '', to: '' });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return searchTerm !== '' || dateRange.from !== '' || dateRange.to !== '';
  }, [searchTerm, dateRange]);

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      // Jurisdiction filter
      if (jurisdictionFilter && !jurisdictionFilter(item)) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const lowerSearch = searchTerm.toLowerCase();
        const matchesSearch = searchFields.some((field) => {
          const value = item[field];
          if (typeof value === 'string') {
            return value.toLowerCase().includes(lowerSearch);
          }
          if (typeof value === 'number') {
            return value.toString().includes(lowerSearch);
          }
          return false;
        });
        if (!matchesSearch) return false;
      }

      // Date range filter
      if (dateField && (dateRange.from || dateRange.to)) {
        const dateValue = item[dateField];
        if (typeof dateValue === 'string') {
          const itemDate = new Date(dateValue);
          if (dateRange.from) {
            const startDate = new Date(`${dateRange.from}T00:00:00`);
            if (itemDate < startDate) return false;
          }
          if (dateRange.to) {
            const endDate = new Date(`${dateRange.to}T23:59:59`);
            if (itemDate > endDate) return false;
          }
        }
      }

      return true;
    });
  }, [data, searchTerm, searchFields, dateField, dateRange, jurisdictionFilter]);

  return {
    searchTerm,
    setSearchTerm,
    dateRange,
    setDateFrom,
    setDateTo,
    clearDateRange,
    filteredData,
    resetFilters,
    hasActiveFilters,
  };
}

import { Search, X } from 'lucide-react';
import type { ReactNode } from 'react';

export interface FilterBarProps {
  // Search
  searchTerm: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  
  // Date range
  dateFrom?: string;
  dateTo?: string;
  onDateFromChange?: (value: string) => void;
  onDateToChange?: (value: string) => void;
  showDateFilters?: boolean;
  
  // Custom filters slot
  children?: ReactNode;
  
  // Reset
  hasActiveFilters?: boolean;
  onResetFilters?: () => void;
  showReset?: boolean;
}

export function FilterBar({
  searchTerm,
  onSearchChange,
  searchPlaceholder = 'Search...',
  dateFrom = '',
  dateTo = '',
  onDateFromChange,
  onDateToChange,
  showDateFilters = true,
  children,
  hasActiveFilters = false,
  onResetFilters,
  showReset = true,
}: FilterBarProps) {
  return (
    <div className="bg-white p-3 border border-gray-200 flex flex-wrap items-center gap-2">
      {/* Search Input */}
      <div className="relative flex-1 min-w-[200px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
        <input
          type="text"
          placeholder={searchPlaceholder}
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full h-8 pl-8 pr-3 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
        />
      </div>

      {/* Date Range Filters */}
      {showDateFilters && onDateFromChange && onDateToChange && (
        <>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => onDateFromChange(e.target.value)}
              className="h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
              aria-label="Start date"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-gray-500">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => onDateToChange(e.target.value)}
              className="h-8 px-2 text-xs border border-gray-200 focus:outline-none focus:border-[#1A1F3A] bg-white"
              aria-label="End date"
            />
          </div>
        </>
      )}

      {/* Custom Filters */}
      {children}

      {/* Reset Button */}
      {showReset && hasActiveFilters && onResetFilters && (
        <button
          onClick={onResetFilters}
          className="h-8 px-2 flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-50 border border-transparent hover:border-gray-200"
          title="Clear all filters"
        >
          <X className="h-3.5 w-3.5" />
          Clear
        </button>
      )}
    </div>
  );
}

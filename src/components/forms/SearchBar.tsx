// Search Bar Component

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui';
import { Search, X, Loader2 } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onSearch?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
  handheld?: boolean;
  autoFocus?: boolean;
  debounceMs?: number;
  showClear?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onSearch,
  placeholder = 'Search...',
  disabled = false,
  loading = false,
  handheld = false,
  autoFocus = false,
  debounceMs = 300,
  showClear = true,
  className = '',
}: SearchBarProps) {
  const [localValue, setLocalValue] = useState(value);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync local value with prop
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Clear previous debounce
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // Debounce the onChange callback
    debounceRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && onSearch) {
      // Clear debounce and trigger immediate search
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      onChange(localValue);
      onSearch(localValue);
    }
    
    if (e.key === 'Escape') {
      handleClear();
    }
  };

  const handleClear = () => {
    setLocalValue('');
    onChange('');
    inputRef.current?.focus();
  };

  // Cleanup debounce on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Search icon */}
      <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
        {loading ? (
          <Loader2 className={`animate-spin text-gray-400 ${handheld ? 'h-5 w-5' : 'h-4 w-4'}`} />
        ) : (
          <Search className={`text-gray-400 ${handheld ? 'h-5 w-5' : 'h-4 w-4'}`} />
        )}
      </div>
      
      <Input
        ref={inputRef}
        type="search"
        value={localValue}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        handheld={handheld}
        className={`
          pl-10
          ${showClear && localValue ? 'pr-10' : 'pr-4'}
          ${handheld ? 'text-base' : 'text-sm'}
        `}
      />
      
      {/* Clear button */}
      {showClear && localValue && !disabled && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear search"
          className={`
            absolute right-3 top-1/2 -translate-y-1/2
            p-1 rounded-full
            text-gray-400 hover:text-gray-600
            hover:bg-gray-100
            transition-colors
          `}
        >
          <X className={handheld ? 'h-5 w-5' : 'h-4 w-4'} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}

// Specialized ticket search
interface TicketSearchProps extends Omit<SearchBarProps, 'placeholder'> {
  searchType?: 'ticket' | 'vehicle' | 'all';
}

export function TicketSearch({
  searchType = 'all',
  ...props
}: TicketSearchProps) {
  const placeholders = {
    ticket: 'Search by ticket number (e.g., TKT-20240115-001)',
    vehicle: 'Search by vehicle registration (e.g., GT-1234-22)',
    all: 'Search tickets, vehicles, or phone numbers...',
  };
  
  return (
    <SearchBar
      placeholder={placeholders[searchType]}
      {...props}
    />
  );
}

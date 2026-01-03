// Currency Input Component
// Displays amounts in Ghana Cedis (GH₵)

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui';
import { formatCurrency } from '@/lib/utils/formatting';
import { AlertCircle } from 'lucide-react';

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  handheld?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  error?: string;
  min?: number;
  max?: number;
  label?: string;
  required?: boolean;
  readOnly?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  disabled = false,
  handheld = false,
  autoFocus = false,
  placeholder = '0.00',
  error,
  min = 0,
  max,
  label,
  required = false,
  readOnly = false,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState('');
  const [isFocused, setIsFocused] = useState(false);

  // Format for display when not focused
  useEffect(() => {
    if (!isFocused) {
      setDisplayValue(value > 0 ? value.toFixed(2) : '');
    }
  }, [value, isFocused]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    
    // Allow only numbers and one decimal point
    const cleaned = input.replace(/[^\d.]/g, '');
    
    // Ensure only one decimal point
    const parts = cleaned.split('.');
    let formatted = parts[0];
    if (parts.length > 1) {
      formatted += '.' + parts[1].slice(0, 2); // Limit to 2 decimal places
    }
    
    setDisplayValue(formatted);
    
    const numValue = parseFloat(formatted) || 0;
    onChange(numValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number for editing
    setDisplayValue(value > 0 ? value.toString() : '');
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format display value
    setDisplayValue(value > 0 ? value.toFixed(2) : '');
  };

  const isOutOfRange = (min !== undefined && value < min) || (max !== undefined && value > max);

  return (
    <div className="space-y-1">
      {label && (
        <label className={`block font-medium text-gray-700 ${handheld ? 'text-base' : 'text-sm'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Currency symbol */}
        <div className={`
          absolute left-3 top-1/2 -translate-y-1/2 
          font-semibold text-gray-500
          ${handheld ? 'text-lg' : 'text-base'}
        `}>
          GH₵
        </div>
        
        <Input
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
          readOnly={readOnly}
          autoFocus={autoFocus}
          placeholder={placeholder}
          handheld={handheld}
          className={`
            pl-14 text-right font-mono
            ${handheld ? 'text-xl' : 'text-lg'}
            ${error || isOutOfRange ? 'border-red-500 focus:ring-red-500' : ''}
            ${readOnly ? 'bg-gray-50 cursor-default' : ''}
          `}
        />
        
        {(error || isOutOfRange) && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <AlertCircle className={`text-red-500 ${handheld ? 'h-5 w-5' : 'h-4 w-4'}`} />
          </div>
        )}
      </div>
      
      {/* Error message */}
      {error && (
        <p className={`text-red-500 ${handheld ? 'text-base' : 'text-sm'}`}>
          {error}
        </p>
      )}
      
      {/* Range error */}
      {isOutOfRange && !error && (
        <p className={`text-red-500 ${handheld ? 'text-base' : 'text-sm'}`}>
          {min !== undefined && value < min && `Minimum amount: ${formatCurrency(min)}`}
          {max !== undefined && value > max && `Maximum amount: ${formatCurrency(max)}`}
        </p>
      )}
    </div>
  );
}

// Display-only currency component
interface CurrencyDisplayProps {
  value: number;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  colored?: boolean;
}

export function CurrencyDisplay({ 
  value, 
  size = 'md',
  className = '',
  colored = false,
}: CurrencyDisplayProps) {
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-2xl',
  };
  
  const colorClass = colored 
    ? value > 0 ? 'text-green-600' : value < 0 ? 'text-red-600' : 'text-gray-900'
    : 'text-gray-900';
  
  return (
    <span className={`font-mono font-semibold ${sizeClasses[size]} ${colorClass} ${className}`}>
      {formatCurrency(value)}
    </span>
  );
}

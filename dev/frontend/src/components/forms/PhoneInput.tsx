// Ghana Phone Number Input Component
// Handles Ghana phone format: 0XX XXX XXXX or +233 XX XXX XXXX

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui';
import { validatePhoneNumber } from '@/lib/utils';
import { Phone, AlertCircle, CheckCircle2 } from 'lucide-react';

interface PhoneInputProps {
  value: string;
  onChange: (value: string, formatted: string) => void;
  onValidChange?: (isValid: boolean) => void;
  disabled?: boolean;
  handheld?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  error?: string;
  required?: boolean;
  label?: string;
}

export function PhoneInput({
  value,
  onChange,
  onValidChange,
  disabled = false,
  handheld = false,
  autoFocus = false,
  placeholder = '024 123 4567',
  error: externalError,
  required = false,
  label,
}: PhoneInputProps) {
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const [displayValue, setDisplayValue] = useState('');

  // Format phone number for display
  const formatForDisplay = (input: string): string => {
    // Remove all non-digit characters except +
    let cleaned = input.replace(/[^\d+]/g, '');
    
    // Handle +233 prefix
    if (cleaned.startsWith('+233')) {
      cleaned = cleaned.slice(4);
    } else if (cleaned.startsWith('233')) {
      cleaned = cleaned.slice(3);
    } else if (cleaned.startsWith('0')) {
      cleaned = cleaned.slice(1);
    }
    
    // Format as XXX XXX XXXX
    let formatted = '';
    if (cleaned.length > 0) {
      formatted = '0' + cleaned.slice(0, 2);
    }
    if (cleaned.length > 2) {
      formatted += ' ' + cleaned.slice(2, 5);
    }
    if (cleaned.length > 5) {
      formatted += ' ' + cleaned.slice(5, 9);
    }
    
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatForDisplay(input);
    setDisplayValue(formatted);
    
    // Store cleaned value
    const cleaned = formatted.replace(/\s/g, '');
    onChange(cleaned, formatted);
    
    // Validate
    const valid = validatePhoneNumber(cleaned);
    setIsValid(valid);
    onValidChange?.(valid);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  // Update display when value changes externally
  useEffect(() => {
    if (value && !displayValue) {
      setDisplayValue(formatForDisplay(value));
    }
    const valid = validatePhoneNumber(value);
    setIsValid(valid);
  }, [value]);

  const showError = touched && !isValid && value.length > 0;
  const showSuccess = isValid && value.length > 0;
  const isEmpty = !value || value.length === 0;

  return (
    <div className="space-y-1">
      {label && (
        <label className={`block font-medium text-gray-700 ${handheld ? 'text-base' : 'text-sm'}`}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="relative">
        {/* Phone icon */}
        <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
          <Phone className={`text-gray-400 ${handheld ? 'h-5 w-5' : 'h-4 w-4'}`} />
        </div>
        
        <Input
          type="tel"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          maxLength={13} // 0XX XXX XXXX format
          handheld={handheld}
          inputMode="tel"
          className={`
            pl-10
            ${handheld ? 'text-lg' : 'text-base'}
            ${showError ? 'border-red-500 focus:ring-red-500' : ''}
            ${showSuccess ? 'border-green-500 focus:ring-green-500' : ''}
            pr-10
          `}
        />
        
        {/* Status icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {showError && (
            <AlertCircle className={`text-red-500 ${handheld ? 'h-5 w-5' : 'h-4 w-4'}`} />
          )}
          {showSuccess && (
            <CheckCircle2 className={`text-green-500 ${handheld ? 'h-5 w-5' : 'h-4 w-4'}`} />
          )}
        </div>
      </div>
      
      {/* Error message */}
      {(showError || externalError) && (
        <p className={`text-red-500 ${handheld ? 'text-base' : 'text-sm'}`}>
          {externalError || 'Please enter a valid Ghana phone number'}
        </p>
      )}
      
      {/* Helper text */}
      {!touched && isEmpty && (
        <p className={`text-gray-500 ${handheld ? 'text-base' : 'text-sm'}`}>
          Ghana mobile number (e.g., 024 123 4567)
        </p>
      )}
    </div>
  );
}

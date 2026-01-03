// Vehicle Registration Input Component
// Handles Ghana vehicle registration format: GT-XXXX-YY, GR-XXXX-YY, etc.

import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui';
import { validateVehicleRegistration } from '@/lib/utils/validation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface VehicleRegInputProps {
  value: string;
  onChange: (value: string) => void;
  onValidChange?: (isValid: boolean) => void;
  disabled?: boolean;
  handheld?: boolean;
  autoFocus?: boolean;
  placeholder?: string;
  error?: string;
}

export function VehicleRegInput({
  value,
  onChange,
  onValidChange,
  disabled = false,
  handheld = false,
  autoFocus = false,
  placeholder = 'GT-1234-22',
  error: externalError,
}: VehicleRegInputProps) {
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-format the registration number
  const formatRegistration = (input: string): string => {
    // Remove all non-alphanumeric characters
    let cleaned = input.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Format as XX-XXXX-XX
    let formatted = '';
    
    // First part: 2 letters (region code)
    if (cleaned.length > 0) {
      formatted = cleaned.slice(0, 2);
    }
    
    // Add first hyphen
    if (cleaned.length > 2) {
      formatted += '-' + cleaned.slice(2, 6);
    }
    
    // Add second hyphen and year
    if (cleaned.length > 6) {
      formatted += '-' + cleaned.slice(6, 8);
    }
    
    return formatted;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatRegistration(e.target.value);
    onChange(formatted);
    
    // Validate
    const valid = validateVehicleRegistration(formatted);
    setIsValid(valid);
    onValidChange?.(valid);
  };

  const handleBlur = () => {
    setTouched(true);
  };

  const showError = touched && !isValid && value.length > 0;
  const showSuccess = isValid && value.length > 0;

  // Update validation when value changes externally
  useEffect(() => {
    const valid = validateVehicleRegistration(value);
    setIsValid(valid);
  }, [value]);

  return (
    <div className="space-y-1">
      <div className="relative">
        <Input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={disabled}
          autoFocus={autoFocus}
          placeholder={placeholder}
          maxLength={11} // XX-XXXX-XX format
          handheld={handheld}
          className={`
            font-mono uppercase tracking-wider
            ${handheld ? 'text-lg' : 'text-base'}
            ${showError ? 'border-red-500 focus:ring-red-500' : ''}
            ${showSuccess ? 'border-green-500 focus:ring-green-500' : ''}
            pr-10
          `}
        />
        
        {/* Status icon */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {showError && (
            <AlertCircle className="h-5 w-5 text-red-500" />
          )}
          {showSuccess && (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          )}
        </div>
      </div>
      
      {/* Error message */}
      {(showError || externalError) && (
        <p className={`text-sm text-red-500 ${handheld ? 'text-base' : ''}`}>
          {externalError || 'Invalid registration format. Use: GT-1234-22'}
        </p>
      )}
      
      {/* Helper text */}
      {!touched && !showSuccess && (
        <p className={`text-sm text-gray-500 ${handheld ? 'text-base' : ''}`}>
          Format: Region-Number-Year (e.g., GT-1234-22)
        </p>
      )}
    </div>
  );
}

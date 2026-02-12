// Select Input Component

import React, { forwardRef } from 'react';
import { ChevronDown, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange'> {
  options: SelectOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  handheld?: boolean;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      options,
      value,
      onChange,
      placeholder = 'Select an option',
      error,
      label,
      required = false,
      handheld = false,
      fullWidth = true,
      disabled = false,
      className,
      ...props
    },
    ref
  ) => {
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      onChange(e.target.value);
    };

    return (
      <div className={cn('space-y-1', fullWidth && 'w-full')}>
        {label && (
          <label className={cn(
            'block font-medium text-gray-700',
            handheld ? 'text-base' : 'text-sm'
          )}>
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          <select
            ref={ref}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              'block w-full appearance-none rounded-lg border bg-white',
              'focus:outline-none focus:ring-2 focus:ring-offset-0',
              'transition-colors duration-200',
              // Sizes
              handheld 
                ? 'h-14 px-4 text-lg'
                : 'h-10 px-3 text-sm',
              // States
              error
                ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20'
                : 'border-gray-300 focus:border-primary-blue focus:ring-primary-blue/20',
              disabled && 'bg-gray-100 cursor-not-allowed opacity-60',
              !value && 'text-gray-500',
              'pr-10',
              className
            )}
            {...props}
          >
            <option value="" disabled>
              {placeholder}
            </option>
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
              >
                {option.label}
              </option>
            ))}
          </select>
          
          {/* Custom arrow */}
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
            {error ? (
              <AlertCircle className={cn(
                'text-red-500',
                handheld ? 'h-5 w-5' : 'h-4 w-4'
              )} />
            ) : (
              <ChevronDown className={cn(
                'text-gray-400',
                handheld ? 'h-5 w-5' : 'h-4 w-4'
              )} />
            )}
          </div>
        </div>
        
        {error && (
          <p className={cn(
            'text-red-500',
            handheld ? 'text-base' : 'text-sm'
          )}>
            {error}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

// Multi-select component
interface MultiSelectProps {
  options: SelectOption[];
  values: string[];
  onChange: (values: string[]) => void;
  placeholder?: string;
  error?: string;
  label?: string;
  required?: boolean;
  handheld?: boolean;
  maxSelections?: number;
}

export function MultiSelect({
  options,
  values,
  onChange,
  // placeholder = 'Select options',
  error,
  label,
  required = false,
  handheld = false,
  maxSelections,
}: MultiSelectProps) {
  const toggleOption = (value: string) => {
    if (values.includes(value)) {
      onChange(values.filter((v) => v !== value));
    } else {
      if (maxSelections && values.length >= maxSelections) {
        return;
      }
      onChange([...values, value]);
    }
  };

  const selectedLabels = options
    .filter((opt) => values.includes(opt.value))
    .map((opt) => opt.label);

  return (
    <div className="space-y-2">
      {label && (
        <label className={cn(
          'block font-medium text-gray-700',
          handheld ? 'text-base' : 'text-sm'
        )}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      {/* Selected tags */}
      {selectedLabels.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedLabels.map((label, index) => (
            <span
              key={index}
              className={cn(
                'inline-flex items-center gap-1 px-2 py-1 rounded-full',
                'bg-primary-blue/10 text-primary-blue',
                handheld ? 'text-sm' : 'text-xs'
              )}
            >
              {label}
              <button
                type="button"
                onClick={() => toggleOption(values[index])}
                className="hover:bg-primary-blue/20 rounded-full p-0.5"
              >
                <span className="sr-only">Remove</span>
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      
      {/* Options list */}
      <div className={cn(
        'border border-gray-300 rounded-lg overflow-hidden',
        'max-h-48 overflow-y-auto'
      )}>
        {options.map((option) => {
          const isSelected = values.includes(option.value);
          const isDisabled = option.disabled || 
            (!isSelected && maxSelections && values.length >= maxSelections);
          
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => !isDisabled && toggleOption(option.value)}
              disabled={!!isDisabled}
              className={cn(
                'w-full px-3 py-2 text-left transition-colors',
                'flex items-center justify-between',
                handheld ? 'text-base py-3' : 'text-sm',
                isSelected 
                  ? 'bg-primary-blue/10 text-primary-blue'
                  : 'hover:bg-gray-50',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              <span>{option.label}</span>
              {isSelected && (
                <span className="text-primary-blue">✓</span>
              )}
            </button>
          );
        })}
      </div>
      
      {maxSelections && (
        <p className={cn(
          'text-gray-500',
          handheld ? 'text-sm' : 'text-xs'
        )}>
          {values.length}/{maxSelections} selected
        </p>
      )}
      
      {error && (
        <p className={cn(
          'text-red-500',
          handheld ? 'text-base' : 'text-sm'
        )}>
          {error}
        </p>
      )}
    </div>
  );
}

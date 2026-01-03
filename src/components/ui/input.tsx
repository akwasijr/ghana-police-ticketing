import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isHandheld?: boolean;
  handheld?: boolean; // Alias for isHandheld
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, hint, leftIcon, rightIcon, isHandheld, handheld, id, ...props }, ref) => {
    const inputId = id || React.useId();
    const isHandheldMode = isHandheld || handheld;
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className={cn(
              'block font-medium mb-1.5 text-gray-700',
              isHandheldMode ? 'text-base' : 'text-sm'
            )}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className={cn(
              'absolute left-3 top-1/2 -translate-y-1/2 text-gray-400',
              isHandheldMode && 'left-4'
            )}>
              {leftIcon}
            </div>
          )}
          <input
            type={type}
            id={inputId}
            className={cn(
              'flex w-full bg-gray-100 text-gray-900 transition-colors',
              'placeholder:text-gray-400',
              'focus:outline-none focus:bg-gray-50 focus:ring-2 focus:ring-[#1A1F3A]/20',
              'disabled:cursor-not-allowed disabled:opacity-50',
              error ? 'ring-2 ring-red-500/30 bg-red-50' : '',
              isHandheldMode ? 'h-14 px-4 text-base' : 'h-10 px-3 text-sm',
              leftIcon && (isHandheldMode ? 'pl-12' : 'pl-10'),
              rightIcon && (isHandheldMode ? 'pr-12' : 'pr-10'),
              className
            )}
            ref={ref}
            aria-invalid={!!error}
            aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined}
            {...props}
          />
          {rightIcon && (
            <div className={cn(
              'absolute right-3 top-1/2 -translate-y-1/2 text-gray-400',
              isHandheldMode && 'right-4'
            )}>
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p
            id={`${inputId}-error`}
            className={cn(
              'mt-1.5 text-red-500',
              isHandheldMode ? 'text-sm' : 'text-xs'
            )}
          >
            {error}
          </p>
        )}
        {hint && !error && (
          <p
            id={`${inputId}-hint`}
            className={cn(
              'mt-1.5 text-gray-500',
              isHandheldMode ? 'text-sm' : 'text-xs'
            )}
          >
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };

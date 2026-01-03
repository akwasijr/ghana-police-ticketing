import React from 'react';
import { cn } from '@/lib/utils';
import logoColored from '@/assets/logo-colored.svg';
import logoWhite from '@/assets/logo-white.svg';

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  variant?: 'colored' | 'white';
  showText?: boolean;
  className?: string;
}

const sizeClasses = {
  sm: 'w-10 h-10',
  md: 'w-14 h-14',
  lg: 'w-20 h-20',
  xl: 'w-24 h-24',
  '2xl': 'w-32 h-32',
};

const textSizeClasses = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

export const Logo: React.FC<LogoProps> = ({ 
  size = 'md', 
  variant = 'colored',
  showText = false,
  className 
}) => {
  const logoSrc = variant === 'white' ? logoWhite : logoColored;

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <img 
        src={logoSrc} 
        alt="Ghana Police Service" 
        className={cn(sizeClasses[size], 'object-contain')}
      />
      {showText && (
        <div className="flex flex-col">
          <span className={cn(
            'font-semibold leading-tight', 
            textSizeClasses[size],
            variant === 'white' ? 'text-white' : 'text-gray-900'
          )}>
            Ghana Police Service
          </span>
          <span className={cn(
            'leading-tight', 
            size === 'xl' || size === '2xl' ? 'text-sm' : 'text-xs',
            variant === 'white' ? 'text-white/70' : 'text-gray-600'
          )}>
            Traffic Ticketing System
          </span>
        </div>
      )}
    </div>
  );
};

export default Logo;

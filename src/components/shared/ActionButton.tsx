import { cn } from '@/lib/utils';
import type { FC } from 'react';

interface ActionButtonProps {
  icon: FC<{ className?: string }>;
  label: string;
  onClick?: () => void;
  variant?: 'default' | 'primary';
  title?: string;
  disabled?: boolean;
}

export function ActionButton({
  icon: Icon,
  label,
  onClick,
  variant = 'default',
  title,
  disabled = false
}: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={cn(
        'h-8 px-3 flex items-center gap-1.5 text-xs font-medium transition-colors',
        variant === 'primary'
          ? 'bg-[#1A1F3A] text-white hover:bg-[#2a325a] disabled:bg-gray-300'
          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

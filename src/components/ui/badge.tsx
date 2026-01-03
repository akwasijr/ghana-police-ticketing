import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { Check, Clock, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide',
  {
    variants: {
      variant: {
        default: 'bg-surface-elevated text-text-secondary',
        paid: 'bg-status-success/10 text-status-success',
        unpaid: 'bg-status-warning/10 text-[#E65100]',
        overdue: 'bg-status-error/10 text-status-error',
        objection: 'bg-status-info/10 text-status-info',
        cancelled: 'bg-surface-elevated text-text-secondary',
        success: 'bg-status-success/10 text-status-success',
        warning: 'bg-status-warning/10 text-[#E65100]',
        error: 'bg-status-error/10 text-status-error',
        info: 'bg-status-info/10 text-status-info',
        // Handheld variants (higher contrast)
        'handheld-paid': 'bg-status-success/20 text-[#81C784]',
        'handheld-unpaid': 'bg-status-warning/20 text-[#FFB74D]',
        'handheld-overdue': 'bg-status-error/20 text-[#E57373]',
        'handheld-objection': 'bg-status-info/20 text-[#64B5F6]',
      },
      size: {
        sm: 'h-5 px-2 text-[10px]',
        md: 'h-6 px-3 text-xs',
        lg: 'h-7 px-3 text-sm',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  showIcon?: boolean;
}

const statusIcons = {
  paid: Check,
  success: Check,
  'handheld-paid': Check,
  unpaid: Clock,
  warning: Clock,
  'handheld-unpaid': Clock,
  overdue: AlertCircle,
  error: AlertCircle,
  'handheld-overdue': AlertCircle,
  objection: Info,
  info: Info,
  'handheld-objection': Info,
  cancelled: X,
  default: null,
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, showIcon = true, children, ...props }, ref) => {
    const IconComponent = variant ? statusIcons[variant] : null;
    
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size }), className)}
        {...props}
      >
        {showIcon && IconComponent && (
          <IconComponent className={cn(
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-4 w-4' : 'h-3.5 w-3.5'
          )} />
        )}
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Convenience component for ticket status
interface TicketStatusBadgeProps {
  status: 'paid' | 'unpaid' | 'overdue' | 'objection' | 'cancelled';
  size?: 'sm' | 'md' | 'lg';
  isHandheld?: boolean;
}

const TicketStatusBadge: React.FC<TicketStatusBadgeProps> = ({ 
  status, 
  size = 'md',
  isHandheld = false 
}) => {
  const variant = isHandheld ? `handheld-${status}` as const : status;
  const labels = {
    paid: 'Paid',
    unpaid: 'Unpaid',
    overdue: 'Overdue',
    objection: 'Objection',
    cancelled: 'Cancelled',
    'handheld-paid': 'Paid',
    'handheld-unpaid': 'Unpaid',
    'handheld-overdue': 'Overdue',
    'handheld-objection': 'Objection',
    'handheld-cancelled': 'Cancelled',
  };
  
  return (
    <Badge variant={variant as any} size={size}>
      {labels[status]}
    </Badge>
  );
};

export { Badge, badgeVariants, TicketStatusBadge };

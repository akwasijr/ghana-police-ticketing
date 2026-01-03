import { ChevronRight, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';

export interface TicketListItemProps {
  ticket: {
    id: string;
    vehicle: string;
    status?: 'paid' | 'unpaid' | 'overdue';
    offense: string;
    date: string;
    time: string;
    amount: number;
  };
  onClick: () => void;
}

export function TicketListItem({ ticket, onClick }: TicketListItemProps) {
  const getStatusStyle = (status?: string) => {
    switch (status) {
      case 'paid': return { bg: '#DCFCE7', color: '#166534', icon: CheckCircle2 };
      case 'unpaid': return { bg: '#FEF3C7', color: '#92400E', icon: Clock };
      case 'overdue': return { bg: '#FEE2E2', color: '#991B1B', icon: AlertTriangle };
      default: return { bg: '#F3F4F6', color: '#374151', icon: Clock };
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  const statusStyle = getStatusStyle(ticket.status);

  return (
    <button
      onClick={onClick}
      className="w-full block text-left transition-colors"
      style={{ backgroundColor: '#FFFFFF', padding: '16px', marginBottom: '12px' }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-lg font-bold" style={{ color: '#1A1F3A' }}>
          {ticket.vehicle}
        </span>
        {ticket.status && (
          <span 
            className="px-2 py-1 text-xs font-semibold uppercase"
            style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
          >
            {ticket.status}
          </span>
        )}
      </div>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-700">{ticket.offense}</p>
          <p className="text-xs text-gray-500 mt-1">{formatDate(ticket.date)} • {ticket.time}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="font-bold" style={{ color: '#1A1F3A' }}>{formatCurrency(ticket.amount)}</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </button>
  );
}

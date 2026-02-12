import React from 'react';
import { ChevronRight } from 'lucide-react';
import { formatCurrency } from '@/lib/utils/formatting';
import { cn } from '@/lib/utils';

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

const getStatusClasses = (status?: string) => {
  switch (status) {
    case 'paid': return { bg: 'bg-green-100', text: 'text-green-800' };
    case 'unpaid': return { bg: 'bg-amber-100', text: 'text-amber-800' };
    case 'overdue': return { bg: 'bg-red-100', text: 'text-red-800' };
    default: return { bg: 'bg-gray-100', text: 'text-gray-800' };
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

export const TicketListItem = React.memo<TicketListItemProps>(function TicketListItem({ ticket, onClick }) {
  const statusClasses = getStatusClasses(ticket.status);

  return (
    <button
      onClick={onClick}
      className="w-full block text-left transition-colors bg-white p-4 mb-3"
    >
      <div className="flex items-center justify-between mb-2">
        <span className="font-mono text-lg font-bold text-primary-blue">
          {ticket.vehicle}
        </span>
        {ticket.status && (
          <span className={cn('px-2 py-1 text-xs font-semibold uppercase', statusClasses.bg, statusClasses.text)}>
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
          <span className="font-bold text-primary-blue">{formatCurrency(ticket.amount)}</span>
          <ChevronRight className="h-4 w-4 text-gray-400" />
        </div>
      </div>
    </button>
  );
});

export default TicketListItem;

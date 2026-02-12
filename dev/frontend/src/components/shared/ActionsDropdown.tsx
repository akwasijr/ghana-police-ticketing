import { useState, useRef, useEffect } from 'react';
import { MoreVertical, Printer, FileDown, Mail, Bell, CheckCircle2, FileText, Phone, FileCheck } from 'lucide-react';

export interface Action {
  id: string;
  label: string;
  icon: React.ElementType;
  onClick: () => void;
  variant?: 'default' | 'primary' | 'success' | 'danger';
  divider?: boolean; // Add divider after this item
}

interface ActionsDropdownProps {
  actions: Action[];
  align?: 'left' | 'right';
}

export function ActionsDropdown({ actions, align = 'right' }: ActionsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const getButtonClasses = (variant?: string) => {
    const base = 'w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors';
    
    switch (variant) {
      case 'primary':
        return `${base} text-[#1A1F3A] font-medium hover:bg-[#1A1F3A] hover:text-white`;
      case 'success':
        return `${base} text-green-700 font-medium hover:bg-green-50`;
      case 'danger':
        return `${base} text-red-700 font-medium hover:bg-red-50`;
      default:
        return `${base} text-gray-700 hover:bg-gray-50`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors"
        aria-label="Actions menu"
      >
        Actions
        <MoreVertical className="h-3.5 w-3.5" />
      </button>

      {isOpen && (
        <div 
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1 min-w-[200px] bg-white border border-gray-200 z-50`}
          style={{ 
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <div key={action.id}>
                <button
                  onClick={() => {
                    action.onClick();
                    setIsOpen(false);
                  }}
                  className={getButtonClasses(action.variant)}
                >
                  <Icon className="h-3.5 w-3.5 flex-shrink-0" />
                  <span>{action.label}</span>
                </button>
                {action.divider && (
                  <div className="border-t border-gray-200 my-0.5" />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// Export common action creators for consistency
export const createPrintAction = (onClick: () => void): Action => ({
  id: 'print',
  label: 'Print',
  icon: Printer,
  onClick,
  variant: 'primary'
});

export const createDownloadAction = (onClick: () => void): Action => ({
  id: 'download',
  label: 'Download PDF',
  icon: FileDown,
  onClick
});

export const createEmailAction = (onClick: () => void): Action => ({
  id: 'email',
  label: 'Send to Email',
  icon: Mail,
  onClick
});

export const createReminderAction = (onClick: () => void): Action => ({
  id: 'reminder',
  label: 'Send Reminder',
  icon: Bell,
  onClick
});

export const createMarkPaidAction = (onClick: () => void): Action => ({
  id: 'mark-paid',
  label: 'Mark as Paid',
  icon: CheckCircle2,
  onClick,
  variant: 'success'
});

export const createViewTicketAction = (onClick: () => void): Action => ({
  id: 'view-ticket',
  label: 'View Ticket',
  icon: FileText,
  onClick,
  variant: 'primary'
});

export const createContactDriverAction = (onClick: () => void): Action => ({
  id: 'contact-driver',
  label: 'Contact Driver',
  icon: Phone,
  onClick
});

export const createViewEvidenceAction = (onClick: () => void): Action => ({
  id: 'view-evidence',
  label: 'View Evidence',
  icon: FileCheck,
  onClick
});

import { useState, useRef, useEffect } from 'react';
import type { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  disabled?: boolean;
  divider?: boolean;
  variant?: 'default' | 'primary' | 'success' | 'danger';
}

interface DropdownProps {
  trigger?: ReactNode;
  label?: string;
  items: DropdownItem[];
  align?: 'left' | 'right';
  className?: string;
  minWidth?: string;
}

export function Dropdown({ 
  trigger, 
  label = 'Select', 
  items, 
  align = 'right',
  className = '',
  minWidth = '200px'
}: DropdownProps) {
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

  const getItemClasses = (item: DropdownItem) => {
    const base = 'w-full text-left px-3 py-2 text-xs flex items-center gap-2.5 transition-colors';
    
    if (item.disabled) {
      return `${base} text-gray-400 cursor-not-allowed`;
    }

    switch (item.variant) {
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
    <div className={`relative ${className}`} ref={dropdownRef}>
      {trigger ? (
        <div onClick={() => setIsOpen(!isOpen)} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="h-8 px-3 flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 text-xs font-medium transition-colors"
          aria-label="Dropdown menu"
        >
          <span>{label}</span>
          <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      )}

      {isOpen && (
        <div 
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full mt-1 bg-white border border-gray-200 z-50`}
          style={{ 
            minWidth,
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.id}>
                <button
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick();
                      setIsOpen(false);
                    }
                  }}
                  disabled={item.disabled}
                  className={getItemClasses(item)}
                >
                  {Icon && <Icon className="h-3.5 w-3.5 flex-shrink-0" />}
                  <span>{item.label}</span>
                </button>
                {item.divider && (
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

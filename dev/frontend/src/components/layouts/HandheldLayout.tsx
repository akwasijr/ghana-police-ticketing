// Handheld Layout - Mobile-first layout for police officers

import type { ReactNode } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { 
  Home, 
  PlusCircle, 
  History, 
  User,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface HandheldLayoutProps {
  children?: ReactNode;
}

export function HandheldLayout({ children }: HandheldLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigation items for bottom bar - 5 items
  const navItems = [
    { icon: Home, label: 'Home', path: '/handheld' },
    { icon: History, label: 'History', path: '/handheld/history' },
    { icon: PlusCircle, label: 'New', path: '/handheld/new-ticket', isMain: true },
    { icon: User, label: 'Profile', path: '/handheld/profile' },
    { icon: Settings, label: 'Settings', path: '/handheld/settings' },
  ];

  const isActive = (path: string) => {
    if (path === '/handheld') {
      return location.pathname === '/handheld';
    }
    return location.pathname.startsWith(path);
  };

  // Hide bottom nav when on forms (like new-ticket page)
  const hideBottomNav = location.pathname.includes('/new-ticket');

  return (
    <div className="min-h-screen flex flex-col bg-handheld-surface">
      {/* Main content */}
      <main className={cn('flex-1 overflow-auto', !hideBottomNav && 'pb-24')}>
        {children || <Outlet />}
      </main>

      {/* Bottom navigation - hidden on form pages */}
      {!hideBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white px-4 pb-safe pt-2 border-t border-gray-100 z-40">
          <div className="flex items-center justify-between h-16 max-w-md mx-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.path);
              
              if (item.isMain) {
                return (
                  <button
                    key={item.path}
                    onClick={() => navigate(item.path)}
                    className="flex flex-col items-center justify-center w-16 py-1"
                    aria-label="New Ticket"
                  >
                    <div className="flex items-center justify-center w-12 h-12 bg-[#1A1F3A] rounded-full">
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </button>
                );
              }
              
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={cn(
                    'flex flex-col items-center justify-center w-16 py-1 rounded-xl transition-all duration-200',
                    active ? 'text-[#1A1F3A]' : 'text-gray-400 hover:text-gray-600'
                  )}
                  aria-label={item.label}
                  aria-current={active ? 'page' : undefined}
                >
                  <div className={cn(
                    "p-1.5 rounded-full mb-1 transition-colors",
                    active ? "bg-blue-50" : "bg-transparent"
                  )}>
                    <Icon className={cn('h-6 w-6', active && 'text-[#1A1F3A]')} aria-hidden="true" />
                  </div>
                  <span className={cn('text-[10px] font-medium', active ? 'text-[#1A1F3A]' : 'text-gray-400')}>
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      )}
    </div>
  );
}

// Handheld page wrapper with consistent padding
interface HandheldPageProps {
  children: ReactNode;
  title?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: ReactNode;
  noPadding?: boolean;
}

export function HandheldPage({
  children,
  title,
  showBack = false,
  onBack,
  rightAction,
  noPadding = false,
}: HandheldPageProps) {
  const navigate = useNavigate();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Page header (optional) */}
      {(title || showBack || rightAction) && (
        <div className="sticky top-0 z-10 bg-white px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {showBack && (
                <button
                  onClick={handleBack}
                  className="p-2 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 transition-colors"
                  aria-label="Go back"
                >
                  <svg
                    className="h-6 w-6 text-gray-700"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
              )}
              {title && (
                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
              )}
            </div>
            {rightAction && <div>{rightAction}</div>}
          </div>
        </div>
      )}

      {/* Page content */}
      <div className={cn(
        'flex-1',
        !noPadding && 'p-4'
      )}>
        {children}
      </div>
    </div>
  );
}

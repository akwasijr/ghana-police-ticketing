// Sidebar Component for Dashboard

import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Users,
  CreditCard,
  AlertTriangle,
  BarChart3,
  Settings,
  HelpCircle,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Logo } from '@/components/shared';
import { useUIStore, useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

interface NavItem {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  path: string;
  badge?: number;
}

interface NavGroup {
  title?: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    items: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
      { icon: Ticket, label: 'Tickets', path: '/dashboard/tickets' },
      { icon: CreditCard, label: 'Payments', path: '/dashboard/payments' },
      { icon: AlertTriangle, label: 'Objections', path: '/dashboard/objections' },
    ],
  },
  {
    title: 'Management',
    items: [
      { icon: Users, label: 'Officers', path: '/dashboard/officers' },
      { icon: BarChart3, label: 'Reports', path: '/dashboard/reports' },
    ],
  },
  {
    title: 'System',
    items: [
      { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
      { icon: HelpCircle, label: 'Help', path: '/dashboard/help' },
    ],
  },
];

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { sidebarOpen, sidebarCollapsed, setSidebarOpen, setSidebarCollapsed } = useUIStore();
  const { user, logout } = useAuthStore();

  const isActive = (path: string) => {
    if (path === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    // Close sidebar on mobile
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside
      className={cn(
        'fixed top-0 left-0 h-full bg-primary-blue text-white z-40',
        'transition-all duration-300 ease-in-out',
        // Desktop: show based on collapsed state
        'lg:translate-x-0',
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-64',
        // Mobile: show/hide based on open state
        'w-64',
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      )}
    >
      <div className="flex flex-col h-full">
        {/* Logo & Toggle */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className={cn(
            'flex items-center gap-3 overflow-hidden',
            sidebarCollapsed && 'lg:justify-center'
          )}>
            <Logo size="sm" variant="white" />
            {!sidebarCollapsed && (
              <div className="lg:block">
                <h1 className="font-bold text-sm leading-tight">Ghana Police</h1>
                <p className="text-xs text-white/70">Ticketing System</p>
              </div>
            )}
          </div>
          
          {/* Collapse toggle (desktop only) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-white/10 transition-colors"
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navGroups.map((group, groupIndex) => (
            <div key={groupIndex} className="mb-6">
              {/* Group title */}
              {group.title && !sidebarCollapsed && (
                <h3 className="px-4 mb-2 text-xs font-semibold uppercase tracking-wider text-white/50">
                  {group.title}
                </h3>
              )}
              
              {/* Nav items */}
              <ul className="space-y-1 px-2">
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.path);
                  
                  return (
                    <li key={item.path}>
                      <button
                        onClick={() => handleNavigation(item.path)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
                          'transition-colors duration-200',
                          active
                            ? 'bg-primary-yellow text-primary-blue'
                            : 'text-white/80 hover:bg-white/10 hover:text-white',
                          sidebarCollapsed && 'lg:justify-center lg:px-2'
                        )}
                        title={sidebarCollapsed ? item.label : undefined}
                      >
                        <Icon className="h-5 w-5 flex-shrink-0" />
                        {!sidebarCollapsed && (
                          <>
                            <span className="flex-1 text-left text-sm font-medium">
                              {item.label}
                            </span>
                            {item.badge && (
                              <span className={cn(
                                'px-2 py-0.5 text-xs font-semibold rounded-full',
                                active
                                  ? 'bg-primary-blue text-white'
                                  : 'bg-primary-yellow text-primary-blue'
                              )}>
                                {item.badge}
                              </span>
                            )}
                          </>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* User section */}
        <div className="border-t border-white/10 p-4">
          {user && (
            <div className={cn(
              'flex items-center gap-3 mb-3',
              sidebarCollapsed && 'lg:justify-center'
            )}>
              {/* Avatar */}
              <div className="w-10 h-10 rounded-full bg-primary-yellow flex items-center justify-center flex-shrink-0">
                <span className="text-primary-blue font-bold">
                  {user.fullName.charAt(0)}
                </span>
              </div>
              
              {!sidebarCollapsed && (
                <div className="overflow-hidden">
                  <p className="text-sm font-medium truncate">{user.fullName}</p>
                  <p className="text-xs text-white/70 truncate">{user.role}</p>
                </div>
              )}
            </div>
          )}
          
          {/* Logout button */}
          <button
            onClick={handleLogout}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg',
              'text-white/80 hover:bg-white/10 hover:text-white',
              'transition-colors duration-200',
              sidebarCollapsed && 'lg:justify-center lg:px-2'
            )}
            title={sidebarCollapsed ? 'Sign Out' : undefined}
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            {!sidebarCollapsed && (
              <span className="text-sm font-medium">Sign Out</span>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}

// Dashboard Layout - Desktop admin interface

import { useState, Fragment } from 'react';
import type { ReactNode } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Ticket,
  Users,
  CreditCard,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Scale,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children?: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  { icon: Ticket, label: 'Tickets', path: '/dashboard/tickets' },
  { icon: CreditCard, label: 'Payments', path: '/dashboard/payments' },
  { icon: AlertTriangle, label: 'Objections', path: '/dashboard/objections' },
  { icon: Scale, label: 'Offences', path: '/dashboard/offences' },
  { icon: Users, label: 'Personnel', path: '/dashboard/personnel' },
  { icon: BarChart3, label: 'Reports', path: '/dashboard/reports' },
  { icon: Settings, label: 'Settings', path: '/dashboard/settings' },
];

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/dashboard') return location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 px-4 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-gray-600" aria-hidden="true" />
        </button>
        <h1 className="font-semibold text-gray-900">GPS Admin</h1>
        <button className="p-2 rounded-lg hover:bg-gray-100 relative" aria-label="Notifications">
          <Bell className="h-6 w-6 text-gray-600" aria-hidden="true" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
        </button>
      </header>

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full w-64 bg-[#1A1F3A] z-40 transition-transform duration-300',
          'lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#F9A825] flex items-center justify-center">
                <span className="text-[#1A1F3A] font-bold text-sm">GP</span>
              </div>
              <div>
                <h1 className="text-white font-semibold text-sm">Ghana Police</h1>
                <p className="text-white/60 text-xs">Admin Portal</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-white/10"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-white/70" aria-hidden="true" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 py-6 px-4 overflow-y-auto">
            <div className="space-y-3">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setSidebarOpen(false);
                    }}
                    style={{
                      backgroundColor: active ? '#ffffff' : 'transparent',
                      color: active ? '#1A1F3A' : 'rgba(255, 255, 255, 0.7)',
                      marginTop: active ? '0.5rem' : '0',
                      marginBottom: active ? '0.5rem' : '0',
                      marginRight: active ? '0.75rem' : '0',
                      padding: active ? '0.75rem 1rem' : '0.75rem 1rem',
                    }}
                    className="w-full flex items-center gap-3 transition-all hover:bg-white/10"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium text-sm">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* User & Logout */}
          <div className="p-4 border-t border-white/10">
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-white/70 hover:bg-white/10 hover:text-white transition-all"
            >
              <LogOut className="h-5 w-5" />
              <span className="font-medium text-sm">Sign Out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="lg:ml-64 pt-16 lg:pt-0">
        {/* Desktop Header */}
        <header className="hidden lg:flex h-16 bg-white border-b border-gray-200 px-6 items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search tickets, officers..."
                className="pl-10 pr-4 py-2 w-80 rounded-lg border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 rounded-lg hover:bg-gray-100 relative" aria-label="Notifications">
              <Bell className="h-5 w-5 text-gray-600" aria-hidden="true" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
            </button>
            {user && (
              <button 
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100"
                aria-label="User menu"
                aria-haspopup="true"
              >
                <div className="w-8 h-8 rounded-full bg-[#1A1F3A] flex items-center justify-center">
                  <span className="text-white text-sm font-medium">{user.fullName.charAt(0)}</span>
                </div>
                <span className="text-sm font-medium text-gray-700">{user.fullName}</span>
                <ChevronDown className="h-4 w-4 text-gray-400" aria-hidden="true" />
              </button>
            )}
          </div>
        </header>

        {/* Page Content */}
        <main className="p-6">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
}

// Dashboard page wrapper with header
interface DashboardPageProps {
  children: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
  breadcrumbs?: Array<{ label: string; href?: string }>;
}

export function DashboardPage({
  children,
  title,
  description,
  actions,
  breadcrumbs,
}: DashboardPageProps) {
  return (
    <div className="space-y-6">
      {/* Breadcrumbs */}
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav className="flex items-center gap-2 text-sm text-gray-500">
          {breadcrumbs.map((crumb, index) => (
            <Fragment key={index}>
              {index > 0 && <span>/</span>}
              {crumb.href ? (
                <a
                  href={crumb.href}
                  className="hover:text-primary-blue transition-colors"
                >
                  {crumb.label}
                </a>
              ) : (
                <span className="text-gray-900 font-medium">{crumb.label}</span>
              )}
            </Fragment>
          ))}
        </nav>
      )}

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="mt-1 text-sm text-gray-500">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>

      {/* Page content */}
      <div>{children}</div>
    </div>
  );
}

// Stats card for dashboard overview
interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: ReactNode;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
}

export function StatCard({
  title,
  value,
  change,
  icon,
  color = 'blue',
}: StatCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-green-50 text-green-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    red: 'bg-red-50 text-red-600',
    gray: 'bg-gray-50 text-gray-600',
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
          {change && (
            <p
              className={cn(
                'mt-2 text-sm font-medium flex items-center gap-1',
                change.type === 'increase' ? 'text-green-600' : 'text-red-600'
              )}
            >
              <span>{change.type === 'increase' ? '↑' : '↓'}</span>
              <span>{Math.abs(change.value)}%</span>
              <span className="text-gray-500 font-normal">vs last month</span>
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('p-3 rounded-xl', colorClasses[color])}>
            {icon}
          </div>
        )}
      </div>
    </div>
  );
}

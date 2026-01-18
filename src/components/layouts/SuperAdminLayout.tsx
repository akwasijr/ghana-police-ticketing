// Super Admin Layout - National system administration interface

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Building2,
  Users,
  MapPin,
  Scale,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  Search,
  ChevronDown,
  Shield,
  FileText,
} from 'lucide-react';
import { useAuthStore } from '@/store';
import { cn } from '@/lib/utils';

interface SuperAdminLayoutProps {
  children?: ReactNode;
}

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/super-admin' },
  { icon: MapPin, label: 'Regions', path: '/super-admin/regions' },
  { icon: Building2, label: 'Stations', path: '/super-admin/stations' },
  { icon: Users, label: 'Officers', path: '/super-admin/officers' },
  { icon: Scale, label: 'Offences', path: '/super-admin/offences' },
  { icon: FileText, label: 'Audit Logs', path: '/super-admin/audit-logs' },
  { icon: Settings, label: 'Settings', path: '/super-admin/settings' },
];

export function SuperAdminLayout({ children }: SuperAdminLayoutProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/super-admin') return location.pathname === '/super-admin';
    return location.pathname.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile Header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white border-b border-gray-200 z-30 px-4 flex items-center justify-between">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 hover:bg-gray-100"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6 text-gray-600" aria-hidden="true" />
        </button>
        <h1 className="font-semibold text-gray-900">GPS Super Admin</h1>
        <button className="p-2 hover:bg-gray-100 relative" aria-label="Notifications">
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
              <div className="w-8 h-8 bg-[#F9A825] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[#1A1F3A]" />
              </div>
              <div>
                <h1 className="text-white font-semibold text-sm">Ghana Police</h1>
                <p className="text-white/60 text-xs">Super Admin</p>
              </div>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 hover:bg-white/10"
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
                placeholder="Search users, stations..."
                className="pl-10 pr-4 py-2 w-80 border border-gray-200 focus:outline-none focus:border-[#1A1F3A]"
              />
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-gray-100 relative" aria-label="Notifications">
              <Bell className="h-5 w-5 text-gray-600" aria-hidden="true" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" aria-hidden="true" />
            </button>
            {user && (
              <button 
                className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100"
                aria-label="User menu"
                aria-haspopup="true"
              >
                <div className="w-8 h-8 bg-[#1A1F3A] flex items-center justify-center">
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

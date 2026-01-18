import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { PageLoader } from '@/components/shared/LoadingSpinner';

// Layouts - Keep synchronous for shell stability
import { HandheldLayout, DashboardLayout, SuperAdminLayout } from '@/components/layouts';

// Auth pages - Keep synchronous for fast initial load
import { LoginPage, LauncherPage } from '@/pages/auth';

// ============================================================
// LAZY LOADED PAGES - Code splitting for better performance
// ============================================================

// Handheld Pages
const HomePage = lazy(() => import('@/pages/handheld/HomePage'));
const NewTicketPage = lazy(() => import('@/pages/handheld/NewTicketPage'));
const HistoryPage = lazy(() => import('@/pages/handheld/HistoryPage'));
const PrinterPage = lazy(() => import('@/pages/handheld/PrinterPage'));
const HandheldProfilePage = lazy(() => import('@/pages/handheld/ProfilePage'));
const HandheldSettingsPage = lazy(() => import('@/pages/handheld/SettingsPage'));

// Dashboard Pages
const DashboardHome = lazy(() => import('@/pages/dashboard/DashboardHome'));
const MapPage = lazy(() => import('@/pages/dashboard/MapPage'));
const TicketsPage = lazy(() => import('@/pages/dashboard/TicketsPage'));
const PaymentsPage = lazy(() => import('@/pages/dashboard/PaymentsPage'));
const ObjectionsPage = lazy(() => import('@/pages/dashboard/ObjectionsPage'));
const OffencesPage = lazy(() => import('@/pages/dashboard/OffencesPage'));
const PersonnelPage = lazy(() => import('@/pages/dashboard/PersonnelPage'));
const ReportsPage = lazy(() => import('@/pages/dashboard/ReportsPage'));
const DashboardSettingsPage = lazy(() => import('@/pages/dashboard/SettingsPage'));
const DashboardProfilePage = lazy(() => import('@/pages/dashboard/ProfilePage'));

// Super Admin Pages
const SuperAdminDashboard = lazy(() => import('@/pages/super-admin/SuperAdminDashboard'));
const RegionsPage = lazy(() => import('@/pages/super-admin/RegionsPage'));
const SuperAdminStationsPage = lazy(() => import('@/pages/super-admin/StationsPage'));
const SuperAdminOfficersPage = lazy(() => import('@/pages/super-admin/OfficersPage'));
const AuditLogsPage = lazy(() => import('@/pages/super-admin/AuditLogsPage'));
const SuperAdminSettingsPage = lazy(() => import('@/pages/super-admin/SettingsPage'));

// Suspense wrapper for lazy components
const LazyPage: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Suspense fallback={<PageLoader message="Loading page..." />}>
    {children}
  </Suspense>
);

// Protected Route wrapper
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

// Placeholder pages
const PlaceholderPage = ({ title }: { title: string }) => (
  <div className="flex items-center justify-center h-64">
    <div className="text-center">
      <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
      <p className="text-gray-500 mt-2">Coming soon...</p>
    </div>
  </div>
);

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<LoginPage />} />

        {/* Handheld routes */}
        <Route path="/handheld" element={<ProtectedRoute><HandheldLayout /></ProtectedRoute>}>
          <Route index element={<LazyPage><HomePage /></LazyPage>} />
          <Route path="new-ticket" element={<LazyPage><NewTicketPage /></LazyPage>} />
          <Route path="history" element={<LazyPage><HistoryPage /></LazyPage>} />
          <Route path="printer" element={<LazyPage><PrinterPage /></LazyPage>} />
          <Route path="profile" element={<LazyPage><HandheldProfilePage /></LazyPage>} />
          <Route path="settings" element={<LazyPage><HandheldSettingsPage /></LazyPage>} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
        </Route>

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<LazyPage><DashboardHome /></LazyPage>} />
          <Route path="map" element={<LazyPage><MapPage /></LazyPage>} />
          <Route path="tickets" element={<LazyPage><TicketsPage /></LazyPage>} />
          <Route path="payments" element={<LazyPage><PaymentsPage /></LazyPage>} />
          <Route path="objections" element={<LazyPage><ObjectionsPage /></LazyPage>} />
          <Route path="offences" element={<LazyPage><OffencesPage /></LazyPage>} />
          <Route path="personnel" element={<LazyPage><PersonnelPage /></LazyPage>} />
          <Route path="reports" element={<LazyPage><ReportsPage /></LazyPage>} />
          <Route path="settings" element={<LazyPage><DashboardSettingsPage /></LazyPage>} />
          <Route path="help" element={<PlaceholderPage title="Help & Support" />} />
          <Route path="profile" element={<LazyPage><DashboardProfilePage /></LazyPage>} />
        </Route>

        {/* Super Admin routes */}
        <Route path="/super-admin" element={<ProtectedRoute><SuperAdminLayout /></ProtectedRoute>}>
          <Route index element={<LazyPage><SuperAdminDashboard /></LazyPage>} />
          <Route path="regions" element={<LazyPage><RegionsPage /></LazyPage>} />
          <Route path="stations" element={<LazyPage><SuperAdminStationsPage /></LazyPage>} />
          <Route path="officers" element={<LazyPage><SuperAdminOfficersPage /></LazyPage>} />
          <Route path="offences" element={<LazyPage><OffencesPage /></LazyPage>} />
          <Route path="audit-logs" element={<LazyPage><AuditLogsPage /></LazyPage>} />
          <Route path="settings" element={<LazyPage><SuperAdminSettingsPage /></LazyPage>} />
        </Route>

        {/* Default redirect - Launcher */}
        <Route path="/" element={<LauncherPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

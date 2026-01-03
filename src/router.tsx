import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store';

// Layouts
import { HandheldLayout, DashboardLayout } from '@/components/layouts';

// Pages
import { LoginPage } from '@/pages/auth';
import { HomePage, NewTicketPage, HistoryPage, PrinterPage, ProfilePage, SettingsPage } from '@/pages/handheld';
import { DashboardHome } from '@/pages/dashboard';

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
          <Route index element={<HomePage />} />
          <Route path="new-ticket" element={<NewTicketPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="printer" element={<PrinterPage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
        </Route>

        {/* Dashboard routes */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          <Route path="tickets" element={<PlaceholderPage title="Tickets Management" />} />
          <Route path="payments" element={<PlaceholderPage title="Payments" />} />
          <Route path="objections" element={<PlaceholderPage title="Objections" />} />
          <Route path="officers" element={<PlaceholderPage title="Officers" />} />
          <Route path="reports" element={<PlaceholderPage title="Reports" />} />
          <Route path="settings" element={<PlaceholderPage title="Settings" />} />
          <Route path="help" element={<PlaceholderPage title="Help & Support" />} />
          <Route path="profile" element={<PlaceholderPage title="Profile" />} />
        </Route>

        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

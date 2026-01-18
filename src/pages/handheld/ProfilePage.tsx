import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ChevronLeft,
  Shield,
  MapPin,
  Phone,
  Mail,
  LogOut
} from 'lucide-react';
import { useAuthStore } from '@/store';

export function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const officer = user?.officer;

  return (
    <div className="min-h-full flex flex-col bg-handheld-surface">
      {/* Header with Profile */}
      <div className="px-4 pt-4 pb-6 bg-handheld-header">
        <div className="flex items-center gap-3 mb-6">
          <button 
            onClick={() => navigate('/handheld')}
            className="p-2 -ml-2"
            aria-label="Go back"
          >
            <ChevronLeft className="h-6 w-6 text-accent" />
          </button>
          <h1 className="text-xl font-bold text-white">My Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 flex items-center justify-center text-2xl font-bold bg-primary-yellow text-primary-blue">
            {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-white">{user?.fullName || 'Officer'}</h2>
            <p className="text-white-70">{officer?.rankDisplay || 'Traffic Officer'}</p>
            <div className="flex items-center gap-2 mt-2">
              <Shield className="h-4 w-4 text-accent" />
              <span className="text-sm font-mono text-accent">{officer?.badgeNumber || 'GPS-0000'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="px-4 -mt-3">
        <div className="bg-white p-4 flex">
          <div className="flex-1 text-center py-2">
            <p className="text-2xl font-bold text-primary-blue">47</p>
            <p className="text-xs text-gray-500">This Month</p>
          </div>
          <div className="w-px bg-gray-200"></div>
          <div className="flex-1 text-center py-2">
            <p className="text-2xl font-bold text-green-600">GH₵8.4k</p>
            <p className="text-xs text-gray-500">Collected</p>
          </div>
          <div className="w-px bg-gray-200"></div>
          <div className="flex-1 text-center py-2">
            <p className="text-2xl font-bold text-primary-yellow">78%</p>
            <p className="text-xs text-gray-500">Rate</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 pt-4 pb-4 space-y-4">
        
        {/* Officer Details */}
        <div className="bg-white">
          <div className="section-header">
            <p className="section-header-text">Officer Details</p>
          </div>
          <div className="px-4 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Station</span>
              </div>
              <span className="font-medium text-gray-900">{officer?.station?.name || 'Accra Central'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Region</span>
              </div>
              <span className="font-medium text-gray-900">{officer?.station?.regionName || 'Greater Accra'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Phone className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Phone</span>
              </div>
              <span className="font-medium text-gray-900">{user?.phone || '024 123 4567'}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-gray-400" />
                <span className="text-sm text-gray-600">Email</span>
              </div>
              <span className="font-medium text-gray-900 text-sm">{user?.email || 'officer@gps.gov.gh'}</span>
            </div>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={() => setShowLogoutConfirm(true)}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-50"
        >
          <LogOut className="h-5 w-5 text-red-600" />
          <span className="font-semibold text-red-600">Sign Out</span>
        </button>
      </div>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-overlay">
          <div className="bg-white w-full max-w-sm p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-error-light">
                <LogOut className="h-8 w-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Sign Out?</h3>
              <p className="text-gray-500">
                Any pending tickets will sync when you sign back in.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="flex-1 h-12 font-semibold text-gray-700 bg-handheld-surface"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 h-12 text-white font-semibold bg-red-600 hover:bg-red-700"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;

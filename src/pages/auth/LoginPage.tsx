import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Loader2, User, Shield } from 'lucide-react';
import { useAuthStore } from '@/store';
import logoWhite from '@/assets/logo-white.svg';

export function LoginPage() {
  const navigate = useNavigate();
  const { setSession } = useAuthStore();
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      if (badgeNumber === 'GPS001' && password === 'demo123') {
        loginAsOfficer();
      } else if (badgeNumber === 'ADMIN01' && password === 'admin123') {
        loginAsAdmin();
      } else {
        setError('Invalid badge number or password');
        setIsSubmitting(false);
      }
    }, 800);
  };

  const loginAsOfficer = () => {
    const demoUser = {
      id: '1',
      firstName: 'Kofi',
      lastName: 'Mensah',
      fullName: 'Sgt. Kofi Mensah',
      email: 'kofi.mensah@gps.gov.gh',
      phone: '0241234567',
      role: 'officer' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
      officer: {
        id: '1',
        firstName: 'Kofi',
        lastName: 'Mensah',
        fullName: 'Sgt. Kofi Mensah',
        email: 'kofi.mensah@gps.gov.gh',
        phone: '0241234567',
        badgeNumber: 'GPS001',
        rank: 'sergeant' as const,
        rankDisplay: 'Sergeant',
        stationId: '1',
        station: {
          id: '1',
          name: 'Accra Central',
          code: 'ACC-01',
          address: 'Ring Road Central, Accra',
          phone: '0302123456',
          regionId: '1',
          regionName: 'Greater Accra',
          isActive: true,
        },
        regionId: '1',
        role: 'officer' as const,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    };

    setSession({
      user: demoUser,
      tokens: { accessToken: 'demo-token', refreshToken: 'demo-refresh', expiresAt: new Date(Date.now() + 3600000).toISOString() },
      isAuthenticated: true,
      interfaceMode: 'handheld',
    });
    setIsSubmitting(false);
    navigate('/handheld');
  };

  const loginAsAdmin = () => {
    const adminUser = {
      id: '2',
      firstName: 'Ama',
      lastName: 'Serwaa',
      fullName: 'Supt. Ama Serwaa',
      email: 'admin@gps.gov.gh',
      phone: '0209876543',
      role: 'admin' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setSession({
      user: adminUser,
      tokens: { accessToken: 'admin-token', refreshToken: 'admin-refresh', expiresAt: new Date(Date.now() + 3600000).toISOString() },
      isAuthenticated: true,
      interfaceMode: 'dashboard',
    });
    setIsSubmitting(false);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: '#1A1F3A' }}>
      {/* Header */}
      <div className="pt-12 pb-8 px-6 text-center">
        <div className="flex justify-center mb-4">
          <img 
            src={logoWhite} 
            alt="Ghana Police Service" 
            className="w-24 h-24 object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white">Ghana Police Service</h1>
        <p className="mt-1" style={{ color: 'rgba(255,255,255,0.7)' }}>Traffic Ticketing System</p>
      </div>

      {/* Login Card */}
      <div className="flex-1 bg-white px-6 pt-8 pb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Badge Number
            </label>
            <input
              type="text"
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value.toUpperCase())}
              placeholder="e.g. GPS001"
              className="w-full h-14 px-4 bg-gray-100 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A1F3A]/20 text-lg"
              autoComplete="username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full h-14 px-4 pr-12 bg-gray-100 focus:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1A1F3A]/20 text-lg"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !badgeNumber || !password}
            className="w-full h-14 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            style={{ backgroundColor: '#1A1F3A', color: '#FFFFFF' }}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Signing in...
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>

        {/* Quick Demo Access */}
        <div className="mt-8 pt-6">
          <p className="text-sm text-gray-500 text-center mb-4">Quick Demo Access</p>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                setIsSubmitting(true);
                setTimeout(loginAsOfficer, 500);
              }}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-2 p-4 transition-colors bg-amber-50 hover:bg-amber-100"
            >
              <User className="w-8 h-8" style={{ color: '#1A1F3A' }} />
              <span className="font-medium" style={{ color: '#1A1F3A' }}>Officer</span>
              <span className="text-xs text-gray-500">Ticketing App</span>
            </button>
            <button
              onClick={() => {
                setIsSubmitting(true);
                setTimeout(loginAsAdmin, 500);
              }}
              disabled={isSubmitting}
              className="flex flex-col items-center gap-2 p-4 transition-colors bg-gray-100 hover:bg-gray-200"
            >
              <Shield className="w-8 h-8" style={{ color: '#1A1F3A' }} />
              <span className="font-medium" style={{ color: '#1A1F3A' }}>Admin</span>
              <span className="text-xs text-gray-500">Dashboard</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

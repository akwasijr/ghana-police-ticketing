import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Eye, EyeOff, Loader2, ArrowLeft, Smartphone, LayoutDashboard, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '@/store';
import logoWhite from '@/assets/logo-white.svg';

type AppType = 'pda' | 'admin' | 'super-admin';

// Demo accounts for each app type
const DEMO_ACCOUNTS = {
  pda: {
    credentials: { badge: 'GPS001', password: 'demo123' },
    user: {
      id: 'officer-1',
      firstName: 'Kofi',
      lastName: 'Mensah',
      fullName: 'Sgt. Kofi Mensah',
      email: 'kofi.mensah@gps.gov.gh',
      phone: '0241234567',
      role: 'officer' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
      officer: {
        id: 'officer-1',
        firstName: 'Kofi',
        lastName: 'Mensah',
        fullName: 'Sgt. Kofi Mensah',
        email: 'kofi.mensah@gps.gov.gh',
        phone: '0241234567',
        badgeNumber: 'GPS001',
        rank: 'sergeant' as const,
        rankDisplay: 'Sergeant',
        stationId: 'station-1',
        station: {
          id: 'station-1',
          name: 'Accra Central Station',
          code: 'ACC-01',
          address: 'Ring Road Central, Accra',
          phone: '0302123456',
          regionId: 'region-1',
          regionName: 'Greater Accra',
          divisionId: 'div-1',
          divisionName: 'Accra Metropolitan Division',
          districtId: 'dist-1',
          districtName: 'Accra Central District',
          isActive: true,
        },
        regionId: 'region-1',
        role: 'officer' as const,
        isActive: true,
        createdAt: new Date().toISOString(),
      },
    },
    interfaceMode: 'handheld' as const,
    redirectPath: '/handheld',
  },
  admin: {
    credentials: { badge: 'ADMIN01', password: 'admin123' },
    user: {
      id: 'admin-1',
      firstName: 'Ama',
      lastName: 'Serwaa',
      fullName: 'Supt. Ama Serwaa',
      email: 'admin@gps.gov.gh',
      phone: '0209876543',
      role: 'admin' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    interfaceMode: 'dashboard' as const,
    redirectPath: '/dashboard',
  },
  'super-admin': {
    credentials: { badge: 'SUPER01', password: 'super123' },
    user: {
      id: 'super-admin-1',
      firstName: 'Kweku',
      lastName: 'Asante',
      fullName: 'ACP Kweku Asante',
      email: 'superadmin@gps.gov.gh',
      phone: '0201234567',
      role: 'super_admin' as const,
      isActive: true,
      createdAt: new Date().toISOString(),
    },
    interfaceMode: 'dashboard' as const,
    redirectPath: '/super-admin',
  },
};

const APP_INFO: Record<AppType, { name: string; icon: React.ElementType; description: string }> = {
  pda: { name: 'PDA Mobile App', icon: Smartphone, description: 'Field officer ticketing' },
  admin: { name: 'Admin Dashboard', icon: LayoutDashboard, description: 'Station management' },
  'super-admin': { name: 'Super Admin', icon: ShieldCheck, description: 'System administration' },
};

export function LoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setSession, setJurisdiction } = useAuthStore();
  
  const appType = (searchParams.get('app') as AppType) || 'pda';
  const appInfo = APP_INFO[appType];
  const demoAccount = DEMO_ACCOUNTS[appType];
  const Icon = appInfo.icon;

  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Redirect to launcher if no app selected
  useEffect(() => {
    if (!searchParams.get('app')) {
      navigate('/');
    }
  }, [searchParams, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    setTimeout(() => {
      if (
        badgeNumber === demoAccount.credentials.badge &&
        password === demoAccount.credentials.password
      ) {
        performLogin();
      } else {
        setError('Invalid badge number or password');
        setIsSubmitting(false);
      }
    }, 800);
  };

  const performLogin = () => {
    setSession({
      user: demoAccount.user as any,
      tokens: {
        accessToken: `${appType}-token`,
        refreshToken: `${appType}-refresh`,
        expiresAt: new Date(Date.now() + 3600000).toISOString(),
      },
      isAuthenticated: true,
      interfaceMode: demoAccount.interfaceMode,
    });

    // Set jurisdiction based on app type
    if (appType === 'pda') {
      const officer = (demoAccount.user as any).officer;
      setJurisdiction({ level: 'station', id: officer.station.id, name: officer.station.name });
    } else if (appType === 'admin') {
      setJurisdiction({ level: 'region', id: 'region-1', name: 'Greater Accra' });
    } else {
      setJurisdiction({ level: 'national', id: 'national', name: 'National HQ' });
    }

    setIsSubmitting(false);
    navigate(demoAccount.redirectPath);
  };

  const handleQuickDemo = () => {
    setBadgeNumber(demoAccount.credentials.badge);
    setPassword(demoAccount.credentials.password);
    setIsSubmitting(true);
    setTimeout(performLogin, 500);
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#1A1F3A]">
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
        <p className="mt-1 text-white/70">Traffic Ticketing System</p>
      </div>

      {/* Login Card */}
      <div className="flex-1 bg-white px-6 pt-8 pb-6">
        {/* Back to launcher */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to app selection
        </Link>

        {/* App indicator */}
        <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-200 mb-6">
          <div className="w-10 h-10 bg-[#1A1F3A] flex items-center justify-center">
            <Icon className="w-5 h-5 text-[#F9A825]" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{appInfo.name}</h3>
            <p className="text-xs text-gray-500">{appInfo.description}</p>
          </div>
        </div>

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
              placeholder={`e.g. ${demoAccount.credentials.badge}`}
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
            className="w-full h-14 font-semibold text-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-[#1A1F3A] text-white"
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

        {/* Demo Access */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center mb-4">Quick Demo Access</p>
          
          <button
            onClick={handleQuickDemo}
            disabled={isSubmitting}
            className="w-full p-4 bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <p className="font-medium text-gray-900">Demo {appInfo.name}</p>
            <p className="text-xs text-gray-500 mt-1">
              Badge: {demoAccount.credentials.badge} • Password: {demoAccount.credentials.password}
            </p>
          </button>
        </div>
      </div>
    </div>
  );
}

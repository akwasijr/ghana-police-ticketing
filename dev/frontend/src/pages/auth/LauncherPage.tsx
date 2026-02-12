import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Smartphone, LayoutDashboard, ShieldCheck } from 'lucide-react';
import logoWhite from '@/assets/logo-white.svg';

type AppType = 'pda' | 'admin' | 'super-admin';

interface AppOption {
  id: AppType;
  name: string;
  icon: React.ElementType;
}

const APP_OPTIONS: AppOption[] = [
  { id: 'pda', name: 'PDA', icon: Smartphone },
  { id: 'admin', name: 'Admin', icon: LayoutDashboard },
  { id: 'super-admin', name: 'Super Admin', icon: ShieldCheck },
];

export function LauncherPage() {
  const navigate = useNavigate();
  const [selectedApp, setSelectedApp] = useState<AppType | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleAppSelect = (appId: AppType) => {
    setSelectedApp(appId);
    setIsTransitioning(true);
    setTimeout(() => {
      navigate(`/login?app=${appId}`);
    }, 200);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#1A1F3A] px-6">
      {/* Logo & Title */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <img 
            src={logoWhite} 
            alt="Ghana Police Service" 
            className="w-20 h-20 object-contain"
          />
        </div>
        <h1 className="text-xl font-bold text-white">Ghana Police Service</h1>
        <p className="text-white/60 text-sm">Traffic Ticketing System</p>
      </div>

      {/* App Selection - Horizontal */}
      <div className="flex items-center gap-6">
        {APP_OPTIONS.map((app) => {
          const Icon = app.icon;
          const isSelected = selectedApp === app.id;
          
          return (
            <button
              key={app.id}
              onClick={() => handleAppSelect(app.id)}
              disabled={isTransitioning}
              className={`flex flex-col items-center gap-3 p-6 border-2 transition-all ${
                isSelected 
                  ? 'border-[#F9A825] bg-white/10' 
                  : 'border-white/20 hover:border-white/40 bg-transparent'
              } ${isTransitioning ? 'opacity-50' : ''}`}
            >
              <div className="w-14 h-14 bg-white/10 flex items-center justify-center">
                <Icon className="w-7 h-7 text-[#F9A825]" />
              </div>
              <span className="text-white font-medium text-sm">{app.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

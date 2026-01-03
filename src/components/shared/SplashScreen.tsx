import { useEffect, useState } from 'react';
import logoColored from '@/assets/logo-colored.svg';

interface SplashScreenProps {
  onComplete: () => void;
  duration?: number;
}

export function SplashScreen({ onComplete, duration = 2500 }: SplashScreenProps) {
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, duration - 500);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
    };
  }, [duration, onComplete]);

  return (
    <div 
      className="fixed inset-0 flex flex-col items-center justify-center transition-opacity duration-500"
      style={{ 
        backgroundColor: '#1A1F3A',
        opacity: fadeOut ? 0 : 1
      }}
    >
      {/* Logo with pulse animation */}
      <div className="relative">
        <img 
          src={logoColored} 
          alt="Ghana Police Service" 
          className="w-32 h-32 object-contain animate-pulse"
        />
      </div>

      {/* Title */}
      <div className="mt-6 text-center">
        <h1 className="text-2xl font-bold text-white">Ghana Police Service</h1>
        <p className="mt-2 text-sm" style={{ color: 'rgba(255,255,255,0.7)' }}>
          Traffic Ticketing System
        </p>
      </div>

      {/* Loading indicator */}
      <div className="mt-10 flex items-center gap-2">
        <div 
          className="w-2 h-2 animate-bounce"
          style={{ backgroundColor: '#F9A825', animationDelay: '0ms' }}
        />
        <div 
          className="w-2 h-2 animate-bounce"
          style={{ backgroundColor: '#F9A825', animationDelay: '150ms' }}
        />
        <div 
          className="w-2 h-2 animate-bounce"
          style={{ backgroundColor: '#F9A825', animationDelay: '300ms' }}
        />
      </div>

      {/* Version */}
      <p 
        className="absolute bottom-8 text-xs"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        v1.0.0
      </p>
    </div>
  );
}

import { useState, useEffect } from 'react';
import { AppRouter } from './router';
import { SplashScreen } from './components/shared';
import './styles/globals.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Check if this is a fresh page load (not navigation)
    const hasShownSplash = sessionStorage.getItem('splashShown');
    if (hasShownSplash) {
      setShowSplash(false);
      setIsReady(true);
    }
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowSplash(false);
    setIsReady(true);
  };

  if (showSplash) {
    return <SplashScreen onComplete={handleSplashComplete} duration={2500} />;
  }

  if (!isReady) {
    return null;
  }

  return <AppRouter />;
}

export default App;

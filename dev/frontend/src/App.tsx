import { useState, useEffect } from 'react';
import { AppRouter } from './router';
import { SplashScreen } from './components/shared';
import { useTicketStore } from './store/ticket.store';
import { useOfficerStore } from './store/officer.store';
import { MOCK_TICKETS, MOCK_OFFICERS } from './lib/mock-data';
import './styles/globals.css';

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [isReady, setIsReady] = useState(false);
  const setTickets = useTicketStore((state) => state.setTickets);
  const setOfficers = useOfficerStore((state) => state.setOfficers);

  useEffect(() => {
    // Initialize mock data
    setTickets(MOCK_TICKETS);
    setOfficers(MOCK_OFFICERS);

    // Check if this is a fresh page load (not navigation)
    const hasShownSplash = sessionStorage.getItem('splashShown');
    if (hasShownSplash) {
      setShowSplash(false);
      setIsReady(true);
    }
  }, [setTickets, setOfficers]);

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

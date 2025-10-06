import { useState } from 'react';
import { M } from './components/motion';
import { AnimatePresence } from 'framer-motion';
import { StarField } from './components/StarField';
import { HomeScreen } from './components/HomeScreen';
import { TopNavigation } from './components/TopNavigation';
import { SimulatorPage } from './components/SimulatorPage';
import { SimulatorSection } from './components/SimulatorSection';
import { AsteroidsSection } from './components/AsteroidsSection';
import { OrbitsSection } from './components/OrbitsSection';
import { StatsSection } from './components/StatsSection';
import ErrorBoundary from './components/ErrorBoundary';
import { I18nProvider } from './components/i18n';

export default function App() {
  const [showHome, setShowHome] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  const handleEnter = () => {
    setShowHome(false);
    setActiveTab('simulator'); // Ensure simulator is shown when entering
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return <HomeScreen onEnter={handleEnter} onNavigate={handleTabChange} />;
      case 'simulator':
        return <SimulatorPage />;
      case 'stats':
        return <StatsSection />;
      case 'asteroids':
        return <AsteroidsSection />;
      case 'orbits':
        return <OrbitsSection />;
      default:
        return <HomeScreen onEnter={handleEnter} />;
    }
  };

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    if (tab === 'home') {
      setShowHome(true);
    } else {
      setShowHome(false);
    }
  };

  // lightweight event bridge for CTA anchors
  if (typeof window !== 'undefined') {
    (window as any).addEventListener?.('nav', (e: any) => {
      const t = e?.detail;
      if (typeof t === 'string') setActiveTab(t);
    });
  }

  return (
    <ErrorBoundary>
      <I18nProvider>
      <div className="size-full bg-[#0A0F2C] overflow-hidden">
        <StarField />
        
        <AnimatePresence mode="wait">
          {showHome ? (
            <M.div
              key="home"
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <HomeScreen onEnter={handleEnter} onNavigate={handleTabChange} />
            </M.div>
          ) : (
            <div className="relative z-10 h-full flex flex-col">
              <M.div
                key="app"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              >
                <TopNavigation activeTab={activeTab} onTabChange={handleTabChange} />
                
                <div className="flex-1 overflow-y-auto">
                  <AnimatePresence mode="wait">
                    <M.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                    >
                      {renderContent()}
                    </M.div>
                  </AnimatePresence>
                </div>
              </M.div>
            </div>
          )}
        </AnimatePresence>
      </div>
      </I18nProvider>
    </ErrorBoundary>
  );
}

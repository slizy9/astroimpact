import { Home, Satellite, BarChart3, TestTube, Orbit, Globe2 } from 'lucide-react';
import { useI18n } from './i18n';

interface TopNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export function TopNavigation({ activeTab, onTabChange }: TopNavigationProps) {
  const { lang, setLang } = useI18n();
  const tabs = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'simulator', label: '🎮 Simulator', icon: Satellite },
    { id: 'stats', label: 'Statistics', icon: BarChart3 },
    { id: 'asteroids', label: 'Asteroids', icon: TestTube },
    { id: 'orbits', label: 'Orbits', icon: Orbit },
  ];

  return (
    <nav className="h-[64px] sticky top-0 z-50 bg-[#0f122d]/70 backdrop-blur-md border-b border-white/10">
      <div className="mx-auto max-w-7xl h-full px-4 flex items-center justify-between gap-6">
        {/* Brand */}
        <div className="flex items-center gap-3 min-w-[160px]">
          <img src="/logo/meteor.png" alt="logo" className="w-7 h-7" />
          <span className="text-white/90 font-semibold tracking-wide">AstroImpact</span>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md transition-colors ${
              isActive
                ? 'text-[#00BFFF] bg-white/5'
                : 'text-white/70 hover:text-white/90 hover:bg-white/5'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span style={{ fontSize: '16px' }}>{tab.label}</span>
          </button>
        );
      })}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 min-w-[120px] justify-end">
          <button
            onClick={() => setLang(lang === 'en' ? 'es' : 'en')}
            className="flex items-center gap-2 px-3 py-1 text-white/80 hover:text-white bg-white/5 rounded-md border border-white/10"
            title="Toggle language"
          >
            <Globe2 className="w-4 h-4" />
            <span className="text-sm">{lang.toUpperCase()}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}

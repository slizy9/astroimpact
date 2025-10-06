import { createContext, useContext, useMemo, useState, ReactNode } from 'react';

type Dict = Record<string, string>;

const en: Dict = {
  enterSimulator: 'Enter Simulator',
  simulatorTitle: 'SIMULATOR',
  defendEarth: 'Defend the Earth',
  clickToFire: 'Click to fire defensive missiles',
  objective: 'Objective: Protect Earth for 1:30 minutes',
  startGame: 'Start Game',
  meteorData: 'Meteor Data',
  loadFromNeo: 'Recent NEOs (past 7 days)',
  footerTagline: 'Educational project • Scientific observation and analysis platform',
  homeSubtitle: 'Real-time asteroid scenarios and impact visualization',
  badgeOrbit: '3D Orbit Preview',
  badgePhysics: 'Physics-based insights',
  badgeUI: 'Polished UI',
  ctaOpenSimulator: 'Open Simulator',
  ctaViewAsteroids: 'View Asteroids',
  ctaViewStats: 'See Statistics',
};

const es: Dict = {
  enterSimulator: 'Entrar al simulador',
  simulatorTitle: 'SIMULADOR',
  defendEarth: 'Defiende la Tierra',
  clickToFire: 'Click para disparar misiles defensivos',
  objective: 'Objetivo: Proteger la Tierra por 1:30 minutos',
  startGame: 'Iniciar Juego',
  meteorData: 'Datos del Meteorito',
  loadFromNeo: 'NEOs recientes (últimos 7 días)',
  footerTagline: 'Proyecto educativo • Plataforma de observación y análisis científico',
  homeSubtitle: 'Escenarios de asteroides e impacto en tiempo real',
  badgeOrbit: 'Vista de órbita 3D',
  badgePhysics: 'Ideas basadas en física',
  badgeUI: 'Interfaz pulida',
  ctaOpenSimulator: 'Abrir simulador',
  ctaViewAsteroids: 'Ver asteroides',
  ctaViewStats: 'Ver estadísticas',
};

type Lang = 'en' | 'es';

const I18nCtx = createContext<{ t: (k: keyof typeof en) => string; lang: Lang; setLang: (l: Lang) => void }>({
  t: (k) => en[k],
  lang: 'en',
  setLang: () => {},
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>('en');
  const dict = useMemo(() => (lang === 'es' ? es : en), [lang]);
  const t = (k: keyof typeof en) => dict[k] || en[k];
  return (
    <I18nCtx.Provider value={{ t, lang, setLang }}>{children}</I18nCtx.Provider>
  );
}

export function useI18n() {
  return useContext(I18nCtx);
}



import { M } from './motion';
import { Button } from './ui/button';
import { useI18n } from './i18n';
import ThreeOrbitPreview from './ThreeOrbitPreview';

interface HomeScreenProps {
  onEnter: () => void;
  onNavigate?: (tab: string) => void;
}

export function HomeScreen({ onEnter, onNavigate }: HomeScreenProps) {
  const { t } = useI18n();
  return (
    <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
      {/* Decorative gradient glow */}
      <div className="pointer-events-none absolute -z-0 top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[800px] rounded-full blur-3xl opacity-30"
        style={{ background: 'radial-gradient(closest-side, rgba(0,191,255,0.5), rgba(10,15,44,0))' }}
      />

      {/* Logo */}
      <M.div
        initial={{ opacity: 0, scale: 0.92, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="mt-2 mb-4"
      >
        <div className="relative mx-auto">
          <img
            src="/logo/meteor.png"
            alt="AstroImpact Logo"
            className="mx-auto drop-shadow-[0_10px_30px_rgba(255,120,30,0.35)]"
            style={{ width: 'min(280px, 60vw)' }}
          />
        </div>
      </M.div>

      <M.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center"
      >
        <h1 className="mb-3 text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight bg-clip-text text-transparent" style={{ backgroundImage: 'linear-gradient(90deg, #ffffff, #00BFFF)' }}>
          Impactor 2025
        </h1>
        <p className="text-white/70 mb-10 text-lg md:text-xl">
          {t('homeSubtitle')}
        </p>

        {/* Feature badges */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-10 max-w-3xl">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm text-center">{t('badgeOrbit')}</div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm text-center">{t('badgePhysics')}</div>
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/80 text-sm text-center">{t('badgeUI')}</div>
        </div>

        <M.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mb-4"
        >
          <div className="relative bg-black/70 rounded-2xl border border-white/10 overflow-hidden shadow-2xl" style={{ width: 'min(700px, 86vw)' }}>
            <ThreeOrbitPreview height={240} />
          </div>
        </M.div>

        {/* CTA Row */}
        <div className="flex flex-wrap items-center justify-center gap-2 mb-3">
          <Button onClick={onEnter} className="bg-[#00BFFF] hover:bg-[#00A0DD] text-white px-3 py-2 rounded-full shadow-lg shadow-[#00BFFF]/20 text-xs sm:text-sm">
            {t('ctaOpenSimulator')}
          </Button>
          <a href="#/asteroids" onClick={(e) => { e.preventDefault(); onNavigate?.('asteroids'); }}>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-3 py-2 rounded-full text-xs sm:text-sm">
              {t('ctaViewAsteroids')}
            </Button>
          </a>
          <a href="#/stats" onClick={(e) => { e.preventDefault(); onNavigate?.('stats'); }}>
            <Button variant="outline" className="border-white/20 text-white hover:bg-white/10 px-3 py-2 rounded-full text-xs sm:text-sm">
              {t('ctaViewStats')}
            </Button>
          </a>
        </div>

      </M.div>

      <div className="mt-1 text-center text-white/60" style={{ fontSize: '12px' }}>
        <p>{t('footerTagline')}</p>
      </div>
    </div>
  );
}

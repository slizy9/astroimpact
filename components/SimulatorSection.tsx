import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { useI18n } from './i18n';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { M } from './motion';
import { AlertCircle } from 'lucide-react';
import ThreeOrbitPreview from './ThreeOrbitPreview';

interface SimulatorSectionProps {
  onAsteroidParamsChange?: (params: any) => void;
}

export function SimulatorSection({ onAsteroidParamsChange }: SimulatorSectionProps) {
  const { t } = useI18n();
  const [meteorName, setMeteorName] = useState('Impactor 2025');
  const [dimensions, setDimensions] = useState('2500');
  const [mass, setMass] = useState('15000');
  const [velocity, setVelocity] = useState('18'); // km/s
  const [angleDeg, setAngleDeg] = useState('45'); // degrees from horizontal
  const [isSimulating, setIsSimulating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);
  const [results, setResults] = useState<null | {
    energyMt: number;
    craterDiameterKm: number;
    severeRadiusKm: number;
    moderateRadiusKm: number;
    lightRadiusKm: number;
  }>(null);

  const [simulateKey, setSimulateKey] = useState(0);
  const [impactPoint, setImpactPoint] = useState({ x: 100, y: 100 }); // Interactive impact point
  const [showEducationalPopup, setShowEducationalPopup] = useState(false);
  const [selectedLayer, setSelectedLayer] = useState('all'); // 'crater', 'shockwave', 'fire', 'tsunami', 'all'

  // Recent NEOs for quick preload
  const [neoLoading, setNeoLoading] = useState(false);
  const [neoError, setNeoError] = useState<string | null>(null);
  const [neoList, setNeoList] = useState<Array<{
    id: string;
    name: string;
    approachDate: string;
    vKmS: number;
    dMinM: number;
    dMaxM: number;
  }>>([]);
  const [selectedNeoId, setSelectedNeoId] = useState<string>('impactor');

  useEffect(() => {
    const fetchNEO = async () => {
      setNeoLoading(true);
      setNeoError(null);
      try {
        const key = (process.env.NEXT_PUBLIC_NASA_API_KEY as string) || 'DEMO_KEY';
        const end = new Date();
        const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${fmt(start)}&end_date=${fmt(end)}&api_key=${key}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('NEO API error');
        const data = await res.json();
        const byDate: Record<string, any[]> = data.near_earth_objects || {};
        const list: any[] = [];
        Object.keys(byDate).forEach((day) => {
          (byDate[day] || []).forEach((neo: any) => {
            const ca = neo.close_approach_data?.[0];
            const v = parseFloat(ca?.relative_velocity?.kilometers_per_second || '0');
            const dMinKm = neo.estimated_diameter?.kilometers?.estimated_diameter_min || 0;
            const dMaxKm = neo.estimated_diameter?.kilometers?.estimated_diameter_max || 0;
            list.push({
              id: neo.neo_reference_id as string,
              name: neo.name as string,
              approachDate: day,
              vKmS: v,
              dMinM: dMinKm * 1000,
              dMaxM: dMaxKm * 1000,
            });
          });
        });
        // sort by date desc then name
        list.sort((a, b) => b.approachDate.localeCompare(a.approachDate) || a.name.localeCompare(b.name));
        setNeoList(list); // include all NEOs from past 7 days
      } catch (e: any) {
        setNeoError('NEOs unavailable');
      } finally {
        setNeoLoading(false);
      }
    };
    fetchNEO();
  }, []);

  const preloadFromNeo = (id: string) => {
    if (id === 'impactor') return; // keep custom
    const neo = neoList.find(n => n.id === id);
    if (!neo) return;
    const dMeanM = Math.max(1, Math.round((neo.dMinM + neo.dMaxM) / 2));
    const density = 3000; // kg/m3 assumed stony
    const volume = (Math.PI / 6) * Math.pow(dMeanM, 3);
    const massKg = volume * density;
    const massTons = Math.max(1, Math.round(massKg / 1000));
    setMeteorName(neo.name);
    setDimensions(String(dMeanM));
    setVelocity(String(Number(neo.vKmS.toFixed(2))));
    setMass(String(massTons));
    setShowResults(false);
  };

  // Create asteroid parameters object
  const asteroidParams = {
    size: parseFloat(dimensions) || 2500,
    velocity: parseFloat(velocity) || 18,
    angle: parseFloat(angleDeg) || 45,
    mass: parseFloat(mass) || 15000,
    name: meteorName || 'Impactor 2025'
  };

  // Notify parent component when asteroid parameters change
  useEffect(() => {
    if (onAsteroidParamsChange) {
      onAsteroidParamsChange(asteroidParams);
    }
  }, [asteroidParams, onAsteroidParamsChange]);

  // Calculate real-time analysis data
  const getAnalysisData = () => {
    const dM = Math.max(parseFloat(dimensions) || 0, 1); // meters
    const dKm = dM / 1000; // convert to km for calculations
    const mTons = Math.max(parseFloat(mass) || 0, 0.001);
    const vKms = Math.max(parseFloat(velocity) || 0, 0.1);
    const angle = Math.max(Math.min(parseFloat(angleDeg) || 45, 90), 1);

    // Density calculation
    const volume = (Math.PI / 6) * Math.pow(dM, 3); // volume in m³
    const density = mTons * 1000 / volume; // kg/m3

    // Composition estimation based on density
    let composition = { iron: 0, nickel: 0, silicate: 0 };
    if (density > 6000) {
      composition = { iron: 70, nickel: 20, silicate: 10 }; // Metallic
    } else if (density > 4000) {
      composition = { iron: 45, nickel: 15, silicate: 40 }; // Mixed
    } else {
      composition = { iron: 20, nickel: 5, silicate: 75 }; // Stony
    }

    // Destructive potential based on kinetic energy
    const energyJ = 0.5 * mTons * 1000 * Math.pow(vKms * 1000, 2);
    const energyMt = energyJ / 4.184e15;
    let destructiveLevel = 'Low';
    if (energyMt > 10) destructiveLevel = 'High';
    else if (energyMt > 1) destructiveLevel = 'Medium';

    // Orbital period estimation (simplified)
    const orbitalPeriod = Math.round(365 + (dKm * 10) + (vKms * 5));

    // Calculate impact radii
    const Df = 1.3 * Math.pow(energyMt, 0.294) * Math.pow(dKm, 0.78);
    const lightRadiusKm = Math.min(95, energyMt * 6 + dKm * 11);
    const moderateRadiusKm = Math.min(85, energyMt * 5 + dKm * 9);
    const heavyRadiusKm = Math.min(65, energyMt * 4 + dKm * 7);
    const destructionRadiusKm = Math.min(45, energyMt * 3 + dKm * 5);
    const craterRadiusKm = Math.min(25, energyMt * 2 + dKm * 3);

    // Population and infrastructure estimation
    const populationDensity = 50; // people per km² (average)
    const affectedPopulation = Math.round(Math.PI * Math.pow(lightRadiusKm, 2) * populationDensity);
    const economicDamage = Math.round(affectedPopulation * 10000); // $10k per person

    return {
      composition,
      destructiveLevel,
      energyMt,
      orbitalPeriod,
      nextApproach: new Date(Date.now() + orbitalPeriod * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      affectedPopulation,
      economicDamage,
      craterDiameterKm: Df / 1000,
      tsunamiRadiusKm: lightRadiusKm * 0.3, // Tsunami affects coastal areas
      fireRadiusKm: moderateRadiusKm * 0.8, // Fire spreads beyond crater
    };
  };

  const analysisData = getAnalysisData();

  const handleSimulate = () => {
    setIsSimulating(true);
    setTimeout(() => {
      // Physics-based estimation
      const dM = Math.max(parseFloat(dimensions) || 0, 1); // meters
      const d = dM; // already in meters
      const mTons = Math.max(parseFloat(mass) || 0, 0.001);
      const m = mTons * 1000; // kg (metric tons)
      const vKms = Math.max(parseFloat(velocity) || 0, 0.1);
      const v = vKms * 1000; // m/s
      const angle = Math.max(Math.min(parseFloat(angleDeg) || 45, 90), 1) * Math.PI / 180;

      // Density from mass and volume (assume spherical)
      const volume = (Math.PI / 6) * Math.pow(d, 3);
      const rhoImpactor = m / volume; // kg/m3
      const rhoTarget = 2700; // rock, kg/m3
      const g = 9.81; // m/s2

      // Kinetic energy
      const energyJ = 0.5 * m * v * v;
      const energyMt = energyJ / 4.184e15; // megatons of TNT

      // Crater diameter using gravity-regime pi-scaling (Holsapple)
      const vNormal = v * Math.sin(angle);
      const Pi2 = (g * d) / (vNormal * vNormal);
      const k1 = 1.03, mu = 0.217, nu = 1 / 3; // rock constants
      const Dt = k1 * d * Math.pow(Pi2, -mu) * Math.pow(rhoImpactor / rhoTarget, nu); // transient
      const Df = 1.3 * Dt; // final simple crater approximation

      // Blast radii (nuclear-like scaling as proxy for airburst coupling)
      const c = Math.cbrt(energyMt);
      const severe = 0.48 * c; // ~5-10 psi
      const moderate = 1.2 * c; // ~1-2 psi
      const light = 2.0 * c; // ~0.5-1 psi

      setResults({
        energyMt: energyMt,
        craterDiameterKm: Df / 1000,
        severeRadiusKm: severe,
        moderateRadiusKm: moderate,
        lightRadiusKm: light,
      });
      setSimulateKey((k) => k + 1); // trigger 3D reentry/burst animation
      setIsSimulating(false);
      setShowResults(true);
    }, 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4">
      {/* Left Column - Game View */}
      <div className="bg-[#1C1C1C] rounded-lg p-4 border border-white/10">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-white text-lg font-bold">
            🎮 {meteorName}
        </h2>
          <div className="px-2 py-1 bg-red-600/20 text-red-400 rounded text-xs font-medium">
            LIVE
          </div>
        </div>
        <div className="relative bg-black rounded-lg h-[400px] overflow-hidden border border-gray-600">
          <ThreeOrbitPreview
            height={400}
            simulateKey={simulateKey}
            physics={{
              velocityMs: Math.max(parseFloat(velocity) || 0, 0.1) * 1000,
              massKg: Math.max(parseFloat(mass) || 0, 0.001) * 1000,
              angleRad: Math.max(Math.min(parseFloat(angleDeg) || 45, 90), 1) * Math.PI / 180,
              energyMt: results ? results.energyMt : 0,
            }}
          />
        </div>
      </div>

      {/* Center Column - Game Controls */}
      <div className="bg-[#1C1C1C] rounded-lg p-4 border border-white/10">
        <h3 className="text-white mb-3 text-lg font-bold">
          ☄️ {t('meteorData')}
        </h3>
        
        <div className="space-y-4">
          {/* Recent NEO selector */}
          <div>
            <Label className="text-white mb-2">{t('loadFromNeo')}</Label>
            <select
              value={selectedNeoId}
              onChange={(e) => { const v = e.target.value; setSelectedNeoId(v); preloadFromNeo(v); }}
              className="w-full bg-[#0A0F2C] border-white/20 text-white rounded-md px-3 py-2"
            >
              <option value="impactor">Impactor 2025 (custom)</option>
              {neoLoading && <option>Loading NEOs…</option>}
              {neoError && <option disabled>{neoError}</option>}
              {!neoLoading && neoList.map((n) => (
                <option key={n.id} value={n.id}>
                  {n.name} • {(n.dMinM).toFixed(0)}–{(n.dMaxM).toFixed(0)}m • {n.vKmS.toFixed(1)}km/s • {n.approachDate}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-white mb-2">Name</Label>
            <Input
              value={meteorName}
              onChange={(e) => setMeteorName(e.target.value)}
              className="bg-[#0A0F2C] border-white/20 text-white"
            />
          </div>

          <div>
            <Label className="text-white mb-2">Dimensions (m)</Label>
            <Input
              type="number"
              value={dimensions}
              onChange={(e) => setDimensions(e.target.value)}
              className="bg-[#0A0F2C] border-white/20 text-white"
            />
          </div>

          <div>
            <Label className="text-white mb-2">Mass (tons)</Label>
            <Input
              type="number"
              value={mass}
              onChange={(e) => setMass(e.target.value)}
              className="bg-[#0A0F2C] border-white/20 text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-white mb-2">Velocity (km/s)</Label>
              <Input
                type="number"
                value={velocity}
                onChange={(e) => setVelocity(e.target.value)}
                className="bg-[#0A0F2C] border-white/20 text-white"
              />
            </div>
            <div>
              <Label className="text-white mb-2">Impact angle (°)</Label>
              <Input
                type="number"
                value={angleDeg}
                onChange={(e) => setAngleDeg(e.target.value)}
                className="bg-[#0A0F2C] border-white/20 text-white"
              />
            </div>
          </div>

          <div>
            <Label className="text-white mb-2">Trajectory</Label>
            <div className="bg-[#0A0F2C] border border-white/20 rounded-md p-3 text-white/60">
              Vector: [45°, -12°, 8.5 km/s]
            </div>
          </div>

          <div className="flex gap-3 mt-4">
          <Button
            onClick={handleSimulate}
            disabled={isSimulating}
              className="flex-1 bg-[#B22222] hover:bg-[#8B0000] text-white"
          >
            {isSimulating ? 'Simulating...' : 'Simulate Impact'}
          </Button>
            <Button
              onClick={() => setShowEducationalPopup(true)}
              className="px-4 bg-gray-600 hover:bg-gray-700 text-white"
            >
              🎓 Learn
            </Button>
          </div>

          {showResults && results && (
            <div className="bg-[#0A0F2C] border border-[#00BFFF]/30 rounded-lg p-4 mt-4">
              <M.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
                <h4 className="text-[#00BFFF] mb-3">Simulation Result</h4>

                <div className="grid grid-cols-2 gap-3 text-white/80 text-sm">
                  <div className="bg-black/40 rounded-md p-3 border border-white/10">
                    <div className="text-white/60">Impact Energy</div>
                    <div className="text-white text-lg font-bold">{results?.energyMt?.toFixed(2) || '0.00'} Mt</div>
                  </div>
                  <div className="bg-black/40 rounded-md p-3 border border-white/10">
                    <div className="text-white/60">Crater diameter</div>
                    <div className="text-white text-lg font-bold">{results?.craterDiameterKm?.toFixed(2) || '0.00'} km</div>
                  </div>
                  <div className="bg-black/40 rounded-md p-3 border border-white/10">
                    <div className="text-white/60">Severe damage radius</div>
                    <div className="text-white text-lg font-bold">{results?.severeRadiusKm?.toFixed(2) || '0.00'} km</div>
                  </div>
                  <div className="bg-black/40 rounded-md p-3 border border-white/10">
                    <div className="text-white/60">Moderate damage radius</div>
                    <div className="text-white text-lg font-bold">{results?.moderateRadiusKm?.toFixed(2) || '0.00'} km</div>
                  </div>
                  <div className="bg-black/40 rounded-md p-3 border border-white/10 col-span-2">
                    <div className="text-white/60">Light damage radius</div>
                    <div className="text-white text-lg font-bold">{results?.lightRadiusKm?.toFixed(2) || '0.00'} km</div>
                  </div>
                </div>

                <p className="text-white/60 mt-3 text-xs">
                  Formulas: Kinetic energy (0.5·m·v²); crater by pi-scaling (Holsapple, rock); blast radii using yield scaling W^{1/3}.
                </p>
              </M.div>
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Game Analysis */}
      <div className="bg-[#1C1C1C] rounded-lg p-4 border border-white/10">
        <h3 className="text-white mb-3 text-lg font-bold">
          📊 Game Analysis
        </h3>

        <div className="space-y-6">
          <div>
            <h4 className="text-white/80 mb-3" style={{ fontSize: '16px', fontWeight: 'bold' }}>
              Minerals
            </h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-white/70">
                <div className="w-3 h-3 rounded-full bg-[#C0C0C0]" />
                <span>Iron ({analysisData.composition.iron}%)</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <div className="w-3 h-3 rounded-full bg-[#B0B0B0]" />
                <span>Nickel ({analysisData.composition.nickel}%)</span>
              </div>
              <div className="flex items-center gap-2 text-white/70">
                <div className="w-3 h-3 rounded-full bg-[#8B7355]" />
                <span>Silicate ({analysisData.composition.silicate}%)</span>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-white/80 mb-3" style={{ fontSize: '16px', fontWeight: 'bold' }}>
              Destructive Potential
            </h4>
            <div className="relative w-full h-4 bg-[#0A0F2C] rounded-full overflow-hidden">
              <M.div
                initial={{ width: 0 }}
                animate={{ 
                  width: analysisData.destructiveLevel === 'High' ? '85%' : 
                         analysisData.destructiveLevel === 'Medium' ? '60%' : '25%'
                }}
                transition={{ duration: 0.8, delay: 0.2 }}
                style={{ height: '100%' }}
              >
                <div className="bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 w-full h-full" />
              </M.div>
            </div>
            <div className="flex justify-between text-white/60 mt-2" style={{ fontSize: '12px' }}>
              <span>Low</span>
              <span>High</span>
            </div>
          </div>

          <div className="bg-[#0A0F2C] rounded-lg p-4 border border-white/10">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-[#FFA500] flex-shrink-0 mt-1" />
              <div>
                <h4 className="text-white mb-2">Hazardous Orbit</h4>
                <p className="text-white/60" style={{ fontSize: '14px' }}>
                  Orbital period: {analysisData.orbitalPeriod} days
                </p>
                <p className="text-white/60" style={{ fontSize: '14px' }}>
                  Next approach: {analysisData.nextApproach}
                </p>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full border-[#00BFFF] text-[#00BFFF] hover:bg-[#00BFFF]/10"
            onClick={() => setShowMoreInfo(!showMoreInfo)}
          >
            {showMoreInfo ? 'Show Less' : 'Read More'}
          </Button>

          {showMoreInfo && (
            <M.section
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-4"
            >
              <div className="bg-[#0A0F2C] rounded-lg p-4 border border-white/10">
                <h4 className="text-white mb-3" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  Destruction Map
                </h4>
                <div className="relative w-full h-48 flex items-center justify-center">
                  <svg viewBox="0 0 200 200" className="w-full h-full">
                    {/* Cartesian grid background */}
                    <defs>
                      <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#333333" strokeWidth="0.5" opacity="0.3"/>
                      </pattern>
                    </defs>
                    <rect width="200" height="200" fill="url(#grid)" />
                    
                    {/* Ground terrain */}
                    <rect x="0" y="0" width="200" height="200" fill="#1a3d1a" opacity="0.7" />
                    
                    {/* Terrain features */}
                    <path d="M 0 80 Q 50 70, 100 75 Q 150 80, 200 75" fill="#2d5016" opacity="0.8" />
                    <path d="M 0 120 Q 50 130, 100 125 Q 150 120, 200 125" fill="#2d5016" opacity="0.8" />
                    
                    {/* Urban infrastructure */}
                    {/* Buildings */}
                    <rect x="30" y="60" width="12" height="20" fill="#555555" opacity="0.8" />
                    <rect x="45" y="55" width="10" height="25" fill="#555555" opacity="0.8" />
                    <rect x="58" y="58" width="8" height="22" fill="#555555" opacity="0.8" />
                    <rect x="70" y="50" width="15" height="30" fill="#555555" opacity="0.8" />
                    
                    <rect x="120" y="70" width="10" height="18" fill="#555555" opacity="0.8" />
                    <rect x="135" y="65" width="12" height="23" fill="#555555" opacity="0.8" />
                    <rect x="150" y="68" width="8" height="20" fill="#555555" opacity="0.8" />
                    
                    {/* Roads */}
                    <path d="M 0 100 L 200 100" stroke="#666666" strokeWidth="3" opacity="0.7" />
                    <path d="M 100 0 L 100 200" stroke="#666666" strokeWidth="3" opacity="0.7" />
                    <path d="M 0 50 L 200 50" stroke="#666666" strokeWidth="2" opacity="0.5" />
                    <path d="M 0 150 L 200 150" stroke="#666666" strokeWidth="2" opacity="0.5" />
                    <path d="M 50 0 L 50 200" stroke="#666666" strokeWidth="2" opacity="0.5" />
                    <path d="M 150 0 L 150 200" stroke="#666666" strokeWidth="2" opacity="0.5" />
                    
                    {/* Interactive Impact Zones - clickable and movable */}
                    {(() => {
                      const dKm = Math.max(parseFloat(dimensions) || 0, 0.01);
                      const mTons = Math.max(parseFloat(mass) || 0, 0.001);
                      const vKms = Math.max(parseFloat(velocity) || 0, 0.1);
                      
                      // Realistic impact scaling based on physics
                      const energyJ = 0.5 * mTons * 1000 * Math.pow(vKms * 1000, 2);
                      const energyMt = energyJ / 4.184e15;
                      
                      // Scale factors for visibility (much larger than before)
                      const craterRadius = Math.min(25, energyMt * 2 + dKm * 3);
                      const destructionRadius = Math.min(45, energyMt * 3 + dKm * 5);
                      const heavyRadius = Math.min(65, energyMt * 4 + dKm * 7);
                      const moderateRadius = Math.min(85, energyMt * 5 + dKm * 9);
                      const lightRadius = Math.min(95, energyMt * 6 + dKm * 11);
                      
                      return (
                        <>
                          {/* Tsunami zone (if coastal) */}
                          {selectedLayer === 'tsunami' || selectedLayer === 'all' ? (
                            <circle cx={impactPoint.x} cy={impactPoint.y} r={Math.min(lightRadius * 0.3, 30)} 
                                    fill="url(#tsunamiGradient)" opacity="0.4" />
                          ) : null}
                          
                          {/* Fire zone */}
                          {selectedLayer === 'fire' || selectedLayer === 'all' ? (
                            <circle cx={impactPoint.x} cy={impactPoint.y} r={Math.min(moderateRadius * 0.8, 70)} 
                                    fill="url(#fireGradient)" opacity="0.5" />
                          ) : null}
                          
                          {/* Shockwave zone */}
                          {selectedLayer === 'shockwave' || selectedLayer === 'all' ? (
                            <circle cx={impactPoint.x} cy={impactPoint.y} r={lightRadius} 
                                    fill="url(#shockwaveGradient)" opacity="0.3" />
                          ) : null}
                          
                          {/* Light damage zone */}
                          {selectedLayer === 'all' ? (
                            <circle cx={impactPoint.x} cy={impactPoint.y} r={lightRadius} 
                                    fill="url(#lightDamageGradient)" opacity="0.3" />
                          ) : null}
                          
                          {/* Moderate damage zone */}
                          <circle cx={impactPoint.x} cy={impactPoint.y} r={moderateRadius} 
                                  fill="url(#moderateDamageGradient)" opacity="0.4" />
                          
                          {/* Heavy damage zone */}
                          <circle cx={impactPoint.x} cy={impactPoint.y} r={heavyRadius} 
                                  fill="url(#heavyDamageGradient)" opacity="0.5" />
                          
                          {/* Destruction zone */}
                          <circle cx={impactPoint.x} cy={impactPoint.y} r={destructionRadius} 
                                  fill="url(#destructionGradient)" opacity="0.7" />
                          
                          {/* Crater zone (innermost) */}
                          {selectedLayer === 'crater' || selectedLayer === 'all' ? (
                            <circle cx={impactPoint.x} cy={impactPoint.y} r={craterRadius} 
                                    fill="url(#craterGradient)" opacity="0.9" />
                          ) : null}
                        </>
                      );
                    })()}
                    
                    {/* Gradient definitions */}
                    <defs>
                      <radialGradient id="craterGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#000000" />
                        <stop offset="50%" stopColor="#2d1b00" />
                        <stop offset="100%" stopColor="#4a2c00" />
                      </radialGradient>
                      <radialGradient id="destructionGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#4a2c00" />
                        <stop offset="70%" stopColor="#8b4513" />
                        <stop offset="100%" stopColor="#cd853f" />
                      </radialGradient>
                      <radialGradient id="heavyDamageGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#cd853f" />
                        <stop offset="70%" stopColor="#ff6347" />
                        <stop offset="100%" stopColor="#ff4500" />
                      </radialGradient>
                      <radialGradient id="moderateDamageGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ff4500" />
                        <stop offset="70%" stopColor="#ff8c00" />
                        <stop offset="100%" stopColor="#ffa500" />
                      </radialGradient>
                      <radialGradient id="lightDamageGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffa500" />
                        <stop offset="70%" stopColor="#ffff00" />
                        <stop offset="100%" stopColor="#adff2f" />
                      </radialGradient>
                      <radialGradient id="tsunamiGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#0066cc" />
                        <stop offset="70%" stopColor="#0099ff" />
                        <stop offset="100%" stopColor="#66ccff" />
                      </radialGradient>
                      <radialGradient id="fireGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ff0000" />
                        <stop offset="50%" stopColor="#ff6600" />
                        <stop offset="100%" stopColor="#ffaa00" />
                      </radialGradient>
                      <radialGradient id="shockwaveGradient" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#ffffff" />
                        <stop offset="50%" stopColor="#ffffcc" />
                        <stop offset="100%" stopColor="#ffffff" />
                      </radialGradient>
                    </defs>
                    
                    {/* Interactive Impact Epicenter - clickable */}
                    <circle cx={impactPoint.x} cy={impactPoint.y} r="3" fill="#ffffff" stroke="#ff0000" strokeWidth="2" 
                            style={{ cursor: 'pointer' }}
                            onClick={(e) => {
                              const rect = e.currentTarget.closest('svg')?.getBoundingClientRect();
                              if (rect) {
                                const x = ((e.clientX - rect.left) / rect.width) * 200;
                                const y = ((e.clientY - rect.top) / rect.height) * 200;
                                setImpactPoint({ x: Math.max(10, Math.min(190, x)), y: Math.max(10, Math.min(190, y)) });
                              }
                            }} />
                    
                    {/* Coordinate axes */}
                    <path d="M 0 100 L 200 100" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
                    <path d="M 100 0 L 100 200" stroke="#ffffff" strokeWidth="1" opacity="0.8" />
                    
                    {/* Axis labels */}
                    <text x="10" y="95" fill="white" fontSize="6" opacity="0.7">-5km</text>
                    <text x="50" y="95" fill="white" fontSize="6" opacity="0.7">-2.5km</text>
                    <text x="150" y="95" fill="white" fontSize="6" opacity="0.7">2.5km</text>
                    <text x="190" y="95" fill="white" fontSize="6" opacity="0.7">5km</text>
                    
                    <text x="95" y="15" fill="white" fontSize="6" opacity="0.7">5km</text>
                    <text x="95" y="50" fill="white" fontSize="6" opacity="0.7">2.5km</text>
                    <text x="95" y="150" fill="white" fontSize="6" opacity="0.7">-2.5km</text>
                    <text x="95" y="185" fill="white" fontSize="6" opacity="0.7">-5km</text>
                    
                    {/* Origin marker */}
                    <text x="105" y="105" fill="white" fontSize="6" fontWeight="bold">(0,0)</text>
                    
                    {/* Impact coordinates */}
                    <text x="105" y="115" fill="#ff0000" fontSize="6" fontWeight="bold">
                      Impact: ({dimensions}km, {velocity}km/s)
                    </text>
                    
                    {/* Population density visualization */}
                    <g opacity="0.6">
                      <circle cx="30" cy="30" r="8" fill="#00ff00" opacity="0.3" />
                      <circle cx="50" cy="40" r="6" fill="#00ff00" opacity="0.3" />
                      <circle cx="70" cy="35" r="10" fill="#00ff00" opacity="0.3" />
                      <circle cx="90" cy="45" r="7" fill="#00ff00" opacity="0.3" />
                      <circle cx="110" cy="30" r="9" fill="#00ff00" opacity="0.3" />
                      <circle cx="130" cy="40" r="8" fill="#00ff00" opacity="0.3" />
                      <circle cx="150" cy="35" r="6" fill="#00ff00" opacity="0.3" />
                      <circle cx="170" cy="45" r="9" fill="#00ff00" opacity="0.3" />
                    </g>
                    
                    {/* Dynamic radius display */}
                    <text x="100" y="25" textAnchor="middle" fill="white" fontSize="8" fontWeight="bold">
                      Impact Analysis - {meteorName}
                    </text>
                    
                    {/* Real-time radius calculations */}
                    <text x="100" y="175" textAnchor="middle" fill="white" fontSize="6">
                      Crater: {Math.round(Math.min(25, analysisData.energyMt * 2 + parseFloat(dimensions) * 3))}km |
                      Destruction: {Math.round(Math.min(45, analysisData.energyMt * 3 + parseFloat(dimensions) * 5))}km |
                      Population: {analysisData.affectedPopulation.toLocaleString()}
                    </text>
                    
                    {/* Legend with dynamic values */}
                    <g transform="translate(10, 10)">
                      <rect x="0" y="0" width="80" height="70" fill="rgba(0,0,0,0.8)" rx="3" />
                      <text x="5" y="12" fill="white" fontSize="6" fontWeight="bold">Damage Zones</text>
                      <circle cx="8" cy="20" r="2" fill="#000000" opacity="0.9" />
                      <text x="15" y="23" fill="white" fontSize="5">Crater</text>
                      <circle cx="8" cy="28" r="2" fill="#8b4513" opacity="0.7" />
                      <text x="15" y="31" fill="white" fontSize="5">Destruction</text>
                      <circle cx="8" cy="36" r="2" fill="#ff4500" opacity="0.5" />
                      <text x="15" y="39" fill="white" fontSize="5">Heavy</text>
                      <circle cx="8" cy="44" r="2" fill="#ffa500" opacity="0.4" />
                      <text x="15" y="47" fill="white" fontSize="5">Moderate</text>
                      <circle cx="8" cy="52" r="2" fill="#ffff00" opacity="0.3" />
                      <text x="15" y="55" fill="white" fontSize="5">Light</text>
                      <text x="5" y="65" fill="white" fontSize="4">
                        Energy: {analysisData.energyMt.toFixed(2)} Mt
                      </text>
                    </g>
                    
                    {/* Layer Controls */}
                    <g transform="translate(100, 10)">
                      <rect x="-40" y="0" width="80" height="25" fill="rgba(0,0,0,0.8)" rx="3" />
                      <text x="0" y="8" textAnchor="middle" fill="white" fontSize="5" fontWeight="bold">Layer Controls</text>
                      <text x="0" y="15" textAnchor="middle" fill="white" fontSize="4">
                        Click epicenter to move impact point
                      </text>
                      <text x="0" y="22" textAnchor="middle" fill="white" fontSize="4">
                        Current: ({Math.round((impactPoint.x - 100) * 0.05)}km, {Math.round((100 - impactPoint.y) * 0.05)}km)
                      </text>
                    </g>
                  </svg>
                </div>
                <div className="space-y-1 mt-2">
                  <div className="flex items-center justify-between text-white/70" style={{ fontSize: '12px' }}>
                    <span>Population affected:</span>
                    <span className="text-white font-semibold">{analysisData.affectedPopulation.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/70" style={{ fontSize: '12px' }}>
                    <span>Economic damage:</span>
                    <span className="text-white font-semibold">${analysisData.economicDamage.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between text-white/70" style={{ fontSize: '12px' }}>
                    <span>Crater diameter:</span>
                    <span className="text-white font-semibold">{analysisData.craterDiameterKm.toFixed(1)} km</span>
                  </div>
                  <div className="flex items-center justify-between text-white/70" style={{ fontSize: '12px' }}>
                    <span>Tsunami radius:</span>
                    <span className="text-white font-semibold">{analysisData.tsunamiRadiusKm.toFixed(1)} km</span>
                  </div>
                </div>
              </div>

              {/* Layer Controls */}
              <div className="bg-[#0A0F2C] rounded-lg p-4 border border-white/10">
                <h4 className="text-white mb-3" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  Impact Layer Controls
                </h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => setSelectedLayer('all')}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      selectedLayer === 'all' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    All Layers
                  </button>
                  <button
                    onClick={() => setSelectedLayer('crater')}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      selectedLayer === 'crater' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Crater Only
                  </button>
                  <button
                    onClick={() => setSelectedLayer('shockwave')}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      selectedLayer === 'shockwave' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Shockwave
                  </button>
                  <button
                    onClick={() => setSelectedLayer('fire')}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      selectedLayer === 'fire' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Fire Zone
                  </button>
                  <button
                    onClick={() => setSelectedLayer('tsunami')}
                    className={`px-3 py-2 rounded text-xs font-medium transition-colors ${
                      selectedLayer === 'tsunami' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                    }`}
                  >
                    Tsunami
                  </button>
                </div>
                <div className="text-xs text-gray-400">
                  💡 Click the red epicenter on the map to move the impact point
                </div>
              </div>

              {/* Mitigation Strategies */}
              <div className="bg-[#0A0F2C] rounded-lg p-4 border border-white/10">
                <h4 className="text-white mb-3" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  🛡️ Defiende la Tierra - Mitigation Strategies
                </h4>
                <div className="space-y-3">
                  <div className="bg-gray-800 rounded p-3">
                    <h5 className="text-white font-semibold text-sm mb-2">🚀 Kinetic Impactor</h5>
                    <div className="text-xs text-gray-300 mb-2">
                      Launch spacecraft to collide with asteroid and change its velocity
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Success probability:</span>
                      <span className="text-green-400 font-semibold">
                        {Math.max(20, 90 - parseFloat(dimensions) * 2)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Time required:</span>
                      <span className="text-white">2-5 years</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded p-3">
                    <h5 className="text-white font-semibold text-sm mb-2">☢️ Nuclear Deflection</h5>
                    <div className="text-xs text-gray-300 mb-2">
                      Detonate nuclear device near asteroid to alter trajectory
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Success probability:</span>
                      <span className="text-yellow-400 font-semibold">
                        {Math.max(30, 85 - parseFloat(dimensions) * 1.5)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Time required:</span>
                      <span className="text-white">1-3 years</span>
                    </div>
                  </div>
                  
                  <div className="bg-gray-800 rounded p-3">
                    <h5 className="text-white font-semibold text-sm mb-2">🛰️ Gravitational Tractor</h5>
                    <div className="text-xs text-gray-300 mb-2">
                      Place spacecraft near asteroid to slowly pull it off course
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Success probability:</span>
                      <span className="text-blue-400 font-semibold">
                        {Math.max(40, 95 - parseFloat(dimensions) * 3)}%
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400">Time required:</span>
                      <span className="text-white">5-10 years</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-[#0A0F2C] rounded-lg p-4 border border-white/10">
                <h4 className="text-white mb-3" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  Orbital Period Analysis
                </h4>
                <svg viewBox="0 0 300 100" className="w-full">
                  <path
                    d="M 10 80 Q 80 20, 150 50 T 290 80"
                    fill="none"
                    stroke="#00BFFF"
                    strokeWidth="2"
                  />
                  <circle cx="10" cy="80" r="3" fill="#00BFFF" />
                  <circle cx="150" cy="50" r="3" fill="#FFA500" />
                  <circle cx="290" cy="80" r="3" fill="#00BFFF" />
                </svg>
                <p className="text-white/60 mt-2" style={{ fontSize: '12px' }}>
                  Temporal projection: {analysisData.orbitalPeriod}-day orbital cycle
                </p>
              </div>

              {/* Data Export */}
              <div className="bg-[#0A0F2C] rounded-lg p-4 border border-white/10">
                <h4 className="text-white mb-3" style={{ fontSize: '16px', fontWeight: 'bold' }}>
                  📊 Export Data
                </h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      const data = {
                        meteorName,
                        dimensions: parseFloat(dimensions),
                        mass: parseFloat(mass),
                        velocity: parseFloat(velocity),
                        angleDeg: parseFloat(angleDeg),
                        impactPoint,
                        analysis: analysisData,
                        timestamp: new Date().toISOString()
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `impact-analysis-${meteorName.replace(/\s+/g, '-')}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    📄 Export JSON Data
                  </button>
                  <button
                    onClick={() => {
                      const csvData = [
                        ['Parameter', 'Value', 'Unit'],
                        ['Meteor Name', meteorName, ''],
                        ['Dimensions', dimensions, 'km'],
                        ['Mass', mass, 'tons'],
                        ['Velocity', velocity, 'km/s'],
                        ['Angle', angleDeg, 'degrees'],
                        ['Impact Energy', analysisData.energyMt.toFixed(2), 'Mt'],
                        ['Crater Diameter', analysisData.craterDiameterKm.toFixed(1), 'km'],
                        ['Affected Population', analysisData.affectedPopulation.toLocaleString(), 'people'],
                        ['Economic Damage', `$${analysisData.economicDamage.toLocaleString()}`, 'USD'],
                        ['Tsunami Radius', analysisData.tsunamiRadiusKm.toFixed(1), 'km'],
                        ['Fire Radius', analysisData.fireRadiusKm.toFixed(1), 'km'],
                        ['Impact Coordinates', `(${Math.round((impactPoint.x - 100) * 0.05)}, ${Math.round((100 - impactPoint.y) * 0.05)})`, 'km']
                      ].map(row => row.join(',')).join('\n');
                      
                      const blob = new Blob([csvData], { type: 'text/csv' });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `impact-analysis-${meteorName.replace(/\s+/g, '-')}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="w-full px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded text-sm font-medium transition-colors"
                  >
                    📈 Export CSV Report
                  </button>
                </div>
              </div>
            </M.section>
          )}
        </div>
      </div>

      {/* Educational Popup */}
      {showEducationalPopup && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-[#0A0F2C] rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-white/20">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white text-xl font-bold">🎓 Educational Information</h3>
              <button
                onClick={() => setShowEducationalPopup(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4 text-sm text-gray-300">
              <div>
                <h4 className="text-white font-semibold mb-2">Impact Physics</h4>
                <p>
                  When an asteroid enters Earth's atmosphere, it experiences tremendous heat and pressure. 
                  The kinetic energy (½mv²) determines the destructive power. Larger, faster asteroids create 
                  more massive craters and affect wider areas.
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Damage Zones</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Crater Zone:</strong> Complete destruction, melted rock</li>
                  <li><strong>Destruction Zone:</strong> Buildings flattened, fires</li>
                  <li><strong>Heavy Damage:</strong> Structural damage, injuries</li>
                  <li><strong>Moderate Damage:</strong> Broken windows, minor injuries</li>
                  <li><strong>Light Damage:</strong> Shaking, noise</li>
                </ul>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Mitigation Strategies</h4>
                <p>
                  Early detection is key! The sooner we identify a threat, the more options we have. 
                  Kinetic impactors work best for smaller asteroids, while nuclear deflection might be 
                  needed for larger threats. Gravitational tractors require decades of advance warning.
                </p>
              </div>
              
              <div>
                <h4 className="text-white font-semibold mb-2">Real-World Examples</h4>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Tunguska Event (1908):</strong> ~50m asteroid, 12 Mt energy</li>
                  <li><strong>Chelyabinsk (2013):</strong> ~20m asteroid, 0.5 Mt energy</li>
                  <li><strong>Chicxulub (65M years ago):</strong> ~10km asteroid, 100,000 Mt energy</li>
                </ul>
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setShowEducationalPopup(false)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

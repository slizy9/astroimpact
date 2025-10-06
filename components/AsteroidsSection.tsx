"use client";
import { useEffect, useMemo, useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { M } from './motion';
import ThreeAsteroidViewer from './ThreeAsteroidViewer';
import GltfAsteroidViewer from './GltfAsteroidViewer';
import { CircleDot } from 'lucide-react';

export function AsteroidsSection() {
  const [neos, setNeos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedAsteroid, setSelectedAsteroid] = useState<any | null>(null);

  useEffect(() => {
  const getKey = () => {
    return 'EhULULcHli49Tkkbqtt4vzFG6aOUhTDudC0Pe8zY';
  };

  const fetchData = async () => {
    const apiKey = getKey();
    try {
      const response = await fetch(`https://api.nasa.gov/planetary/apod?api_key=${apiKey}`);
      const data = await response.json();
      console.log(data);
    } catch (error) {
      console.error('Error fetching data from NASA API:', error);
    }
  };

  fetchData();
}, []);

    };
    const fetchNEOs = async () => {
      setLoading(true);
      setError(null);
      try {
        const key = getKey();
        const end = new Date();
        const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        const feedUrl = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${fmt(start)}&end_date=${fmt(end)}&api_key=${key}`;
        let res = await fetch(feedUrl);
        let list: any[] = [];
        if (res.ok) {
          const data = await res.json();
          const byDate: Record<string, any[]> = data.near_earth_objects || {};
          Object.keys(byDate).forEach((day) => {
            (byDate[day] || []).forEach((neo: any) => {
              const ca = neo.close_approach_data?.[0];
              const kmps = parseFloat(ca?.relative_velocity?.kilometers_per_second || '0');
              const missKm = parseFloat(ca?.miss_distance?.kilometers || '0');
              const dMinKm = neo.estimated_diameter?.kilometers?.estimated_diameter_min || 0;
              const dMaxKm = neo.estimated_diameter?.kilometers?.estimated_diameter_max || 0;
              list.push({
                id: neo.neo_reference_id,
                name: neo.name,
                approachDate: day,
                size: `${(dMinKm * 1000).toFixed(0)}–${(dMaxKm * 1000).toFixed(0)} m`,
                velocity: `${kmps.toFixed(2)} km/s`,
                distance: `${Math.round(missKm).toLocaleString()} km`,
                hazardous: !!neo.is_potentially_hazardous_asteroid,
                danger: neo.is_potentially_hazardous_asteroid ? 'High' : 'Low',
                composition: 'Unknown',
                orbit: '—',
                link: neo.nasa_jpl_url || `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${neo.neo_reference_id}`,
              });
            });
          });
        } else {
          // Fallback to browse endpoint
          const browseUrl = `https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${key}&page=0&size=100`;
          res = await fetch(browseUrl);
          if (!res.ok) throw new Error(`NEO browse ${res.status}`);
          const data = await res.json();
          (data.near_earth_objects || []).forEach((neo: any) => {
            const ca = neo.close_approach_data?.[0];
            const kmps = parseFloat(ca?.relative_velocity?.kilometers_per_second || '0');
            const missKm = parseFloat(ca?.miss_distance?.kilometers || '0');
            const dMinKm = neo.estimated_diameter?.kilometers?.estimated_diameter_min || 0;
            const dMaxKm = neo.estimated_diameter?.kilometers?.estimated_diameter_max || 0;
            list.push({
              id: neo.neo_reference_id,
              name: neo.name,
              approachDate: ca?.close_approach_date || '—',
              size: `${(dMinKm * 1000).toFixed(0)}–${(dMaxKm * 1000).toFixed(0)} m`,
              velocity: `${isNaN(kmps) ? '—' : kmps.toFixed(2)} km/s`,
              distance: isNaN(missKm) ? '—' : `${Math.round(missKm).toLocaleString()} km`,
              hazardous: !!neo.is_potentially_hazardous_asteroid,
              danger: neo.is_potentially_hazardous_asteroid ? 'High' : 'Low',
              composition: 'Unknown',
              orbit: '—',
              link: neo.nasa_jpl_url || `https://ssd.jpl.nasa.gov/tools/sbdb_lookup.html#/?sstr=${neo.neo_reference_id}`,
            });
          });
        }
        // sort by hazard then by closest
        list.sort((a, b) => (b.hazardous ? 1 : 0) - (a.hazardous ? 1 : 0));
        setNeos(list);
        setSelectedAsteroid(list[0] || null);
      } catch (e: any) {
        setError('NEOs unavailable (API limit or network). Try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchNEOs();
  }, []);

  const getDangerColor = (danger: string) => {
    switch (danger) {
      case 'High': return 'text-red-500';
      case 'Medium': return 'text-yellow-500';
      case 'Low': return 'text-green-500';
      default: return 'text-white';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
      {/* Asteroid list */}
      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-white mb-4" style={{ fontSize: '32px', fontWeight: 'bold' }}>
          Near-Earth Objects (NASA NEO)
        </h2>
        {error && (
          <Card className="bg-red-900/30 border-red-500/30 p-3 text-red-200 text-sm">{error}</Card>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {(loading ? Array.from({ length: 6 }).map((_, index) => ({ id: index, skeleton: true })) : neos).map((asteroid: any, index: number) => (
            <M.div
              key={asteroid.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Card
                className={`p-4 cursor-pointer transition-all border ${
                  selectedAsteroid && selectedAsteroid.id === asteroid.id
                    ? 'bg-[#00BFFF]/20 border-[#00BFFF]'
                    : 'bg-[#1C1C1C] border-white/10 hover:border-[#00BFFF]/50'
                }`}
                onClick={() => !asteroid.skeleton && setSelectedAsteroid(asteroid)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-white mb-2" style={{ fontSize: '20px', fontWeight: 'bold' }}>
                      {asteroid.skeleton ? 'Loading…' : asteroid.name}
                    </h3>
                    <p className="text-white/60" style={{ fontSize: '14px' }}>
                      Size: {asteroid.skeleton ? '—' : asteroid.size}
                    </p>
                    <p className="text-white/60" style={{ fontSize: '14px' }}>
                      Velocity: {asteroid.skeleton ? '—' : asteroid.velocity}
                    </p>
                  </div>
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gray-600 to-gray-800 flex items-center justify-center">
                    <CircleDot className="w-8 h-8 text-gray-300" />
                  </div>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <span className={`${getDangerColor(asteroid.skeleton ? 'Low' : asteroid.danger)}`} style={{ fontSize: '12px', fontWeight: 'bold' }}>
                    Danger: {asteroid.skeleton ? '—' : asteroid.danger}
                  </span>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-[#00BFFF] text-[#00BFFF] hover:bg-[#00BFFF]/10 h-8"
                  >
                    View details
                  </Button>
                </div>
              </Card>
            </M.div>
          ))}
        </div>
      </div>

      {/* Details panel */}
      <div className="bg-[#1C1C1C] rounded-lg p-6 border border-white/10">
  <M.div
          key={selectedAsteroid?.id || 'none'}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <h3 className="text-white mb-6" style={{ fontSize: '24px', fontWeight: 'bold' }}>
            {selectedAsteroid?.name || '—'}
          </h3>

          <div className="relative rounded-xl border border-white/10 bg-black/70 mb-6 overflow-hidden">
            <GltfAsteroidViewer meshIndex={0} height={260} />
          </div>

          <div className="space-y-4">
            <div className="bg-[#0A0F2C] rounded-lg p-4">
              <h4 className="text-white/80 mb-2" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Size
              </h4>
              <p className="text-white">{selectedAsteroid?.size || '—'}</p>
            </div>

            <div className="bg-[#0A0F2C] rounded-lg p-4">
              <h4 className="text-white/80 mb-2" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Velocity
              </h4>
              <p className="text-white">{selectedAsteroid?.velocity || '—'}</p>
            </div>

            <div className="bg-[#0A0F2C] rounded-lg p-4">
              <h4 className="text-white/80 mb-2" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Distance from Sun
              </h4>
              <p className="text-white">{selectedAsteroid?.distance || '—'}</p>
            </div>

            <div className="bg-[#0A0F2C] rounded-lg p-4">
              <h4 className="text-white/80 mb-2" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Composition
              </h4>
              <p className="text-white">{selectedAsteroid?.composition || '—'}</p>
            </div>

            <div className="bg-[#0A0F2C] rounded-lg p-4">
              <h4 className="text-white/80 mb-2" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Orbital Period
              </h4>
              <p className="text-white">{selectedAsteroid?.orbit || '—'}</p>
            </div>

            <div className="bg-[#0A0F2C] rounded-lg p-4">
              <h4 className="text-white/80 mb-2" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Danger Level
              </h4>
              <p className={getDangerColor(selectedAsteroid?.danger || 'Low')}>
                {selectedAsteroid?.danger || '—'}
              </p>
            </div>

            <div className="bg-[#0A0F2C] rounded-lg p-4">
              <h4 className="text-white/80 mb-2" style={{ fontSize: '14px', fontWeight: 'bold' }}>
                Orbital Trajectory
              </h4>
              <svg viewBox="0 0 200 100" className="w-full h-24">
                <ellipse
                  cx="100"
                  cy="50"
                  rx="80"
                  ry="40"
                  fill="none"
                  stroke="#00BFFF"
                  strokeWidth="2"
                />
                <circle cx="100" cy="50" r="6" fill="#FFA500" />
                <circle cx="120" cy="50" r="3" fill="white" />
              </svg>
            </div>

            <a 
              href={selectedAsteroid?.link || '#'}
              target="_blank"
              rel="noopener noreferrer"
              className="block"
            >
              <Button className="w-full bg-[#00BFFF] hover:bg-[#00A0DD] text-white">
                View in NASA Eyes on Asteroids
              </Button>
            </a>
          </div>
  </M.div>
      </div>
    </div>
  );
}

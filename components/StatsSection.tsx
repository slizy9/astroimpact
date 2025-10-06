"use client";

import { useEffect, useMemo, useState } from 'react';
import { Card } from './ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Target, Globe, AlertTriangle } from 'lucide-react';

type NeoSummary = {
  total: number;
  hazardous: number;
  fastestKmS: { value: number; name: string } | null;
  closestKm: { value: number; name: string } | null;
  byDay: Array<{ day: string; count: number }>;
  sizeBuckets: Array<{ label: string; count: number }>;
};

function formatNumber(n: number) {
  return new Intl.NumberFormat().format(Math.round(n));
}

export function StatsSection() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<NeoSummary | null>(null);

  useEffect(() => {
    const fetchNEO = async () => {
      setLoading(true);
      setError(null);
      try {
        const key = (process.env.NEXT_PUBLIC_NASA_API_KEY as string) || 'EhULULcHli49Tkkbqtt4vzFG6aOUhTDudC0Pe8zY' || 'DEMO_KEY';
        const end = new Date();
        const start = new Date(end.getTime() - 6 * 24 * 60 * 60 * 1000);
        const fmt = (d: Date) => d.toISOString().slice(0, 10);
        const url = `https://api.nasa.gov/neo/rest/v1/feed?start_date=${fmt(start)}&end_date=${fmt(end)}&api_key=${key}`;
        let res = await fetch(url);
        let data: any;
        if (res.ok) {
          data = await res.json();
        } else {
          const alt = await fetch(`https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=${key}&page=0&size=150`);
          if (!alt.ok) throw new Error(`NEO browse ${alt.status}`);
          const raw = await alt.json();
          const neo_arr = raw.near_earth_objects || [];
          const neoByDate: Record<string, any[]> = {};
          neo_arr.forEach((neo: any) => {
            const d = neo.close_approach_data?.[0]?.close_approach_date || 'unknown';
            if (!neoByDate[d]) neoByDate[d] = [];
            neoByDate[d].push(neo);
          });
          data = { near_earth_objects: neoByDate };
        }

        const neoByDate: Record<string, any[]> = data.near_earth_objects || {};
        const days = Object.keys(neoByDate).sort();

        let total = 0;
        let hazardous = 0;
        let fastest: { value: number; name: string } | null = null;
        let closest: { value: number; name: string } | null = null;

        const byDay: Array<{ day: string; count: number }> = [];

        // Size buckets (estimated diameter min_kilometers)
        let b1 = 0, b2 = 0, b3 = 0, b4 = 0; // <50m, 50-150m, 150-300m, >300m

        for (const day of days) {
          const list = neoByDate[day] || [];
          byDay.push({ day, count: list.length });
          total += list.length;
          for (const neo of list) {
            if (neo.is_potentially_hazardous_asteroid) hazardous++;
            const ca = (neo.close_approach_data && neo.close_approach_data[0]) || null;
            if (ca) {
              const v = parseFloat(ca.relative_velocity?.kilometers_per_second || '0');
              const m = parseFloat(ca.miss_distance?.kilometers || '9999999');
              if (!isNaN(v)) {
                if (!fastest || v > fastest.value) fastest = { value: v, name: neo.name };
              }
              if (!isNaN(m)) {
                if (!closest || m < closest.value) closest = { value: m, name: neo.name };
              }
            }
            const diaMinKm = neo.estimated_diameter?.kilometers?.estimated_diameter_min || 0;
            const diaM = diaMinKm * 1000;
            if (diaM < 50) b1++; else if (diaM < 150) b2++; else if (diaM < 300) b3++; else b4++;
          }
        }

        const sizeBuckets = [
          { label: '<50m', count: b1 },
          { label: '50-150m', count: b2 },
          { label: '150-300m', count: b3 },
          { label: '>300m', count: b4 },
        ];

        setSummary({ total, hazardous, fastestKmS: fastest, closestKm: closest, byDay, sizeBuckets });
      } catch (e: any) {
        console.error(e);
        setError('Failed to load NASA NEO data');
      } finally {
        setLoading(false);
      }
    };
    fetchNEO();
  }, []);

  const pieData = useMemo(() => {
    if (!summary) return [] as Array<{ name: string; value: number; color: string }>;
    const safe = Math.max(0, summary.total - summary.hazardous);
    return [
      { name: 'Hazardous', value: summary.hazardous, color: '#EF4444' },
      { name: 'Non-Hazardous', value: safe, color: '#10B981' },
    ];
  }, [summary]);

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-white mb-6" style={{ fontSize: '32px', fontWeight: 'bold' }}>
        NASA NEO (last 7 days)
      </h2>

      {error && (
        <Card className="bg-red-900/30 border-red-500/30 p-4 text-red-200 text-sm">
          {error}
        </Card>
      )}

      {/* Summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#1C1C1C] border-white/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 mb-1" style={{ fontSize: '14px' }}>
                Total NEOs (7 days)
              </p>
              <p className="text-white" style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {summary ? formatNumber(summary.total) : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-[#00BFFF]/20 flex items-center justify-center">
              <Target className="w-6 h-6 text-[#00BFFF]" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#1C1C1C] border-white/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 mb-1" style={{ fontSize: '14px' }}>
                Potentially Hazardous
              </p>
              <p className="text-white" style={{ fontSize: '32px', fontWeight: 'bold' }}>
                {summary ? formatNumber(summary.hazardous) : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#1C1C1C] border-white/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 mb-1" style={{ fontSize: '14px' }}>
                Closest Miss (km)
              </p>
              <p className="text-white" style={{ fontSize: '26px', fontWeight: 'bold' }}>
                {summary?.closestKm ? `${formatNumber(summary.closestKm.value)} km` : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Globe className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </Card>

        <Card className="bg-[#1C1C1C] border-white/10 p-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-white/60 mb-1" style={{ fontSize: '14px' }}>
                Fastest (km/s)
              </p>
              <p className="text-white" style={{ fontSize: '26px', fontWeight: 'bold' }}>
                {summary?.fastestKmS ? `${summary.fastestKmS.value.toFixed(1)} km/s` : '—'}
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* NEOs by day */}
        <Card className="bg-[#1C1C1C] border-white/10 p-6">
          <h3 className="text-white mb-4" style={{ fontSize: '20px', fontWeight: 'bold' }}>
            NEOs per Day
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={summary?.byDay || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="day" stroke="#ffffff80" />
              <YAxis stroke="#ffffff80" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1C1C1C',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Line
                type="monotone"
                dataKey="count"
                stroke="#00BFFF"
                strokeWidth={3}
                dot={{ fill: '#00BFFF', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Hazardous split */}
        <Card className="bg-[#1C1C1C] border-white/10 p-6">
          <h3 className="text-white mb-4" style={{ fontSize: '20px', fontWeight: 'bold' }}>
            Hazardous vs Non-Hazardous
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(Number(percent) * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1C1C1C',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </Card>

        {/* Size buckets */}
        <Card className="bg-[#1C1C1C] border-white/10 p-6 lg:col-span-2">
          <h3 className="text-white mb-4" style={{ fontSize: '20px', fontWeight: 'bold' }}>
            Size (estimated min diameter)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={summary?.sizeBuckets || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff20" />
              <XAxis dataKey="label" stroke="#ffffff80" />
              <YAxis stroke="#ffffff80" />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1C1C1C',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                }}
              />
              <Bar dataKey="count" fill="#00BFFF" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Small note */}
      <div className="text-white/50 text-xs">Source: NASA NEO WS (feed). Use NEXT_PUBLIC_NASA_API_KEY to avoid DEMO_KEY limits.</div>
    </div>
  );
}
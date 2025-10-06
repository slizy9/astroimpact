import { Button } from './ui/button';
import { M } from './motion';
import { Loader2, Orbit } from 'lucide-react';

export function OrbitsSection() {
  return (
    <div className="flex items-center justify-center min-h-[600px] p-6">
      <div className="max-w-2xl w-full">
  <M.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{}}
        >
          <div className="bg-[#1C1C1C] rounded-lg p-12 border border-white/10 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-24 h-24 rounded-full bg-[#00BFFF]/20 flex items-center justify-center">
              <Orbit className="w-12 h-12 text-[#00BFFF]" />
            </div>
          </div>
          
          <h2 className="text-white mb-4" style={{ fontSize: '32px', fontWeight: 'bold' }}>
            3D Orbital Visualizer
          </h2>
          
          <p className="text-white/60 mb-8" style={{ fontSize: '18px' }}>
            Orbital visualization in development
          </p>

          <div className="bg-black rounded-lg h-[300px] mb-6 flex items-center justify-center">
            <svg viewBox="0 0 400 300" className="w-full h-full opacity-30">
              {/* Sol central */}
              <circle cx="200" cy="150" r="20" fill="#FFA500" />
              
              {/* Órbitas planetarias */}
              <ellipse
                cx="200"
                cy="150"
                rx="60"
                ry="50"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
              <ellipse
                cx="200"
                cy="150"
                rx="100"
                ry="80"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
              <ellipse
                cx="200"
                cy="150"
                rx="140"
                ry="110"
                fill="none"
                stroke="white"
                strokeWidth="1"
              />
              
              {/* Asteroides */}
              <circle cx="260" cy="150" r="4" fill="#00BFFF" />
              <circle cx="300" cy="170" r="3" fill="#00BFFF" />
              <circle cx="340" cy="150" r="3" fill="#00BFFF" />
            </svg>
          </div>

          <p className="text-white/70 mb-6" style={{ fontSize: '14px' }}>
            Technical style similar to NASA Eyes on Asteroids
          </p>

          <div className="flex gap-4 justify-center">
            <Button
              disabled
              className="bg-[#00BFFF]/50 text-white cursor-not-allowed"
            >
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Load orbit
            </Button>
            <Button
              variant="outline"
              disabled
              className="border-white/20 text-white/50 cursor-not-allowed"
            >
              Select asteroid
            </Button>
          </div>

          <div className="mt-8 p-4 bg-[#0A0F2C] rounded-lg border border-[#00BFFF]/30">
            <p className="text-white/80" style={{ fontSize: '14px' }}>
              💡 Coming soon: Interactive 3D visualization of asteroid orbits with real-time data from NASA JPL
            </p>
          </div>
          </div>
  </M.div>
      </div>
    </div>
  );
}

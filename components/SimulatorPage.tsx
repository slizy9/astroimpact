import { M } from './motion';
import { useI18n } from './i18n';
import { SimulatorSection } from './SimulatorSection';
import EnhancedMiniGame from './EnhancedMiniGame';
import { useState } from 'react';

export function SimulatorPage() {
  const { t } = useI18n();
  const [asteroidParams, setAsteroidParams] = useState<any>(null);

  const handleAsteroidParamsChange = (params: any) => {
    setAsteroidParams(params);
  };

  const handleGameEnd = (score: number, asteroidsDestroyed: number) => {
    console.log('Game ended:', { score, asteroidsDestroyed });
  };

  return (
    <div className="min-h-screen bg-[#0A0F2C] p-6">
      {/* Main Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="bg-[#1C1C1C] border border-white/10 rounded-lg p-6">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#00BFFF] to-[#8A2BE2]">
              🚀 {t('simulatorTitle')}
            </h1>
          </div>
          
          {/* Live Simulation */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="px-3 py-1 bg-green-600/20 text-green-400 rounded-full text-sm font-medium">
              LIVE SIMULATION
            </div>
            <div className="text-white/60 text-sm">
              Real-time Asteroid Impact Analysis
            </div>
          </div>
          
          {/* Interactive Game */}
          <div className="flex items-center justify-center gap-4">
            <div className="px-3 py-1 bg-blue-600/20 text-blue-400 rounded-full text-sm font-medium">
              INTERACTIVE GAME
            </div>
            <div className="text-white/60 text-sm">
              Play and Learn with Asteroid Impact Simulation
            </div>
          </div>
        </div>
      </div>

      {/* Game Container */}
      <div className="max-w-7xl mx-auto">
        <M.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-[#1C1C1C] border border-white/10 rounded-lg overflow-hidden shadow-2xl"
        >
          <SimulatorSection onAsteroidParamsChange={handleAsteroidParamsChange} />
        </M.div>
      </div>


          {/* How to Play Instructions */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-[#1C1C1C] border border-blue-500/20 rounded-lg p-6">
          <h3 className="text-blue-400 font-semibold mb-4 text-lg">🎮 How to Play</h3>
          
          {/* Game Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-white/80 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">📊</div>
              <div>
                <div className="font-semibold text-white">Real-time Physics</div>
                <div>Live calculations based on actual asteroid data</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-xs">🌍</div>
              <div>
                <div className="font-semibold text-white">3D Visualization</div>
                <div>Interactive Earth and meteor orbit simulation</div>
              </div>
            </div>
          </div>
          
          {/* How to Play */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-white/80">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">1</div>
              <div>
                <div className="font-semibold text-white">Adjust Parameters</div>
                <div>Set asteroid size, mass, velocity, and angle</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-green-600 rounded-full flex items-center justify-center text-white font-bold text-sm">2</div>
              <div>
                <div className="font-semibold text-white">Click Impact Point</div>
                <div>Click the red epicenter on the map to move impact location</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">3</div>
              <div>
                <div className="font-semibold text-white">Play & Learn</div>
                <div>Watch animations and explore mitigation strategies</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mini Game Canvas */}
      <div className="max-w-7xl mx-auto mt-6">
        <div className="bg-[#1C1C1C] border border-blue-500/20 rounded-lg p-6">
          <h3 className="text-blue-400 font-semibold mb-4 text-lg">🎮 Mini Game Canvas</h3>
          
          <div className="bg-black rounded-lg h-[400px] overflow-hidden border border-gray-600 relative">
            <EnhancedMiniGame
              asteroidParams={asteroidParams}
              onGameEnd={handleGameEnd}
            />
            
            {/* Game UI Overlay */}
            <div className="absolute top-4 left-4 bg-black/80 rounded-lg p-3 text-white text-sm">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                <span className="font-semibold">{t('defendEarth')}</span>
              </div>
              <div className="text-xs text-gray-300">
                {t('clickToFire')}
              </div>
            </div>
            
            {/* Score Display */}
            <div className="absolute top-4 right-4 bg-black/80 rounded-lg p-3 text-white text-sm">
              <div className="text-center">
                <div className="text-xs text-gray-300">Score</div>
                <div className="text-lg font-bold text-green-400" id="gameScore">0</div>
              </div>
            </div>
            
            {/* Game Instructions */}
            <div className="absolute bottom-4 left-4 bg-black/80 rounded-lg p-3 text-white text-xs">
              <div className="mb-1">🎯 {t('objective')}</div>
              <div className="mb-1">🔫 {t('clickToFire')}</div>
              <div>⚡ Do not let any asteroid touch the blue circle!</div>
            </div>
            
            {/* Start Game Button */}
            <div className="absolute bottom-4 right-4">
              <button 
                id="startGameBtn"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                🚀 {t('startGame')}
              </button>
            </div>
          </div>
          
          {/* Game Stats */}
          <div className="grid grid-cols-3 gap-4 mt-4 text-center text-sm text-white/80">
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400">Asteroides Destruidos</div>
              <div className="text-lg font-bold text-green-400" id="asteroidsDestroyed">0</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400">Misiles Disparados</div>
              <div className="text-lg font-bold text-blue-400" id="missilesFired">0</div>
            </div>
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400">Precisión</div>
              <div className="text-lg font-bold text-yellow-400" id="accuracy">0%</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

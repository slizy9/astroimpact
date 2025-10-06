import { Home, Search, Globe, FolderOpen, TestTube, Navigation } from 'lucide-react';
import { Button } from './ui/button';

export function AppSidebar() {
  return (
    <div className="w-[120px] bg-[#4A4A4A] h-full flex flex-col items-center py-6 gap-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-16 h-16 rounded-full bg-[#00BFFF] flex items-center justify-center">
          <Globe className="w-8 h-8 text-white" />
        </div>
        <h3 className="text-white text-center" style={{ fontSize: '14px', fontWeight: 'bold' }}>
          Astro Impact
        </h3>
      </div>

      <Button className="bg-[#00BFFF] hover:bg-[#00A0DD] text-white rounded-lg shadow-md w-[90px] h-10">
        Leer Start!
      </Button>

      <div className="flex flex-col gap-6 mt-4">
        <button className="flex flex-col items-center gap-2 text-white/80 hover:text-[#00BFFF] transition-colors group">
          <Search className="w-6 h-6" />
          <span style={{ fontSize: '11px' }}>Buscar</span>
        </button>

        <button className="flex flex-col items-center gap-2 text-white/80 hover:text-[#00BFFF] transition-colors group">
          <Globe className="w-6 h-6" />
          <span style={{ fontSize: '11px' }}>Mapa</span>
        </button>

        <button className="flex flex-col items-center gap-2 text-white/80 hover:text-[#00BFFF] transition-colors group">
          <FolderOpen className="w-6 h-6" />
          <span style={{ fontSize: '11px' }}>Archivos</span>
        </button>

        <button className="flex flex-col items-center gap-2 text-white/80 hover:text-[#00BFFF] transition-colors group">
          <TestTube className="w-6 h-6" />
          <span style={{ fontSize: '11px' }}>Datos</span>
        </button>

        <button className="flex flex-col items-center gap-2 text-white/80 hover:text-[#00BFFF] transition-colors group">
          <Navigation className="w-6 h-6" />
          <span style={{ fontSize: '11px' }}>Trayectorias</span>
        </button>
      </div>
    </div>
  );
}

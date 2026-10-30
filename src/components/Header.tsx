import React from 'react';
import { Video, Layers, Upload, Database, HardDrive, Sparkles } from 'lucide-react';

interface HeaderProps {
  activeTab: 'vault' | 'remix';
  setActiveTab: (tab: 'vault' | 'remix') => void;
  onOpenUpload: () => void;
  vaultCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onOpenUpload,
  vaultCount,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between gap-8 px-6 py-3.5 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Brand title wordmark */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Video className="w-4 h-4 text-white" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-base font-bold tracking-tight text-white whitespace-nowrap">
            ClipVault
          </span>
          <span className="text-xs text-slate-500 font-medium">Gaming Pipeline</span>
        </div>
      </div>

      {/* Zone 2: Navigation Links & View Switchers */}
      <nav className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={() => setActiveTab('vault')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'vault'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Asset Vault</span>
          <span className="text-[11px] font-mono px-1.5 py-0.2 text-slate-400 bg-slate-900/80 rounded">
            {vaultCount}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('remix')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
            activeTab === 'remix'
              ? 'bg-slate-800 text-cyan-400 shadow-sm border border-slate-700/60'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Remix Recipe Builder</span>
        </button>

        <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-slate-800 text-xs text-slate-500 font-mono">
          <div className="flex items-center gap-1.5">
            <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
            <span>Supabase Storage</span>
          </div>
          <span>·</span>
          <div className="flex items-center gap-1.5">
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            <span>PostgreSQL</span>
          </div>
        </div>
      </nav>

      {/* Zone 3: Primary Action */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg shadow-sm shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] whitespace-nowrap"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Upload Clips</span>
        </button>
      </div>
    </header>
  );
};

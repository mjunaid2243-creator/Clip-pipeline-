import React from 'react';
import { Loader2, Video, Eye, Cpu, Film } from 'lucide-react';

interface LocalParsingBannerProps {
  totalFiles: number;
  completedFiles: number;
  currentFileName: string;
}

export const LocalParsingBanner: React.FC<LocalParsingBannerProps> = ({
  totalFiles,
  completedFiles,
  currentFileName,
}) => {
  const percent = totalFiles > 0 ? Math.round((completedFiles / totalFiles) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-2xl p-6 shadow-2xl">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white">Local File API Parsing</h4>
            <p className="text-xs text-slate-400">Client-side metadata extraction & thumbnail capture</p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-xs font-mono mb-1.5">
            <span className="text-slate-300">
              Parsing {completedFiles + 1} of {totalFiles} clips
            </span>
            <span className="text-cyan-400 font-semibold">{percent}%</span>
          </div>
          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-200"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>

        {/* Detailed current action */}
        <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800 space-y-1.5 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300 truncate">
            <Film className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">{currentFileName || 'Processing video file...'}</span>
          </div>
          <div className="flex items-center gap-2 text-slate-400 text-[11px]">
            <Eye className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Detecting aspect ratio (16:9 vs 9:16) & painting canvas thumbnail...</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-mono">
          <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
          <span>Zero network latency · Running in browser memory</span>
        </div>
      </div>
    </div>
  );
};

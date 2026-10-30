import React, { useState } from 'react';
import { VaultClip } from '../types';
import { formatBytes } from '../utils/mediaParser';
import {
  X,
  Play,
  Pause,
  RotateCcw,
  Sparkles,
  Copy,
  Check,
  HardDrive,
  Database,
  ExternalLink,
  Tag,
  Maximize2,
  Clock,
} from 'lucide-react';

interface ClipPlayerModalProps {
  clip: VaultClip | null;
  isOpen: boolean;
  onClose: () => void;
  onSendToRemix: (clip: VaultClip) => void;
}

export const ClipPlayerModal: React.FC<ClipPlayerModalProps> = ({
  clip,
  isOpen,
  onClose,
  onSendToRemix,
}) => {
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [activeTab, setActiveTab] = useState<'info' | 'supabase'>('info');

  if (!isOpen || !clip) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(clip.supabaseStorageUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const isVertical = clip.aspectRatio === '9:16';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-3 sm:p-6">
      <div className="w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80 shrink-0">
          <div className="min-w-0 pr-4">
            <h3 className="text-sm font-bold text-white truncate">{clip.title}</h3>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5">
              <span className="text-cyan-400">{clip.game}</span>
              <span>·</span>
              <span>{clip.aspectRatioLabel}</span>
              <span>·</span>
              <span>{clip.durationFormatted}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                onSendToRemix(clip);
                onClose();
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Use in Remix</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player & Inspector */}
        <div className="flex-1 overflow-y-auto grid grid-cols-1 md:grid-cols-12 min-h-0">
          {/* Video Player Column */}
          <div className="md:col-span-7 bg-black flex items-center justify-center p-4 border-b md:border-b-0 md:border-r border-slate-800">
            <div className={`relative w-full ${isVertical ? 'max-w-[280px] aspect-[9/16]' : 'aspect-video'} bg-slate-950 rounded-xl overflow-hidden shadow-2xl flex items-center justify-center`}>
              <video
                src={clip.videoUrl}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Metadata Inspector Column */}
          <div className="md:col-span-5 p-6 space-y-5 bg-slate-900/60 overflow-y-auto">
            {/* Tabs for Metadata vs Supabase Cloud Specs */}
            <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('info')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'info'
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Clip Specs
              </button>
              <button
                onClick={() => setActiveTab('supabase')}
                className={`flex-1 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                  activeTab === 'supabase'
                    ? 'bg-slate-800 text-cyan-300 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Supabase & SQL
              </button>
            </div>

            {activeTab === 'info' ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="block text-[11px] text-slate-500 font-mono mb-1">Resolution</span>
                    <span className="font-semibold text-white font-mono">{clip.width} × {clip.height}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="block text-[11px] text-slate-500 font-mono mb-1">Duration</span>
                    <span className="font-semibold text-white font-mono">{clip.durationFormatted} ({clip.duration}s)</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="block text-[11px] text-slate-500 font-mono mb-1">File Size</span>
                    <span className="font-semibold text-white font-mono">{formatBytes(clip.fileSize)}</span>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80">
                    <span className="block text-[11px] text-slate-500 font-mono mb-1">Category</span>
                    <span className="font-semibold text-cyan-400">{clip.category}</span>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <span className="block text-xs font-semibold text-slate-300 mb-2">
                    Metadata Tags ({clip.tags.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {clip.tags.map(t => (
                      <span
                        key={t}
                        className="px-2.5 py-1 rounded-lg text-xs bg-slate-950 text-slate-300 border border-slate-800"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cloud Sync timestamp */}
                <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-400 space-y-1">
                  <div className="text-slate-500 text-[11px]">Ingestion Timestamps:</div>
                  <div>Synced: {new Date(clip.syncedAt).toLocaleTimeString()}</div>
                  <div className="text-emerald-400">Status: Verified in Storage Bucket</div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Supabase Bucket URL */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Supabase Storage Object URL
                  </label>
                  <div className="flex items-center gap-2 p-2 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-slate-300">
                    <span className="truncate flex-1">{clip.supabaseStorageUrl}</span>
                    <button
                      onClick={handleCopy}
                      className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors shrink-0"
                      title="Copy URL"
                    >
                      {copiedUrl ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* PostgreSQL Database Row Preview */}
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    PostgreSQL Record (public.vault_clips)
                  </label>
                  <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] text-cyan-300 overflow-x-auto max-h-48">
{JSON.stringify(
  {
    id: clip.id,
    title: clip.title,
    filename: clip.filename,
    storage_url: clip.supabaseStorageUrl,
    aspect_ratio: clip.aspectRatio,
    resolution: `${clip.width}x${clip.height}`,
    duration_seconds: clip.duration,
    category: clip.category,
    game: clip.game,
    tags: clip.tags,
  },
  null,
  2
)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

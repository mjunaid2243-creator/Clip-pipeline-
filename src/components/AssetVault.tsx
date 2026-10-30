import React, { useState } from 'react';
import { VaultClip, AspectRatioType } from '../types';
import { formatBytes } from '../utils/mediaParser';
import {
  Search,
  Filter,
  Grid,
  List,
  Play,
  Sparkles,
  Copy,
  Check,
  Trash2,
  Maximize2,
  Film,
  Plus,
  Share2,
  HardDrive,
  Clock,
  Layers,
} from 'lucide-react';

interface AssetVaultProps {
  clips: VaultClip[];
  onOpenUpload: () => void;
  onPreviewClip: (clip: VaultClip) => void;
  onSendToRemix: (clip: VaultClip) => void;
  onDeleteClip: (clipId: string) => void;
}

export const AssetVault: React.FC<AssetVaultProps> = ({
  clips,
  onOpenUpload,
  onPreviewClip,
  onSendToRemix,
  onDeleteClip,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [aspectFilter, setAspectFilter] = useState<'all' | '9:16' | '16:9'>('all');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Extract unique games & categories for filtering
  const games = Array.from(new Set(clips.map(c => c.game).filter(Boolean)));
  const categories = Array.from(new Set(clips.map(c => c.category).filter(Boolean)));
  
  // Extract top tags
  const allTags = clips.flatMap(c => c.tags);
  const tagCounts: { [tag: string]: number } = {};
  allTags.forEach(t => {
    tagCounts[t] = (tagCounts[t] || 0) + 1;
  });
  const popularTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([t]) => t);

  // Filtering
  const filteredClips = clips.filter(clip => {
    // Aspect filter
    if (aspectFilter === '9:16' && clip.aspectRatio !== '9:16') return false;
    if (aspectFilter === '16:9' && clip.aspectRatio !== '16:9') return false;

    // Game filter
    if (selectedGame !== 'all' && clip.game !== selectedGame) return false;

    // Category filter
    if (selectedCategory !== 'all' && clip.category !== selectedCategory) return false;

    // Tag filter
    if (selectedTag && !clip.tags.includes(selectedTag)) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = clip.title.toLowerCase().includes(q);
      const matchFile = clip.filename.toLowerCase().includes(q);
      const matchGame = clip.game.toLowerCase().includes(q);
      const matchTag = clip.tags.some(t => t.toLowerCase().includes(q));
      if (!matchTitle && !matchFile && !matchGame && !matchTag) return false;
    }

    return true;
  });

  const handleCopyStorageUrl = (clip: VaultClip, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(clip.supabaseStorageUrl);
    setCopiedId(clip.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const verticalCount = clips.filter(c => c.aspectRatio === '9:16').length;
  const landscapeCount = clips.filter(c => c.aspectRatio === '16:9').length;

  return (
    <div className="w-full space-y-6">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search vault by title, game, tags (e.g. 'GTA V', 'Satisfying')..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-700/80 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 transition-colors"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Aspect Ratio Filter Tabs (interactive functional buttons) */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setAspectFilter('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                aspectFilter === 'all'
                  ? 'bg-slate-800 text-cyan-300 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All ({clips.length})
            </button>
            <button
              onClick={() => setAspectFilter('9:16')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                aspectFilter === '9:16'
                  ? 'bg-slate-800 text-emerald-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              9:16 Shorts ({verticalCount})
            </button>
            <button
              onClick={() => setAspectFilter('16:9')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                aspectFilter === '16:9'
                  ? 'bg-slate-800 text-blue-400 shadow-sm border border-slate-700/60'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              16:9 ({landscapeCount})
            </button>
          </div>

          {/* Game filter dropdown */}
          <div className="flex items-center bg-slate-950 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <span className="text-[11px] text-slate-500 mr-2">Game:</span>
            <select
              value={selectedGame}
              onChange={e => setSelectedGame(e.target.value)}
              className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
            >
              <option value="all" className="bg-slate-900">All Games</option>
              {games.map(g => (
                <option key={g} value={g} className="bg-slate-900">{g}</option>
              ))}
            </select>
          </div>

          {/* View mode toggle */}
          <div className="flex items-center gap-1 p-1 bg-slate-950 rounded-xl border border-slate-800">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid'
                  ? 'bg-slate-800 text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table'
                  ? 'bg-slate-800 text-cyan-400'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Popular Tag Filters Bar (Interactive buttons) */}
      {popularTags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-slate-500 text-[11px] uppercase tracking-wider font-semibold shrink-0">
            Filter by Tag:
          </span>
          {popularTags.map(tag => {
            const isSelected = selectedTag === tag;
            return (
              <button
                key={tag}
                onClick={() => setSelectedTag(isSelected ? null : tag)}
                className={`px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap text-xs font-medium ${
                  isSelected
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                {tag} {tagCounts[tag] > 1 && `(${tagCounts[tag]})`}
              </button>
            );
          })}
          {selectedTag && (
            <button
              onClick={() => setSelectedTag(null)}
              className="text-xs text-slate-500 hover:text-slate-300 underline underline-offset-2 ml-1"
            >
              Clear tag filter
            </button>
          )}
        </div>
      )}

      {/* Main Content: Grid vs Table */}
      {filteredClips.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/30 border border-slate-800 flex flex-col items-center justify-center">
          <Film className="w-10 h-10 text-slate-600 mb-3" />
          <h4 className="text-sm font-semibold text-slate-200 mb-1">No Assets Match Filters</h4>
          <p className="text-xs text-slate-500 mb-4 max-w-sm">
            Try adjusting your search query, clearing tag filters, or upload more raw gameplay clips.
          </p>
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 rounded-lg hover:bg-cyan-500/30 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Upload New Clips</span>
          </button>
        </div>
      ) : viewMode === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredClips.map(clip => {
            const isVertical = clip.aspectRatio === '9:16';
            const isCopied = copiedId === clip.id;

            return (
              <div
                key={clip.id}
                className="group relative rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700/80 hover:bg-slate-900/90 transition-all flex flex-col justify-between overflow-hidden shadow-lg hover:shadow-cyan-500/5"
              >
                {/* Media Container */}
                <div
                  onClick={() => onPreviewClip(clip)}
                  className="relative w-full aspect-video bg-slate-950 overflow-hidden cursor-pointer"
                >
                  {clip.thumbnailUrl ? (
                    <img
                      src={clip.thumbnailUrl}
                      alt={clip.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-950 text-slate-700">
                      <Film className="w-8 h-8" />
                    </div>
                  )}

                  {/* Hover Play Scrim */}
                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                    <div className="w-10 h-10 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                      <Play className="w-5 h-5 ml-0.5 fill-current" />
                    </div>
                  </div>

                  {/* Aspect Ratio Badge */}
                  <div
                    className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider backdrop-blur-md uppercase ${
                      isVertical
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                        : 'bg-blue-950/80 text-blue-300 border border-blue-500/40'
                    }`}
                  >
                    {isVertical ? '9:16 Shorts' : '16:9'}
                  </div>

                  {/* Duration Badge */}
                  <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-950/80 text-slate-200 border border-slate-800 backdrop-blur-md">
                    {clip.durationFormatted}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 flex-1 flex flex-col justify-between">
                  <div>
                    <h3
                      onClick={() => onPreviewClip(clip)}
                      className="text-xs font-bold text-white hover:text-cyan-400 cursor-pointer truncate mb-1"
                      title={clip.title}
                    >
                      {clip.title}
                    </h3>

                    {/* Metadata line (Anti-slop compliant: unboxed text with typographic dots) */}
                    <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2.5">
                      <span className="text-slate-300 font-medium">{clip.game}</span>
                      <span aria-hidden="true">·</span>
                      <span>{clip.width}×{clip.height}</span>
                      <span aria-hidden="true">·</span>
                      <span>{formatBytes(clip.fileSize)}</span>
                    </div>

                    {/* Unboxed Metadata Tags */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400 mb-4">
                      {clip.tags.slice(0, 3).map((tag, idx) => (
                        <React.Fragment key={tag}>
                          {idx > 0 && <span className="text-slate-600">/</span>}
                          <span
                            onClick={() => setSelectedTag(tag)}
                            className="text-cyan-300/80 hover:text-cyan-300 hover:underline cursor-pointer truncate max-w-[130px]"
                          >
                            {tag}
                          </span>
                        </React.Fragment>
                      ))}
                      {clip.tags.length > 3 && (
                        <span className="text-slate-500 text-[10px]">+{clip.tags.length - 3}</span>
                      )}
                    </div>
                  </div>

                  {/* Card Actions Footer */}
                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => onSendToRemix(clip)}
                      className="flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-all hover:scale-[1.01]"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Use in Remix</span>
                    </button>

                    <button
                      type="button"
                      onClick={e => handleCopyStorageUrl(clip, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800 transition-colors"
                      title="Copy Supabase Storage Bucket URL"
                    >
                      {isCopied ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteClip(clip.id)}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-800 border border-slate-800 transition-colors"
                      title="Delete asset"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* High-Density Table View (SaaS Dashboard guideline) */
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/80 border-b border-slate-800 text-slate-400 font-mono text-[11px] uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-4">Clip Title</th>
                  <th className="py-3 px-4">Game</th>
                  <th className="py-3 px-4">Aspect</th>
                  <th className="py-3 px-4 text-right">Duration</th>
                  <th className="py-3 px-4 text-right">Resolution</th>
                  <th className="py-3 px-4 text-right">Size</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80 text-slate-300">
                {filteredClips.map(clip => {
                  const isVertical = clip.aspectRatio === '9:16';
                  return (
                    <tr
                      key={clip.id}
                      className="hover:bg-slate-800/50 transition-colors group"
                    >
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => onPreviewClip(clip)}
                            className="w-10 h-7 rounded bg-slate-950 border border-slate-800 overflow-hidden shrink-0 cursor-pointer relative"
                          >
                            {clip.thumbnailUrl && (
                              <img
                                src={clip.thumbnailUrl}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            )}
                          </div>
                          <span
                            onClick={() => onPreviewClip(clip)}
                            className="font-semibold text-slate-100 hover:text-cyan-400 cursor-pointer truncate max-w-xs"
                          >
                            {clip.title}
                          </span>
                        </div>
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-300">
                        {clip.game}
                      </td>
                      <td className="py-2.5 px-4">
                        <span
                          className={`font-mono text-[11px] ${
                            isVertical ? 'text-emerald-400' : 'text-blue-400'
                          }`}
                        >
                          {clip.aspectRatioLabel}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-300">
                        {clip.durationFormatted}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                        {clip.width}×{clip.height}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                        {formatBytes(clip.fileSize)}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center gap-1 text-[11px] text-slate-400 truncate max-w-xs">
                          {clip.tags.slice(0, 2).join(' · ')}
                          {clip.tags.length > 2 && ` +${clip.tags.length - 2}`}
                        </div>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => onSendToRemix(clip)}
                            className="px-2.5 py-1 rounded text-xs font-semibold bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 border border-cyan-500/30 transition-colors"
                          >
                            Remix
                          </button>
                          <button
                            onClick={() => onDeleteClip(clip.id)}
                            className="p-1 rounded text-slate-500 hover:text-red-400 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

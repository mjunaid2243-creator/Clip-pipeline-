import React, { useState } from 'react';
import { LocalParsedClip } from '../types';
import {
  Tag,
  Check,
  Plus,
  X,
  Play,
  Layers,
  Sparkles,
  ArrowRight,
  Info,
  Sliders,
  Maximize2,
  Clock,
  HardDrive,
} from 'lucide-react';
import { formatBytes } from '../utils/mediaParser';

interface TaggingModalProps {
  clips: LocalParsedClip[];
  isOpen: boolean;
  onClose: () => void;
  onProceedToUpload: (updatedClips: LocalParsedClip[]) => void;
}

export const TaggingModal: React.FC<TaggingModalProps> = ({
  clips: initialClips,
  isOpen,
  onClose,
  onProceedToUpload,
}) => {
  const [clips, setClips] = useState<LocalParsedClip[]>(initialClips);
  const [selectedClipId, setSelectedClipId] = useState<string>(
    initialClips.length > 0 ? initialClips[0].id : ''
  );

  // Bulk tag state
  const [bulkCategory, setBulkCategory] = useState<string>('Background Loop');
  const [bulkGame, setBulkGame] = useState<string>('');
  const [bulkVibe, setBulkVibe] = useState<string>('');
  const [customBulkTag, setCustomBulkTag] = useState<string>('');
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  // Individual tag input
  const [customIndividualTag, setCustomIndividualTag] = useState<string>('');

  if (!isOpen) return null;

  const selectedClip = clips.find(c => c.id === selectedClipId) || clips[0];

  // Apply bulk tag to all clips
  const handleApplyBulkTags = () => {
    setClips(prevClips =>
      prevClips.map(clip => {
        const newTags = [...clip.tags];

        if (bulkCategory) {
          // Remove old Category: tags and add new
          const filtered = newTags.filter(t => !t.startsWith('Category:'));
          filtered.push(`Category: ${bulkCategory}`);
          clip.category = bulkCategory;
          newTags.length = 0;
          newTags.push(...filtered);
        }

        if (bulkGame) {
          const filtered = newTags.filter(t => !t.startsWith('Game:'));
          filtered.push(`Game: ${bulkGame}`);
          clip.game = bulkGame;
          newTags.length = 0;
          newTags.push(...filtered);
        }

        if (bulkVibe) {
          const filtered = newTags.filter(t => !t.startsWith('Vibe:'));
          filtered.push(`Vibe: ${bulkVibe}`);
          newTags.length = 0;
          newTags.push(...filtered);
        }

        if (customBulkTag.trim()) {
          const formatted = customBulkTag.trim();
          if (!newTags.includes(formatted)) {
            newTags.push(formatted);
          }
        }

        return {
          ...clip,
          tags: Array.from(new Set(newTags)),
        };
      })
    );

    setBulkFeedback(`Applied bulk metadata to all ${clips.length} clips!`);
    setCustomBulkTag('');
    setTimeout(() => setBulkFeedback(null), 3000);
  };

  // Add individual tag to selected clip
  const handleAddIndividualTag = (tagToAdd: string) => {
    if (!tagToAdd.trim() || !selectedClip) return;
    const cleanTag = tagToAdd.trim();

    setClips(prevClips =>
      prevClips.map(c => {
        if (c.id === selectedClip.id) {
          if (c.tags.includes(cleanTag)) return c;
          return {
            ...c,
            tags: [...c.tags, cleanTag],
          };
        }
        return c;
      })
    );
    setCustomIndividualTag('');
  };

  // Remove tag from selected clip
  const handleRemoveIndividualTag = (tagToRemove: string) => {
    if (!selectedClip) return;
    setClips(prevClips =>
      prevClips.map(c => {
        if (c.id === selectedClip.id) {
          return {
            ...c,
            tags: c.tags.filter(t => t !== tagToRemove),
          };
        }
        return c;
      })
    );
  };

  // Update selected clip title
  const handleTitleChange = (newTitle: string) => {
    if (!selectedClip) return;
    setClips(prevClips =>
      prevClips.map(c => (c.id === selectedClip.id ? { ...c, title: newTitle } : c))
    );
  };

  // Update selected clip category
  const handleCategoryChange = (newCategory: string) => {
    if (!selectedClip) return;
    setClips(prevClips =>
      prevClips.map(c => {
        if (c.id === selectedClip.id) {
          const filtered = c.tags.filter(t => !t.startsWith('Category:'));
          filtered.push(`Category: ${newCategory}`);
          return {
            ...c,
            category: newCategory,
            tags: filtered,
          };
        }
        return c;
      })
    );
  };

  const totalBytes = clips.reduce((acc, c) => acc + c.fileSize, 0);
  const verticalCount = clips.filter(c => c.aspectRatio === '9:16').length;
  const landscapeCount = clips.filter(c => c.aspectRatio === '16:9').length;

  const quickTagSuggestions = [
    'Hook: Satisfying',
    'Hook: Close Call',
    'Hook: WTF Moment',
    'Vibe: High Energy',
    'Vibe: Hypnotic',
    'Vibe: Chill',
    'Pacing: Rapid',
    'Audio: Clean SFX',
    'Audio: Muted',
    'Style: Loopable',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      <div className="w-full max-w-6xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-base font-bold text-white tracking-tight">
                Review & Tag Batch
              </h2>
              <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
                <span className="text-cyan-400 font-semibold">{clips.length} Clips Extracted</span>
                <span>·</span>
                <span>{formatBytes(totalBytes)}</span>
                <span>·</span>
                <span className="text-emerald-400">{verticalCount}x 9:16 Shorts</span>
                <span>·</span>
                <span className="text-blue-400">{landscapeCount}x 16:9 Landscape</span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bulk Tagging Toolbar */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-b border-slate-800/80 shrink-0">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 shrink-0">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Apply Bulk Metadata:</span>
            </div>

            <div className="flex flex-wrap items-center gap-2 grow">
              {/* Category selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400">Category:</span>
                <select
                  value={bulkCategory}
                  onChange={e => setBulkCategory(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Background Loop" className="bg-slate-900">Background Loop</option>
                  <option value="Hook Clip" className="bg-slate-900">Hook Clip</option>
                  <option value="Gameplay Roll" className="bg-slate-900">Gameplay Roll</option>
                  <option value="Highlight Reel" className="bg-slate-900">Highlight Reel</option>
                  <option value="Montage Filler" className="bg-slate-900">Montage Filler</option>
                </select>
              </div>

              {/* Game Selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400">Game:</span>
                <select
                  value={bulkGame}
                  onChange={e => setBulkGame(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Keep Inferred</option>
                  <option value="GTA V" className="bg-slate-900">GTA V</option>
                  <option value="Minecraft" className="bg-slate-900">Minecraft</option>
                  <option value="Subway Surfers" className="bg-slate-900">Subway Surfers</option>
                  <option value="Counter-Strike 2" className="bg-slate-900">Counter-Strike 2</option>
                  <option value="Rocket League" className="bg-slate-900">Rocket League</option>
                  <option value="Valorant" className="bg-slate-900">Valorant</option>
                </select>
              </div>

              {/* Vibe Selector */}
              <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <span className="text-[11px] text-slate-400">Vibe:</span>
                <select
                  value={bulkVibe}
                  onChange={e => setBulkVibe(e.target.value)}
                  className="bg-transparent text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="" className="bg-slate-900">Auto</option>
                  <option value="High Energy" className="bg-slate-900">High Energy</option>
                  <option value="Satisfying" className="bg-slate-900">Satisfying</option>
                  <option value="Hypnotic" className="bg-slate-900">Hypnotic</option>
                  <option value="Chill" className="bg-slate-900">Chill</option>
                  <option value="Sweaty" className="bg-slate-900">Sweaty</option>
                </select>
              </div>

              {/* Custom bulk tag input */}
              <div className="flex items-center gap-1 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                <input
                  type="text"
                  placeholder="Custom tag (e.g. Creator: John)..."
                  value={customBulkTag}
                  onChange={e => setCustomBulkTag(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleApplyBulkTags()}
                  className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-36 sm:w-44"
                />
              </div>

              <button
                type="button"
                onClick={handleApplyBulkTags}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 transition-colors whitespace-nowrap"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Apply to All ({clips.length})</span>
              </button>

              {bulkFeedback && (
                <span className="text-xs text-emerald-400 font-medium animate-fade-in">
                  {bulkFeedback}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Modal Body: Split view of Thumbnails Grid (Left/Center) + Individual Clip Inspector (Right) */}
        <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
          {/* Thumbnails Grid Column */}
          <div className="lg:col-span-7 xl:col-span-8 p-6 overflow-y-auto border-b lg:border-b-0 lg:border-r border-slate-800">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
              <span>Click any clip below to customize specific tags & titles:</span>
              <span className="font-mono text-slate-500">Auto-detected frame captures</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {clips.map(clip => {
                const isSelected = clip.id === selectedClip.id;
                const isVertical = clip.aspectRatio === '9:16';

                return (
                  <div
                    key={clip.id}
                    onClick={() => setSelectedClipId(clip.id)}
                    className={`group cursor-pointer rounded-xl border p-3 transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-cyan-400 bg-slate-800/80 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-400/50'
                        : 'border-slate-800 bg-slate-950/40 hover:border-slate-700 hover:bg-slate-900/60'
                    }`}
                  >
                    {/* Thumbnail Viewport */}
                    <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800/80 mb-2.5 flex items-center justify-center">
                      {clip.thumbnailUrl ? (
                        <img
                          src={clip.thumbnailUrl}
                          alt={clip.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="flex items-center justify-center text-slate-600">
                          <Play className="w-6 h-6" />
                        </div>
                      )}

                      {/* Aspect Ratio pill */}
                      <div
                        className={`absolute top-2 left-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider backdrop-blur-md ${
                          isVertical
                            ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                            : 'bg-blue-950/80 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {isVertical ? '9:16 Shorts' : '16:9'}
                      </div>

                      {/* Duration */}
                      <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] font-mono font-medium bg-slate-950/80 text-slate-200 border border-slate-700/60 backdrop-blur-md">
                        {clip.durationFormatted}
                      </div>
                    </div>

                    {/* Clip Info */}
                    <div>
                      <h4 className="text-xs font-semibold text-slate-200 truncate mb-1" title={clip.title}>
                        {clip.title}
                      </h4>
                      <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 mb-2">
                        <span>{clip.width}×{clip.height}</span>
                        <span>·</span>
                        <span>{formatBytes(clip.fileSize)}</span>
                      </div>

                      {/* Inline Unboxed Metadata Tags (Anti-Slop Compliant) */}
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
                        {clip.tags.slice(0, 3).map((tag, idx) => (
                          <React.Fragment key={tag}>
                            {idx > 0 && <span className="text-slate-600">/</span>}
                            <span className="text-cyan-300/90 truncate max-w-[120px]">{tag}</span>
                          </React.Fragment>
                        ))}
                        {clip.tags.length > 3 && (
                          <span className="text-slate-500 text-[10px]">+{clip.tags.length - 3}</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Clip Inspector Column */}
          <div className="lg:col-span-5 xl:col-span-4 p-6 overflow-y-auto bg-slate-950/40 flex flex-col justify-between">
            {selectedClip ? (
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-cyan-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                      Clip Metadata Inspector
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-slate-500">{selectedClip.aspectRatioLabel}</span>
                </div>

                {/* Video Preview Scrubber */}
                <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800">
                  <video
                    src={selectedClip.videoUrl}
                    controls
                    playsInline
                    className="w-full max-h-48 object-contain bg-black"
                  />
                </div>

                {/* Title Edit */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">
                    Clip Title
                  </label>
                  <input
                    type="text"
                    value={selectedClip.title}
                    onChange={e => handleTitleChange(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400 transition-colors"
                  />
                </div>

                {/* Category & Game Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Category
                    </label>
                    <select
                      value={selectedClip.category}
                      onChange={e => handleCategoryChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                    >
                      <option value="Background Loop">Background Loop</option>
                      <option value="Hook Clip">Hook Clip</option>
                      <option value="Gameplay Roll">Gameplay Roll</option>
                      <option value="Highlight Reel">Highlight Reel</option>
                      <option value="Montage Filler">Montage Filler</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Game
                    </label>
                    <input
                      type="text"
                      value={selectedClip.game}
                      onChange={e => {
                        const newGame = e.target.value;
                        setClips(prev =>
                          prev.map(c => {
                            if (c.id === selectedClip.id) {
                              const filtered = c.tags.filter(t => !t.startsWith('Game:'));
                              if (newGame.trim()) filtered.push(`Game: ${newGame.trim()}`);
                              return { ...c, game: newGame, tags: filtered };
                            }
                            return c;
                          })
                        );
                      }}
                      className="w-full px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                {/* Tags on this clip */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-[11px] font-medium text-slate-400">
                      Applied Tags ({selectedClip.tags.length})
                    </label>
                  </div>

                  {/* Tags list with remove buttons */}
                  <div className="flex flex-wrap gap-1.5 mb-3 p-2 bg-slate-900/60 rounded-lg border border-slate-800 min-h-[44px]">
                    {selectedClip.tags.map(tag => (
                      <span
                        key={tag}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-slate-800 text-slate-200 border border-slate-700/80"
                      >
                        <span>{tag}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveIndividualTag(tag)}
                          className="hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>

                  {/* Add Tag Input */}
                  <div className="flex items-center gap-2 mb-3">
                    <input
                      type="text"
                      placeholder="Add tag (e.g. Vibe: High Energy)..."
                      value={customIndividualTag}
                      onChange={e => setCustomIndividualTag(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddIndividualTag(customIndividualTag)}
                      className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:outline-none focus:border-cyan-400"
                    />
                    <button
                      type="button"
                      onClick={() => handleAddIndividualTag(customIndividualTag)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Quick Tag Recommendations */}
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase tracking-wider mb-1.5 font-semibold">
                      Suggested Tags
                    </span>
                    <div className="flex flex-wrap gap-1">
                      {quickTagSuggestions.map(s => {
                        const hasTag = selectedClip.tags.includes(s);
                        return (
                          <button
                            key={s}
                            type="button"
                            onClick={() => (hasTag ? handleRemoveIndividualTag(s) : handleAddIndividualTag(s))}
                            className={`px-2 py-0.5 rounded text-[11px] transition-colors ${
                              hasTag
                                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                                : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                            }`}
                          >
                            {hasTag ? '✓ ' : '+ '}
                            {s}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Aspect ratio advice */}
                <div className="p-3 bg-slate-900/40 rounded-xl border border-slate-800 flex items-start gap-2 text-xs text-slate-400">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <div>
                    {selectedClip.aspectRatio === '9:16' ? (
                      <span>
                        <strong className="text-emerald-400">Ready for Shorts/TikTok:</strong> Native 9:16 vertical ratio fits TikTok, YouTube Shorts, and Instagram Reels perfectly.
                      </span>
                    ) : (
                      <span>
                        <strong className="text-blue-400">16:9 Landscape:</strong> Ideal for desktop/YouTube video recipes, or center-cropped in the Remix Builder for vertical formats.
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-400 font-mono">
            <span className="flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-cyan-400" />
              <span>Ready for Cloud Sync: {clips.length} items</span>
            </span>
            <span>·</span>
            <span className="text-slate-500">{formatBytes(totalBytes)}</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => onProceedToUpload(clips)}
              className="flex items-center gap-2 px-5 py-2.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 rounded-lg shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Save & Upload ({clips.length} Clips)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

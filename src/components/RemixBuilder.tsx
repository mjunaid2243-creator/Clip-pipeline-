import React, { useState, useEffect, useRef } from 'react';
import { VaultClip, RemixSlot, VoiceoverConfig } from '../types';
import {
  Sparkles,
  Play,
  Pause,
  RotateCcw,
  Volume2,
  VolumeX,
  Download,
  Film,
  Plus,
  Trash2,
  Check,
  Smartphone,
  Sliders,
  Type,
  Mic,
  Music,
  Share2,
  AlertCircle,
  HardDrive,
} from 'lucide-react';

interface RemixBuilderProps {
  vaultClips: VaultClip[];
  initialSelectedClip?: VaultClip | null;
  onOpenUpload: () => void;
}

const STORY_PRESETS: { label: string; topic: string; script: string }[] = [
  {
    label: 'r/AskReddit: The $4,000 Storage Unit Secret',
    topic: 'Reddit Viral Story',
    script:
      "I bought an abandoned storage locker for 400 dollars, and the lock had never been cut. When I opened the dusty metal trunk in the back, I found three mint condition 1996 first-edition Pokemon booster packs and an old journal with coordinates. I typed the coordinates into Google Maps, and what I saw literally gave me chills.",
  },
  {
    label: 'Mind-Blowing Gaming Physics Secrets',
    topic: 'Gaming Trivia',
    script:
      "Did you know why GTA V mega ramps never crash your game? The physics engine uses a hidden trick called dynamic lod tessellation. It turns off collision physics for every car behind you until the exact millisecond you land the jump. Try watching your rearview mirror next time!",
  },
  {
    label: 'Unsolved Mystery: The 3AM Minecraft Radio',
    topic: 'Creepypasta Lore',
    script:
      "In 2013, a player left their Minecraft world running overnight while AFK at bedrock level. When they checked the recording the next morning, the in-game jukebox had changed to Disc 11, but there were no discs in their inventory. What happens at timestamp 3:14 is still unexplained.",
  },
  {
    label: 'Crazy Life Paradox: The 20-Year Sleep Trick',
    topic: 'Brain Hack',
    script:
      "If you wake up at the exact same hour every day for two weeks, your brain stops producing melatonin 45 minutes before your alarm rings. That means you wake up with zero brain fog, like you just drank a double espresso. Save this video so you don't forget to try it tonight!",
  },
];

export const RemixBuilder: React.FC<RemixBuilderProps> = ({
  vaultClips,
  initialSelectedClip,
  onOpenUpload,
}) => {
  // Slots
  const [hookClip, setHookClip] = useState<VaultClip | null>(null);
  const [backgroundClip, setBackgroundClip] = useState<VaultClip | null>(null);
  const [payoffClip, setPayoffClip] = useState<VaultClip | null>(null);

  // Script & Voiceover
  const [selectedPresetIndex, setSelectedPresetIndex] = useState(0);
  const [scriptText, setScriptText] = useState(STORY_PRESETS[0].script);
  const [selectedVoice, setSelectedVoice] = useState<'marcus' | 'kai' | 'sarah' | 'elena'>('marcus');
  const [subtitleStyle, setSubtitleStyle] = useState<'mrbeast' | 'tiktok_glow' | 'minimal' | 'cyber'>('mrbeast');
  const [speakingRate, setSpeakingRate] = useState(1.1);
  const [bgMusic, setBgMusic] = useState<'chill_hop' | 'synthwave' | 'trap_beat' | 'none'>('trap_beat');
  const [isGeneratingScript, setIsGeneratingScript] = useState(false);

  // Live Playback State
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [activeWordIndex, setActiveWordIndex] = useState(0);

  const videoRef = useRef<HTMLVideoElement>(null);
  const speechUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Automatically assign initialSelectedClip if passed
  useEffect(() => {
    if (initialSelectedClip) {
      if (initialSelectedClip.category === 'Hook Clip') {
        setHookClip(initialSelectedClip);
      } else {
        setBackgroundClip(initialSelectedClip);
      }
    } else if (vaultClips.length > 0) {
      // Pick first 9:16 or default clip as background
      const vertical = vaultClips.find(c => c.aspectRatio === '9:16');
      if (vertical && !backgroundClip) {
        setBackgroundClip(vertical);
      } else if (!backgroundClip) {
        setBackgroundClip(vaultClips[0]);
      }
    }
  }, [initialSelectedClip, vaultClips]);

  // Words list for captions
  const words = scriptText.split(/\s+/).filter(Boolean);

  // Handle Play / Pause with Web Speech API integration
  const togglePlay = () => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  };

  const startPlayback = () => {
    setIsPlaying(true);
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }

    // Try Web Speech API if supported
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(scriptText);
      utterance.rate = speakingRate;

      // Pitch adjustment based on voice
      if (selectedVoice === 'kai') {
        utterance.pitch = 1.2;
      } else if (selectedVoice === 'marcus') {
        utterance.pitch = 0.85;
      } else if (selectedVoice === 'sarah') {
        utterance.pitch = 1.05;
      } else {
        utterance.pitch = 0.9;
      }

      utterance.onboundary = event => {
        if (event.name === 'word') {
          // Estimate word index
          const charIndex = event.charIndex;
          const textUpToChar = scriptText.substring(0, charIndex);
          const currentWordIdx = textUpToChar.split(/\s+/).length - 1;
          setActiveWordIndex(Math.max(0, currentWordIdx));
        }
      };

      utterance.onend = () => {
        stopPlayback();
      };

      speechUtteranceRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }
  };

  const stopPlayback = () => {
    setIsPlaying(false);
    if (videoRef.current) {
      videoRef.current.pause();
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Time tracker effect
  useEffect(() => {
    let interval: any;
    if (isPlaying) {
      interval = setInterval(() => {
        setPlaybackTime(prev => {
          const next = prev + 0.1;
          // Approximate word index if Web Speech API boundary doesn't fire
          const wordInterval = (60 / (130 * speakingRate));
          const idx = Math.floor(next / wordInterval);
          if (idx < words.length) {
            setActiveWordIndex(idx);
          }
          return next;
        });
      }, 100);
    } else {
      setPlaybackTime(0);
      setActiveWordIndex(0);
    }
    return () => clearInterval(interval);
  }, [isPlaying, speakingRate, words.length]);

  // Handle Preset Change
  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setScriptText(STORY_PRESETS[index].script);
    stopPlayback();
  };

  // Generate AI Script Simulation
  const handleGenerateAIScript = () => {
    setIsGeneratingScript(true);
    stopPlayback();
    setTimeout(() => {
      const customScripts = [
        "Nobody believes me when I say this, but in GTA V there is an underwater hatch at the deepest point of the map that plays Morse code. If you translate the beeps, it spells out: 'Hey, you never call, how's it going?'. Rockstar literally put a voicemail from a developer's mom in the ocean.",
        "The fastest speed run in Minecraft history was just broken by 4 seconds using a glitch called boat-launching. If you place a boat on honey blocks while entering the nether portal at 60 FPS, the physics engine multiplies your velocity by 18,000. Here's the exact moment it happened.",
        "Psychologists call this the Tetris Effect: after playing Subway Surfers for just 30 minutes, your brain continues to calculate dodge trajectories for real-life objects you see on the sidewalk. Notice how you're already anticipating the coin positions right now?",
      ];
      const randomScript = customScripts[Math.floor(Math.random() * customScripts.length)];
      setScriptText(randomScript);
      setIsGeneratingScript(false);
    }, 800);
  };

  // Export Remix Simulation
  const handleExportRemix = () => {
    setIsExporting(true);
    setExportProgress(0);
    setExportSuccess(false);

    const interval = setInterval(() => {
      setExportProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setIsExporting(false);
          setExportSuccess(true);
          setTimeout(() => setExportSuccess(false), 5000);
          return 100;
        }
        return p + 15;
      });
    }, 200);
  };

  // Caption styling classes
  const getCaptionStyleClass = () => {
    switch (subtitleStyle) {
      case 'mrbeast':
        return 'text-yellow-400 font-extrabold uppercase text-xl drop-shadow-[0_4px_4px_rgba(0,0,0,1)] tracking-wide [text-stroke:2px_black]';
      case 'tiktok_glow':
        return 'text-cyan-300 font-bold uppercase text-lg drop-shadow-[0_0_12px_rgba(6,182,212,0.9)] tracking-wider';
      case 'minimal':
        return 'text-white font-medium text-base drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]';
      case 'cyber':
        return 'text-fuchsia-400 font-mono font-bold text-lg drop-shadow-[0_0_10px_rgba(232,121,249,0.8)]';
    }
  };

  // Get active video url
  const activeVideoUrl = backgroundClip?.videoUrl || hookClip?.videoUrl;

  return (
    <div className="w-full space-y-6">
      {/* Top Banner / Explanation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h2 className="text-base font-bold text-white">Remix Recipe Builder</h2>
            <span className="text-xs font-mono text-cyan-400">9:16 Shorts Engine</span>
          </div>
          <p className="text-xs text-slate-400">
            Pair your raw vault clips with viral AI voiceover scripts and animated karaoke subtitles.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportRemix}
            disabled={isExporting || (!hookClip && !backgroundClip)}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-slate-950 bg-gradient-to-r from-amber-400 to-amber-300 hover:from-amber-300 hover:to-amber-200 rounded-lg shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isExporting ? `Rendering ${exportProgress}%` : 'Export 9:16 Remix'}</span>
          </button>
        </div>
      </div>

      {exportSuccess && (
        <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Check className="w-4 h-4 text-emerald-400" />
            Remix rendered successfully! 9:16 MP4 composition synced and ready.
          </span>
          <span className="font-mono text-emerald-400 text-[11px]">1080×1920 · 60 FPS</span>
        </div>
      )}

      {/* Main Grid: Left Timeline & Voiceover + Right Interactive Phone Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Video Slots & Script Setup */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
          {/* Section 1: Video Slots Timeline */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Step 1: Video Asset Slots
                </h3>
                <p className="text-[11px] text-slate-500">
                  Assign hook and background gameplay loops from your synced vault.
                </p>
              </div>
              <span className="text-xs font-mono text-cyan-400">
                {hookClip || backgroundClip ? '2/2 Slots Populated' : 'Select clips below'}
              </span>
            </div>

            {/* Slots Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Slot 1: Hook Clip */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  hookClip
                    ? 'border-cyan-500/40 bg-slate-950/60'
                    : 'border-dashed border-slate-700 bg-slate-950/20 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-cyan-500/20 text-cyan-300 text-[11px] font-bold flex items-center justify-center">
                      A
                    </span>
                    <span className="text-xs font-semibold text-white">Hook Clip (0-3s)</span>
                  </div>
                  {hookClip && (
                    <button
                      onClick={() => setHookClip(null)}
                      className="text-slate-500 hover:text-red-400 text-xs"
                      title="Clear slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {hookClip ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-10 rounded bg-slate-900 overflow-hidden border border-slate-800 shrink-0">
                      {hookClip.thumbnailUrl && (
                        <img src={hookClip.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-200 truncate">{hookClip.title}</div>
                      <div className="text-[11px] font-mono text-slate-500">
                        {hookClip.game} · {hookClip.durationFormatted} · {hookClip.aspectRatioLabel}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-500 mb-2">Stunt or clutch moment to grab viewer attention</p>
                    <select
                      onChange={e => {
                        const found = vaultClips.find(c => c.id === e.target.value);
                        if (found) setHookClip(found);
                      }}
                      className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
                    >
                      <option value="">+ Assign Clip from Vault</option>
                      {vaultClips.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.game} - {c.aspectRatio})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              {/* Slot 2: Background Gameplay Loop */}
              <div
                className={`p-4 rounded-xl border transition-all ${
                  backgroundClip
                    ? 'border-emerald-500/40 bg-slate-950/60'
                    : 'border-dashed border-slate-700 bg-slate-950/20 hover:border-slate-600'
                }`}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center justify-center">
                      B
                    </span>
                    <span className="text-xs font-semibold text-white">Background Gameplay Loop</span>
                  </div>
                  {backgroundClip && (
                    <button
                      onClick={() => setBackgroundClip(null)}
                      className="text-slate-500 hover:text-red-400 text-xs"
                      title="Clear slot"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {backgroundClip ? (
                  <div className="flex items-center gap-3">
                    <div className="w-16 h-10 rounded bg-slate-900 overflow-hidden border border-slate-800 shrink-0">
                      {backgroundClip.thumbnailUrl && (
                        <img src={backgroundClip.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-200 truncate">{backgroundClip.title}</div>
                      <div className="text-[11px] font-mono text-emerald-400">
                        {backgroundClip.game} · {backgroundClip.aspectRatioLabel}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-xs text-slate-500 mb-2">9:16 vertical parkour or runner loop</p>
                    <select
                      onChange={e => {
                        const found = vaultClips.find(c => c.id === e.target.value);
                        if (found) setBackgroundClip(found);
                      }}
                      className="text-xs bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-slate-300 focus:outline-none"
                    >
                      <option value="">+ Assign Background Loop</option>
                      {vaultClips.map(c => (
                        <option key={c.id} value={c.id}>
                          {c.title} ({c.game} - {c.aspectRatio})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: AI Voiceover & Story Script */}
          <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                  <Mic className="w-4 h-4 text-cyan-400" />
                  <span>Step 2: AI Voiceover Script</span>
                </h3>
                <p className="text-[11px] text-slate-500">
                  Select a viral hook preset or generate an engaging gaming script.
                </p>
              </div>

              <button
                type="button"
                onClick={handleGenerateAIScript}
                disabled={isGeneratingScript}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isGeneratingScript ? 'Generating Script...' : 'AI Generate Script'}</span>
              </button>
            </div>

            {/* Presets bar */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1">
              {STORY_PRESETS.map((preset, idx) => (
                <button
                  key={preset.label}
                  onClick={() => handleSelectPreset(idx)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedPresetIndex === idx
                      ? 'bg-slate-800 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>

            {/* Script Text Area */}
            <div>
              <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1 font-mono">
                <span>Story Script (Read by AI Voice):</span>
                <span>{words.length} words · ~{Math.round((words.length / (130 * speakingRate)) * 60)}s speech</span>
              </div>
              <textarea
                rows={4}
                value={scriptText}
                onChange={e => {
                  setScriptText(e.target.value);
                  stopPlayback();
                }}
                className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white leading-relaxed focus:outline-none focus:border-cyan-400 transition-colors"
              />
            </div>

            {/* Voice & Caption Settings Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {/* Voice Actor */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">AI Voice Actor</label>
                <select
                  value={selectedVoice}
                  onChange={e => {
                    setSelectedVoice(e.target.value as any);
                    stopPlayback();
                  }}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="marcus">Marcus — Deep Hype</option>
                  <option value="kai">Kai — Energetic TikTok</option>
                  <option value="sarah">Sarah — Chill Storyteller</option>
                  <option value="elena">Elena — Mystery & Lore</option>
                </select>
              </div>

              {/* Subtitle Style */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <label className="block text-[11px] text-slate-400 mb-1.5 font-medium">Subtitle Styling</label>
                <select
                  value={subtitleStyle}
                  onChange={e => setSubtitleStyle(e.target.value as any)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none"
                >
                  <option value="mrbeast">MrBeast Bold Yellow</option>
                  <option value="tiktok_glow">TikTok Karaoke Glow</option>
                  <option value="minimal">Minimal White</option>
                  <option value="cyber">Cyber Neon</option>
                </select>
              </div>

              {/* Speech Pace */}
              <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center text-[11px] text-slate-400 mb-1.5 font-medium">
                  <span>Pacing</span>
                  <span className="font-mono text-cyan-400">{speakingRate}x</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="1.4"
                  step="0.05"
                  value={speakingRate}
                  onChange={e => {
                    setSpeakingRate(parseFloat(e.target.value));
                    stopPlayback();
                  }}
                  className="w-full accent-cyan-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live 9:16 Vertical Phone Preview */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col items-center">
          <div className="w-full max-w-[320px]">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span className="flex items-center gap-1.5 font-medium text-slate-300">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>9:16 Vertical Remix Preview</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500">1080×1920</span>
            </div>

            {/* Phone Bezel Frame */}
            <div className="relative w-full aspect-[9/16] rounded-3xl bg-slate-950 border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col justify-between">
              {/* Top notch */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-24 h-4 rounded-full bg-slate-900/90 z-20 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-950 border border-slate-800 mr-2" />
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500/40" />
              </div>

              {/* Background Video Layer */}
              <div className="absolute inset-0 bg-slate-950 z-0">
                {activeVideoUrl ? (
                  <video
                    ref={videoRef}
                    src={activeVideoUrl}
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-6 text-center text-slate-600 bg-slate-900/40">
                    <Film className="w-10 h-10 mb-2 opacity-50" />
                    <p className="text-xs">Select a background clip to preview video remix</p>
                  </div>
                )}
                {/* Contrast scrim for readability */}
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/70 pointer-events-none" />
              </div>

              {/* Top HUD inside preview */}
              <div className="relative z-10 p-4 pt-8 flex items-center justify-between text-[11px] text-white font-semibold drop-shadow">
                <span className="bg-black/50 px-2 py-0.5 rounded backdrop-blur-md">
                  {backgroundClip?.game || 'Gaming Remix'}
                </span>
                <span className="bg-cyan-500/80 text-slate-950 font-bold px-2 py-0.5 rounded backdrop-blur-md">
                  HD 60FPS
                </span>
              </div>

              {/* Center Animated Subtitle Karaoke Display */}
              <div className="relative z-10 px-4 text-center my-auto">
                <div className="min-h-[70px] flex items-center justify-center">
                  {isPlaying ? (
                    <div className={getCaptionStyleClass()}>
                      {words.slice(Math.max(0, activeWordIndex - 2), activeWordIndex + 3).map((w, i) => {
                        const isCurrent = i === Math.min(2, activeWordIndex);
                        return (
                          <span
                            key={i}
                            className={`inline-block mx-1 transition-transform ${
                              isCurrent ? 'scale-110 text-cyan-300' : 'opacity-85'
                            }`}
                          >
                            {w}
                          </span>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="bg-black/60 backdrop-blur-md px-3 py-2 rounded-xl text-xs text-slate-300 border border-slate-700/60">
                      Press <strong className="text-cyan-400">Play Remix</strong> below to preview synchronized voiceover & captions
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Phone Action bar simulation */}
              <div className="relative z-10 p-4 pb-6 flex items-end justify-between">
                <div className="max-w-[75%]">
                  <div className="text-xs font-bold text-white drop-shadow mb-0.5 truncate">
                    @ClipVaultCreator
                  </div>
                  <div className="text-[11px] text-slate-200 line-clamp-2 drop-shadow leading-tight">
                    {scriptText.slice(0, 60)}... #gaming #{backgroundClip?.game?.replace(/\s+/g, '') || 'shorts'}
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3 text-white text-xs">
                  <div className="w-8 h-8 rounded-full bg-slate-900/80 backdrop-blur flex items-center justify-center border border-white/20">
                    <Music className="w-3.5 h-3.5 text-cyan-300 animate-spin" />
                  </div>
                </div>
              </div>
            </div>

            {/* Playback Controls beneath phone */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={togglePlay}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-bold bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-lg shadow-cyan-500/25 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 fill-current" />
                    <span>Pause Preview</span>
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                    <span>Play Remix</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={stopPlayback}
                className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition-colors"
                title="Reset"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

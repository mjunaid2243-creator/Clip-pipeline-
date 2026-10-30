export type AspectRatioType = '16:9' | '9:16' | '1:1' | '21:9' | 'other';

export interface VaultClip {
  id: string;
  title: string;
  filename: string;
  fileSize: number; // in bytes
  duration: number; // in seconds
  durationFormatted: string;
  width: number;
  height: number;
  aspectRatio: AspectRatioType;
  aspectRatioLabel: string; // e.g. "9:16 Vertical (Shorts)"
  category: string; // e.g. "Background Loop", "Hook", "Gameplay Roll"
  game: string; // e.g. "GTA V", "Minecraft", "Subway Surfers"
  tags: string[]; // e.g. ["Vibe: High Energy", "Hook: Satisfying"]
  thumbnailUrl: string; // Base64 data URL
  videoUrl: string; // Object URL or synthetic video URL
  supabaseStorageUrl: string; // e.g. "https://xxxx.supabase.co/storage/v1/object/public/gaming-vault/..."
  syncedAt: string;
  uploadedAt: string;
  inPoint?: number; // trim start
  outPoint?: number; // trim end
}

export interface LocalParsedClip {
  id: string;
  file?: File;
  filename: string;
  fileSize: number;
  width: number;
  height: number;
  duration: number;
  durationFormatted: string;
  aspectRatio: AspectRatioType;
  aspectRatioLabel: string;
  thumbnailUrl: string;
  videoUrl: string;
  // Metadata assigned in Tagging modal
  title: string;
  category: string;
  game: string;
  tags: string[];
  vibe?: string;
  hook?: string;
}

export interface UploadProgress {
  clipId: string;
  progress: number; // 0 to 100
  bytesUploaded: number;
  totalBytes: number;
  speed: string; // e.g. "12.4 MB/s"
  status: 'queued' | 'uploading' | 'syncing_bucket' | 'writing_db' | 'completed' | 'error';
  supabaseStorageUrl?: string;
}

export interface RemixSlot {
  slotType: 'hook' | 'background' | 'payoff';
  title: string;
  description: string;
  requiredAspect: '9:16' | '16:9' | 'any';
  clip: VaultClip | null;
  targetDuration: number; // target seconds
}

export interface VoiceoverConfig {
  scriptTopic: string;
  customPrompt?: string;
  scriptText: string;
  voice: 'marcus' | 'kai' | 'sarah' | 'elena';
  voiceLabel: string;
  subtitleStyle: 'mrbeast' | 'tiktok_glow' | 'minimal' | 'cyber';
  speakingRate: number; // 0.8 to 1.4
  bgMusicTrack: 'chill_hop' | 'synthwave' | 'trap_beat' | 'none';
  bgMusicVolume: number; // 0 to 1
}

export interface RemixRecipe {
  id: string;
  title: string;
  hookClipId?: string;
  backgroundClipId: string;
  payoffClipId?: string;
  voiceover: VoiceoverConfig;
  aspectRatio: '9:16' | '16:9';
  createdAt: string;
}

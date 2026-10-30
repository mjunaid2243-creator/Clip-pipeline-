import { VaultClip, RemixRecipe } from '../types';
import { generateFallbackThumbnail } from './mediaParser';

const VAULT_STORAGE_KEY = 'clipvault_synced_clips_v1';
const REMIX_STORAGE_KEY = 'clipvault_remix_recipes_v1';

const DEFAULT_PREINDEXED_CLIPS: VaultClip[] = [
  {
    id: 'vault_demo_1',
    title: 'Minecraft Satisfying Spiral Parkour Loop',
    filename: 'minecraft_satisfying_spiral_parkour_loop_916.mp4',
    fileSize: 42 * 1024 * 1024,
    duration: 54,
    durationFormatted: '00:54',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    aspectRatioLabel: '9:16 Vertical (Shorts)',
    category: 'Background Loop',
    game: 'Minecraft',
    tags: ['Category: Background Loop', 'Game: Minecraft', 'Vibe: Hypnotic', 'Hook: Satisfying'],
    thumbnailUrl: generateFallbackThumbnail('Minecraft Spiral Parkour', '9:16'),
    videoUrl: '',
    supabaseStorageUrl: 'https://applet-gaming-vault.supabase.co/storage/v1/object/public/gaming-vault-raw-assets/minecraft_satisfying_spiral_parkour_loop_916.mp4',
    syncedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    uploadedAt: new Date(Date.now() - 3600000 * 2).toISOString(),
  },
  {
    id: 'vault_demo_2',
    title: 'GTA V Mega Ramp Car Jump Stunt',
    filename: 'gta_v_mega_ramp_car_jump_4k.mp4',
    fileSize: 84 * 1024 * 1024,
    duration: 28,
    durationFormatted: '00:28',
    width: 3840,
    height: 2160,
    aspectRatio: '16:9',
    aspectRatioLabel: '16:9 Landscape',
    category: 'Hook Clip',
    game: 'GTA V',
    tags: ['Category: Hook Clip', 'Game: GTA V', 'Hook: Satisfying', 'Vibe: High Energy'],
    thumbnailUrl: generateFallbackThumbnail('GTA V Mega Ramp Jump', '16:9'),
    videoUrl: '',
    supabaseStorageUrl: 'https://applet-gaming-vault.supabase.co/storage/v1/object/public/gaming-vault-raw-assets/gta_v_mega_ramp_car_jump_4k.mp4',
    syncedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
    uploadedAt: new Date(Date.now() - 3600000 * 4).toISOString(),
  },
  {
    id: 'vault_demo_3',
    title: 'Subway Surfers High Score Tokyo Run',
    filename: 'subway_surfers_high_score_tokyo_vertical.mp4',
    fileSize: 38 * 1024 * 1024,
    duration: 62,
    durationFormatted: '01:02',
    width: 1080,
    height: 1920,
    aspectRatio: '9:16',
    aspectRatioLabel: '9:16 Vertical (Shorts)',
    category: 'Background Loop',
    game: 'Subway Surfers',
    tags: ['Category: Background Loop', 'Game: Subway Surfers', 'Vibe: Fast Paced'],
    thumbnailUrl: generateFallbackThumbnail('Subway Surfers Tokyo', '9:16'),
    videoUrl: '',
    supabaseStorageUrl: 'https://applet-gaming-vault.supabase.co/storage/v1/object/public/gaming-vault-raw-assets/subway_surfers_high_score_tokyo_vertical.mp4',
    syncedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
    uploadedAt: new Date(Date.now() - 3600000 * 6).toISOString(),
  },
  {
    id: 'vault_demo_4',
    title: 'CS2 Mirage 1v4 Clutch Deagle Headshots',
    filename: 'cs2_mirage_1v4_clutch_deagle_headshots.mp4',
    fileSize: 48 * 1024 * 1024,
    duration: 34,
    durationFormatted: '00:34',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    aspectRatioLabel: '16:9 Landscape',
    category: 'Highlight Reel',
    game: 'Counter-Strike 2',
    tags: ['Category: Highlight Reel', 'Game: CS2', 'Vibe: Sweaty', 'Hook: Close Call'],
    thumbnailUrl: generateFallbackThumbnail('CS2 Mirage Clutch', '16:9'),
    videoUrl: '',
    supabaseStorageUrl: 'https://applet-gaming-vault.supabase.co/storage/v1/object/public/gaming-vault-raw-assets/cs2_mirage_1v4_clutch_deagle_headshots.mp4',
    syncedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
    uploadedAt: new Date(Date.now() - 3600000 * 12).toISOString(),
  },
];

export function loadSavedVaultClips(): VaultClip[] {
  try {
    const raw = localStorage.getItem(VAULT_STORAGE_KEY);
    if (!raw) {
      // First visit: initialize with starter vault clips
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(DEFAULT_PREINDEXED_CLIPS));
      return DEFAULT_PREINDEXED_CLIPS;
    }
    const parsed = JSON.parse(raw);
    return parsed.length > 0 ? parsed : DEFAULT_PREINDEXED_CLIPS;
  } catch (err) {
    console.error('Failed to load saved clips from storage:', err);
    return DEFAULT_PREINDEXED_CLIPS;
  }
}

export function saveVaultClips(clips: VaultClip[]): void {
  try {
    localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(clips));
  } catch (err) {
    console.warn('Storage quota limit hit, trimming thumbnail cache:', err);
    try {
      const lightweightClips = clips.map(c => ({
        ...c,
        thumbnailUrl: c.thumbnailUrl.length > 150000 ? '' : c.thumbnailUrl,
      }));
      localStorage.setItem(VAULT_STORAGE_KEY, JSON.stringify(lightweightClips));
    } catch (e) {
      console.error('Critical failure writing to localStorage:', e);
    }
  }
}

export function loadSavedRemixes(): RemixRecipe[] {
  try {
    const raw = localStorage.getItem(REMIX_STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    return [];
  }
}

export function saveRemixRecipe(recipe: RemixRecipe): void {
  try {
    const current = loadSavedRemixes();
    const updated = [recipe, ...current.filter(r => r.id !== recipe.id)];
    localStorage.setItem(REMIX_STORAGE_KEY, JSON.stringify(updated));
  } catch (err) {
    console.error('Failed to save remix recipe:', err);
  }
}

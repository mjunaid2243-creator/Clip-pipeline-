import { AspectRatioType } from '../types';
import { generateFallbackThumbnail } from './mediaParser';

export interface RawSampleClipConfig {
  filename: string;
  game: string;
  category: string;
  aspectRatio: AspectRatioType;
  width: number;
  height: number;
  duration: number;
  sizeBytes: number;
  suggestedTags: string[];
  animationType: 'gta_stunt' | 'minecraft_parkour' | 'subway_vertical' | 'cs2_clutch' | 'rocket_aerial' | 'valorant_ace' | 'minecraft_dropper' | 'gta_mega_ramp';
}

export const SAMPLE_GAMING_BATCH: RawSampleClipConfig[] = [
  {
    filename: 'gta_v_mega_ramp_car_jump_4k.mp4',
    game: 'GTA V',
    category: 'Hook Clip',
    aspectRatio: '16:9',
    width: 3840,
    height: 2160,
    duration: 28,
    sizeBytes: 84 * 1024 * 1024,
    suggestedTags: ['Game: GTA V', 'Hook: Satisfying', 'Vibe: High Energy', 'Category: Hook Clip', 'Vehicle: Pegassi Tezeract'],
    animationType: 'gta_stunt',
  },
  {
    filename: 'minecraft_satisfying_spiral_parkour_loop_916.mp4',
    game: 'Minecraft',
    category: 'Background Loop',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    duration: 54,
    sizeBytes: 42 * 1024 * 1024,
    suggestedTags: ['Game: Minecraft', 'Category: Background Loop', 'Vibe: Hypnotic', 'Pacing: Smooth', 'Biome: Neon Neon'],
    animationType: 'minecraft_parkour',
  },
  {
    filename: 'subway_surfers_high_score_tokyo_vertical.mp4',
    game: 'Subway Surfers',
    category: 'Background Loop',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    duration: 62,
    sizeBytes: 38 * 1024 * 1024,
    suggestedTags: ['Game: Subway Surfers', 'Category: Background Loop', 'Vibe: Fast Paced', 'Pacing: Rapid'],
    animationType: 'subway_vertical',
  },
  {
    filename: 'gta_v_neon_night_city_drift_satisfying.mp4',
    game: 'GTA V',
    category: 'Background Loop',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    duration: 41,
    sizeBytes: 52 * 1024 * 1024,
    suggestedTags: ['Game: GTA V', 'Category: Background Loop', 'Vibe: Chill', 'Lighting: Neon Night', 'Hook: Satisfying'],
    animationType: 'gta_mega_ramp',
  },
  {
    filename: 'minecraft_impossible_dropper_clutch_916.mp4',
    game: 'Minecraft',
    category: 'Hook Clip',
    aspectRatio: '9:16',
    width: 1080,
    height: 1920,
    duration: 19,
    sizeBytes: 24 * 1024 * 1024,
    suggestedTags: ['Game: Minecraft', 'Category: Hook Clip', 'Hook: Close Call', 'Vibe: High Energy'],
    animationType: 'minecraft_dropper',
  },
  {
    filename: 'cs2_mirage_1v4_clutch_deagle_headshots.mp4',
    game: 'Counter-Strike 2',
    category: 'Highlight Reel',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    duration: 34,
    sizeBytes: 48 * 1024 * 1024,
    suggestedTags: ['Game: CS2', 'Category: Highlight Reel', 'Vibe: Sweaty', 'Action: Deagle 1v4'],
    animationType: 'cs2_clutch',
  },
  {
    filename: 'rocket_league_flip_reset_musty_flick_goal.mp4',
    game: 'Rocket League',
    category: 'Hook Clip',
    aspectRatio: '16:9',
    width: 2560,
    height: 1440,
    duration: 22,
    sizeBytes: 36 * 1024 * 1024,
    suggestedTags: ['Game: Rocket League', 'Category: Hook Clip', 'Hook: Satisfying', 'Skill: Musty Flick'],
    animationType: 'rocket_aerial',
  },
  {
    filename: 'valorant_ascent_retake_phantom_ace.mp4',
    game: 'Valorant',
    category: 'Gameplay Roll',
    aspectRatio: '16:9',
    width: 1920,
    height: 1080,
    duration: 38,
    sizeBytes: 56 * 1024 * 1024,
    suggestedTags: ['Game: Valorant', 'Category: Gameplay Roll', 'Vibe: High Energy', 'Agent: Jett'],
    animationType: 'valorant_ace',
  },
];

/**
 * Creates a playable File/Blob object from a sample configuration
 * using dynamic canvas frame painting + MediaRecorder so the video is 100% playable in HTML5 video tags!
 */
export async function createRealSyntheticVideoFile(config: RawSampleClipConfig): Promise<File> {
  const canvas = document.createElement('canvas');
  const isVertical = config.aspectRatio === '9:16';
  // Use compact dimensions for instant synthesis
  canvas.width = isVertical ? 360 : 640;
  canvas.height = isVertical ? 640 : 360;
  const ctx = canvas.getContext('2d')!;

  const fps = 24;
  const totalFrames = fps * 3; // 3 seconds sample loop
  const stream = canvas.captureStream(fps);

  let mimeType = 'video/webm;codecs=vp8';
  if (!MediaRecorder.isTypeSupported(mimeType)) {
    mimeType = 'video/webm';
  }

  const recorder = new MediaRecorder(stream, {
    mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
    videoBitsPerSecond: 1500000,
  });

  const chunks: Blob[] = [];
  recorder.ondataavailable = e => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  const recordingPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/mp4' });
      resolve(blob);
    };
  });

  recorder.start();

  // Render dynamic animated frames
  let frame = 0;
  const interval = setInterval(() => {
    drawSyntheticGameFrame(ctx, canvas.width, canvas.height, config.animationType, frame, config.game);
    frame++;
    if (frame >= totalFrames) {
      clearInterval(interval);
      recorder.stop();
    }
  }, 1000 / fps);

  const blob = await recordingPromise;
  return new File([blob], config.filename, { type: 'video/mp4' });
}

function drawSyntheticGameFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  type: string,
  frame: number,
  game: string
) {
  // Clear
  ctx.fillStyle = '#090d16';
  ctx.fillRect(0, 0, w, h);

  const t = frame * 0.08;

  if (type.includes('minecraft')) {
    // Voxel / Blocky 3D Perspective simulation
    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#1e3a8a');
    sky.addColorStop(0.6, '#0284c7');
    sky.addColorStop(1, '#38bdf8');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);

    // Floating Parkour platforms
    const numBlocks = 6;
    for (let i = 0; i < numBlocks; i++) {
      const progress = ((frame * 2 + i * 50) % 200) / 200;
      const bx = (w * 0.5) + Math.sin(t + i) * (w * 0.25);
      const by = h - (progress * h * 0.8) - 40;
      const bSize = Math.max(24, Math.floor(40 * (1 - progress * 0.4)));

      // Draw isometric-like voxel block
      ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#f59e0b'; // Grass/Gold
      ctx.fillRect(bx - bSize / 2, by, bSize, bSize * 0.6);
      
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(bx - bSize / 2, by + bSize * 0.6, bSize, bSize * 0.4);

      // Block grid lines
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1;
      ctx.strokeRect(bx - bSize / 2, by, bSize, bSize);
    }

    // Player crosshair in center
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 8, h / 2);
    ctx.lineTo(w / 2 + 8, h / 2);
    ctx.moveTo(w / 2, h / 2 - 8);
    ctx.lineTo(w / 2, h / 2 + 8);
    ctx.stroke();

    // Hotbar HUD at bottom
    ctx.fillStyle = 'rgba(15, 23, 42, 0.7)';
    ctx.fillRect(w * 0.15, h - 35, w * 0.7, 24);
    for (let s = 0; s < 9; s++) {
      ctx.strokeStyle = s === 3 ? '#38bdf8' : 'rgba(255,255,255,0.2)';
      ctx.strokeRect(w * 0.15 + s * (w * 0.7 / 9), h - 35, (w * 0.7 / 9), 24);
    }

  } else if (type.includes('gta')) {
    // GTA V Neon Mega Ramp / Car Jump Simulation
    // Sunset horizon
    const sky = ctx.createLinearGradient(0, 0, 0, h * 0.7);
    sky.addColorStop(0, '#311042');
    sky.addColorStop(0.5, '#7c1d6f');
    sky.addColorStop(1, '#f97316');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h * 0.7);

    // Neon mega ramp road perspective
    ctx.fillStyle = '#0f172a';
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.35);
    ctx.lineTo(w * 0.55, h * 0.35);
    ctx.lineTo(w * 0.9, h);
    ctx.lineTo(w * 0.1, h);
    ctx.closePath();
    ctx.fill();

    // Neon edge barriers
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(w * 0.45, h * 0.35);
    ctx.lineTo(w * 0.1, h);
    ctx.moveTo(w * 0.55, h * 0.35);
    ctx.lineTo(w * 0.9, h);
    ctx.stroke();

    // Dash markers racing towards camera
    ctx.fillStyle = '#fde047';
    for (let i = 0; i < 5; i++) {
      const p = ((frame * 3 + i * 40) % 150) / 150;
      const y = h * 0.35 + p * (h * 0.65);
      const sw = 4 + p * 16;
      ctx.fillRect(w * 0.5 - sw / 2, y, sw, 8 + p * 14);
    }

    // Car silhouette in air / on ramp
    const carX = w * 0.5 + Math.sin(t * 1.5) * 30;
    const carY = h * 0.65 - Math.abs(Math.sin(t * 2)) * 40;
    ctx.fillStyle = '#ef4444'; // Red supercar
    ctx.beginPath();
    ctx.roundRect(carX - 32, carY - 14, 64, 28, 6);
    ctx.fill();

    // Glowing taillights
    ctx.fillStyle = '#ff2222';
    ctx.shadowColor = '#ff2222';
    ctx.shadowBlur = 12;
    ctx.fillRect(carX - 26, carY + 4, 10, 6);
    ctx.fillRect(carX + 16, carY + 4, 10, 6);
    ctx.shadowBlur = 0;

  } else if (type.includes('subway')) {
    // Subway Surfers 3-lane vertical runner
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(0, 0, w, h);

    // 3 Tracks perspective
    const laneWidth = w / 3;
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(laneWidth, 0);
    ctx.lineTo(laneWidth, h);
    ctx.moveTo(laneWidth * 2, 0);
    ctx.lineTo(laneWidth * 2, h);
    ctx.stroke();

    // Gold coins floating down
    for (let i = 0; i < 4; i++) {
      const cy = ((frame * 6 + i * 110) % h);
      ctx.fillStyle = '#eab308';
      ctx.beginPath();
      ctx.arc(laneWidth * 1.5, cy, 14, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#fef08a';
      ctx.stroke();
    }

    // Runner character
    const runnerX = laneWidth * (0.5 + Math.floor(Math.sin(t) + 1));
    ctx.fillStyle = '#3b82f6';
    ctx.beginPath();
    ctx.arc(runnerX, h - 80, 18, 0, Math.PI * 2);
    ctx.fill();

  } else {
    // Competitive Shooter / Rocket League hud
    ctx.fillStyle = '#0b0f19';
    ctx.fillRect(0, 0, w, h);

    // Dynamic HUD circle
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(w / 2, h / 2, 40 + Math.sin(t * 3) * 6, 0, Math.PI * 2);
    ctx.stroke();

    // Floating game target
    const tx = w / 2 + Math.cos(t * 2) * (w * 0.3);
    const ty = h / 2 + Math.sin(t * 2) * (h * 0.2);
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(tx, ty, 12, 0, Math.PI * 2);
    ctx.fill();
  }

  // Watermark text in bottom corner
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
  ctx.font = '600 12px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(`${game} RAW CAPTURE`, 14, 24);

  // Timecode
  ctx.fillStyle = 'rgba(6, 182, 212, 0.9)';
  ctx.font = '500 11px "JetBrains Mono", monospace';
  const sec = Math.floor(frame / 24);
  const ms = Math.floor((frame % 24) * 4.16);
  ctx.fillText(`00:0${sec}.${ms < 10 ? '0' + ms : ms}`, w - 75, 24);
}

import { AspectRatioType, LocalParsedClip } from '../types';

export function formatDuration(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  const formattedMins = mins < 10 ? `0${mins}` : `${mins}`;
  const formattedSecs = secs < 10 ? `0${secs}` : `${secs}`;
  return `${formattedMins}:${formattedSecs}`;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function detectAspectRatio(width: number, height: number): {
  type: AspectRatioType;
  label: string;
} {
  if (!width || !height) {
    return { type: '16:9', label: '16:9 Landscape' };
  }

  const ratio = width / height;

  // 9:16 is ~0.5625
  if (ratio <= 0.7) {
    return { type: '9:16', label: '9:16 Vertical (Shorts/TikTok)' };
  }
  // 1:1 is ~1.0
  if (ratio >= 0.9 && ratio <= 1.1) {
    return { type: '1:1', label: '1:1 Square' };
  }
  // 16:9 is ~1.778
  if (ratio >= 1.5 && ratio <= 1.9) {
    return { type: '16:9', label: '16:9 Landscape (YouTube/Twitch)' };
  }
  // 21:9 is ~2.333
  if (ratio > 1.9) {
    return { type: '21:9', label: '21:9 Ultrawide' };
  }

  return {
    type: ratio < 1 ? '9:16' : '16:9',
    label: `${width}×${height} (${ratio < 1 ? 'Vertical' : 'Landscape'})`,
  };
}

export function cleanFilenameToTitle(filename: string): string {
  // Strip extension
  const withoutExt = filename.replace(/\.[^/.]+$/, '');
  // Replace underscores, hyphens, dots with spaces
  const withSpaces = withoutExt.replace(/[_\-.]+/g, ' ');
  // Capitalize words
  return withSpaces
    .split(' ')
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');
}

export function inferGameAndTags(filename: string): {
  game: string;
  category: string;
  tags: string[];
} {
  const lower = filename.toLowerCase();
  let game = 'General Gaming';
  let category = 'Background Loop';
  const tags: string[] = [];

  if (lower.includes('gta') || lower.includes('grand theft auto')) {
    game = 'GTA V';
    tags.push('Game: GTA V');
  } else if (lower.includes('mine') || lower.includes('parkour') || lower.includes('craft')) {
    game = 'Minecraft';
    tags.push('Game: Minecraft');
  } else if (lower.includes('subway') || lower.includes('surfer')) {
    game = 'Subway Surfers';
    tags.push('Game: Subway Surfers');
  } else if (lower.includes('cs') || lower.includes('counter') || lower.includes('cs2')) {
    game = 'Counter-Strike 2';
    tags.push('Game: CS2');
  } else if (lower.includes('val') || lower.includes('valorant')) {
    game = 'Valorant';
    tags.push('Game: Valorant');
  } else if (lower.includes('rocket') || lower.includes('league')) {
    game = 'Rocket League';
    tags.push('Game: Rocket League');
  } else if (lower.includes('elden') || lower.includes('ring') || lower.includes('souls')) {
    game = 'Elden Ring';
    tags.push('Game: Elden Ring');
  } else {
    tags.push(`Game: ${game}`);
  }

  // Detect category & vibes
  if (lower.includes('loop') || lower.includes('bg') || lower.includes('background') || lower.includes('parkour')) {
    category = 'Background Loop';
    tags.push('Category: Background Loop');
  } else if (lower.includes('jump') || lower.includes('stunt') || lower.includes('satisfying') || lower.includes('hook')) {
    category = 'Hook Clip';
    tags.push('Category: Hook Clip');
    tags.push('Hook: Satisfying');
  } else {
    tags.push(`Category: ${category}`);
  }

  if (lower.includes('high') || lower.includes('energy') || lower.includes('clutch') || lower.includes('jump')) {
    tags.push('Vibe: High Energy');
  } else {
    tags.push('Vibe: Hypnotic');
  }

  return { game, category, tags: Array.from(new Set(tags)) };
}

/**
 * Client-side File API processing:
 * 1. Creates object URL
 * 2. Mounts offscreen video
 * 3. Reads duration and native dimensions
 * 4. Detects 9:16 vs 16:9
 * 5. Seeks to target timestamp and paints canvas to extract visual thumbnail
 */
export async function parseVideoFile(file: File): Promise<LocalParsedClip> {
  return new Promise((resolve, reject) => {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    // Timeout safety
    const timeoutId = setTimeout(() => {
      cleanup();
      // If video metadata times out, fallback to basic estimation
      const { game, category, tags } = inferGameAndTags(file.name);
      resolve({
        id: 'clip_' + Math.random().toString(36).substring(2, 9),
        file,
        filename: file.name,
        fileSize: file.size,
        width: 1920,
        height: 1080,
        duration: 35,
        durationFormatted: '00:35',
        aspectRatio: '16:9',
        aspectRatioLabel: '16:9 Landscape',
        thumbnailUrl: generateFallbackThumbnail(file.name, '16:9'),
        videoUrl,
        title: cleanFilenameToTitle(file.name),
        category,
        game,
        tags,
      });
    }, 8000);

    const cleanup = () => {
      clearTimeout(timeoutId);
      video.removeEventListener('loadedmetadata', onLoadedMetadata);
      video.removeEventListener('seeked', onSeeked);
      video.removeEventListener('error', onError);
    };

    const onError = () => {
      cleanup();
      const { game, category, tags } = inferGameAndTags(file.name);
      resolve({
        id: 'clip_' + Math.random().toString(36).substring(2, 9),
        file,
        filename: file.name,
        fileSize: file.size,
        width: 1080,
        height: 1920,
        duration: 45,
        durationFormatted: '00:45',
        aspectRatio: '9:16',
        aspectRatioLabel: '9:16 Vertical (Shorts)',
        thumbnailUrl: generateFallbackThumbnail(file.name, '9:16'),
        videoUrl,
        title: cleanFilenameToTitle(file.name),
        category,
        game,
        tags,
      });
    };

    const onLoadedMetadata = () => {
      const width = video.videoWidth || 1920;
      const height = video.videoHeight || 1080;
      const duration = isFinite(video.duration) && video.duration > 0 ? video.duration : 30;
      
      // Target thumbnail timestamp: 1.2s or 15% into the video
      const targetTime = Math.min(Math.max(duration * 0.15, 0.8), duration > 2 ? duration - 0.5 : 0.1);
      
      video.currentTime = targetTime;
    };

    const onSeeked = () => {
      try {
        const width = video.videoWidth || 1920;
        const height = video.videoHeight || 1080;
        const duration = isFinite(video.duration) ? video.duration : 30;
        const { type: aspectRatio, label: aspectRatioLabel } = detectAspectRatio(width, height);

        // Canvas for thumbnail generation
        const canvas = document.createElement('canvas');
        // Max dimension 480px for crisp, lightweight base64 thumbnail
        const maxDim = 480;
        let cWidth = width;
        let cHeight = height;
        if (width >= height) {
          if (width > maxDim) {
            cWidth = maxDim;
            cHeight = Math.round((height / width) * maxDim);
          }
        } else {
          if (height > maxDim) {
            cHeight = maxDim;
            cWidth = Math.round((width / height) * maxDim);
          }
        }

        canvas.width = cWidth;
        canvas.height = cHeight;
        const ctx = canvas.getContext('2d');

        let thumbnailUrl = '';
        if (ctx) {
          ctx.drawImage(video, 0, 0, cWidth, cHeight);
          thumbnailUrl = canvas.toDataURL('image/jpeg', 0.85);
        } else {
          thumbnailUrl = generateFallbackThumbnail(file.name, aspectRatio);
        }

        cleanup();

        const { game, category, tags } = inferGameAndTags(file.name);
        resolve({
          id: 'clip_' + Math.random().toString(36).substring(2, 9),
          file,
          filename: file.name,
          fileSize: file.size,
          width,
          height,
          duration: Math.round(duration),
          durationFormatted: formatDuration(duration),
          aspectRatio,
          aspectRatioLabel,
          thumbnailUrl,
          videoUrl,
          title: cleanFilenameToTitle(file.name),
          category,
          game,
          tags,
        });
      } catch (err) {
        cleanup();
        const { game, category, tags } = inferGameAndTags(file.name);
        resolve({
          id: 'clip_' + Math.random().toString(36).substring(2, 9),
          file,
          filename: file.name,
          fileSize: file.size,
          width: video.videoWidth || 1920,
          height: video.videoHeight || 1080,
          duration: Math.round(video.duration || 30),
          durationFormatted: formatDuration(video.duration || 30),
          aspectRatio: '16:9',
          aspectRatioLabel: '16:9 Landscape',
          thumbnailUrl: generateFallbackThumbnail(file.name, '16:9'),
          videoUrl,
          title: cleanFilenameToTitle(file.name),
          category,
          game,
          tags,
        });
      }
    };

    video.addEventListener('loadedmetadata', onLoadedMetadata);
    video.addEventListener('seeked', onSeeked);
    video.addEventListener('error', onError);
    video.src = videoUrl;
  });
}

/**
 * Creates high-aesthetic synthetic gaming thumbnail for clips
 */
export function generateFallbackThumbnail(title: string, aspect: AspectRatioType): string {
  const canvas = document.createElement('canvas');
  const isVertical = aspect === '9:16';
  canvas.width = isVertical ? 270 : 480;
  canvas.height = isVertical ? 480 : 270;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Dark slate backdrop with subtle gamer gradient
  const grad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  if (title.toLowerCase().includes('minecraft')) {
    grad.addColorStop(0, '#0f2027');
    grad.addColorStop(0.5, '#203a43');
    grad.addColorStop(1, '#2c5364');
  } else if (title.toLowerCase().includes('gta')) {
    grad.addColorStop(0, '#1a0b2e');
    grad.addColorStop(0.5, '#2e1c4a');
    grad.addColorStop(1, '#111827');
  } else {
    grad.addColorStop(0, '#0b0f19');
    grad.addColorStop(0.5, '#1e293b');
    grad.addColorStop(1, '#0f172a');
  }
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Subtle grid lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
  ctx.lineWidth = 1;
  const step = 30;
  for (let x = 0; x < canvas.width; x += step) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += step) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Center gaming emblem / frame
  ctx.fillStyle = 'rgba(6, 182, 212, 0.15)';
  ctx.strokeStyle = 'rgba(6, 182, 212, 0.6)';
  ctx.lineWidth = 2;
  const boxW = canvas.width * 0.7;
  const boxH = canvas.height * 0.4;
  const boxX = (canvas.width - boxW) / 2;
  const boxY = (canvas.height - boxH) / 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);
  ctx.fillRect(boxX, boxY, boxW, boxH);

  // Text title
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 16px "Plus Jakarta Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const cleanTitle = cleanFilenameToTitle(title);
  ctx.fillText(cleanTitle.slice(0, 24), canvas.width / 2, canvas.height / 2 - 10);

  // Aspect badge
  ctx.fillStyle = '#06b6d4';
  ctx.font = '600 12px "JetBrains Mono", monospace';
  ctx.fillText(aspect === '9:16' ? '9:16 VERTICAL' : '16:9 LANDSCAPE', canvas.width / 2, canvas.height / 2 + 16);

  return canvas.toDataURL('image/jpeg', 0.85);
}

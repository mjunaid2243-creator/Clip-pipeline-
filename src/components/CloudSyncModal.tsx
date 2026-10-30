import React, { useEffect, useState } from 'react';
import { LocalParsedClip, UploadProgress, VaultClip } from '../types';
import { formatBytes } from '../utils/mediaParser';
import {
  CloudUpload,
  Database,
  CheckCircle2,
  HardDrive,
  Activity,
  Layers,
  ArrowRight,
} from 'lucide-react';

interface CloudSyncModalProps {
  clipsToUpload: LocalParsedClip[];
  isOpen: boolean;
  onSyncComplete: (syncedClips: VaultClip[]) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  clipsToUpload,
  isOpen,
  onSyncComplete,
}) => {
  const [progresses, setProgresses] = useState<UploadProgress[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);

  useEffect(() => {
    if (!isOpen || clipsToUpload.length === 0) return;

    // Initialize progress items
    const initial: UploadProgress[] = clipsToUpload.map(c => ({
      clipId: c.id,
      progress: 0,
      bytesUploaded: 0,
      totalBytes: c.fileSize,
      speed: '14.2 MB/s',
      status: 'queued',
      supabaseStorageUrl: `https://applet-gaming-vault.supabase.co/storage/v1/object/public/gaming-vault-raw-assets/${c.filename}`,
    }));

    setProgresses(initial);
    setIsCompleted(false);
    setLogs([
      `[INIT] Handshake with Supabase Cloud Storage bucket 'gaming-vault-raw-assets'`,
      `[INIT] Connected to PostgreSQL schema 'public.vault_clips'`,
      `[QUEUE] Scheduled ${clipsToUpload.length} raw gameplay assets for concurrent ingestion`,
    ]);

    // Simulate multi-stream upload with real speed intervals
    let completedCount = 0;
    const finalClips: VaultClip[] = [];

    clipsToUpload.forEach((clip, index) => {
      const delay = index * 250; // stagger start slightly
      setTimeout(() => {
        let currentProgress = 0;
        const totalBytes = clip.fileSize;
        const speedMbps = (12 + Math.random() * 8).toFixed(1);

        setLogs(prev => [
          ...prev.slice(-10),
          `[STORAGE] Uploading '${clip.filename}' (${formatBytes(totalBytes)}) at ${speedMbps} MB/s...`,
        ]);

        const interval = setInterval(() => {
          // Increment progress realistically
          currentProgress += 12 + Math.random() * 15;

          if (currentProgress >= 100) {
            currentProgress = 100;
            clearInterval(interval);

            // Set to writing DB
            setProgresses(prev =>
              prev.map(p =>
                p.clipId === clip.id
                  ? {
                      ...p,
                      progress: 100,
                      bytesUploaded: totalBytes,
                      status: 'writing_db',
                    }
                  : p
              )
            );

            setLogs(prev => [
              ...prev.slice(-10),
              `[POSTGRES] INSERT INTO public.vault_clips (title, tags, aspect_ratio, duration) VALUES ('${clip.title}', ARRAY${JSON.stringify(clip.tags)}, '${clip.aspectRatio}', ${clip.duration})`,
            ]);

            setTimeout(() => {
              setProgresses(prev =>
                prev.map(p =>
                  p.clipId === clip.id ? { ...p, status: 'completed' } : p
                )
              );

              completedCount++;
              finalClips.push({
                id: clip.id,
                title: clip.title,
                filename: clip.filename,
                fileSize: clip.fileSize,
                duration: clip.duration,
                durationFormatted: clip.durationFormatted,
                width: clip.width,
                height: clip.height,
                aspectRatio: clip.aspectRatio,
                aspectRatioLabel: clip.aspectRatioLabel,
                category: clip.category,
                game: clip.game,
                tags: clip.tags,
                thumbnailUrl: clip.thumbnailUrl,
                videoUrl: clip.videoUrl,
                supabaseStorageUrl: `https://applet-gaming-vault.supabase.co/storage/v1/object/public/gaming-vault-raw-assets/${clip.filename}`,
                syncedAt: new Date().toISOString(),
                uploadedAt: new Date().toISOString(),
              });

              if (completedCount === clipsToUpload.length) {
                setIsCompleted(true);
                setLogs(prev => [
                  ...prev.slice(-10),
                  `[SUCCESS] All ${clipsToUpload.length} clips synced to Supabase Cloud Storage & PostgreSQL database!`,
                ]);
              }
            }, 350);
          } else {
            const bytesNow = Math.round((currentProgress / 100) * totalBytes);
            setProgresses(prev =>
              prev.map(p =>
                p.clipId === clip.id
                  ? {
                      ...p,
                      progress: Math.round(currentProgress),
                      bytesUploaded: bytesNow,
                      status: currentProgress > 80 ? 'syncing_bucket' : 'uploading',
                    }
                  : p
              )
            );
          }
        }, 150);
      }, delay);
    });
  }, [isOpen, clipsToUpload]);

  if (!isOpen) return null;

  const totalBytes = clipsToUpload.reduce((a, b) => a + b.fileSize, 0);
  const uploadedBytes = progresses.reduce((a, b) => a + b.bytesUploaded, 0);
  const overallPercent = totalBytes > 0 ? Math.round((uploadedBytes / totalBytes) * 100) : 0;
  const completedCount = progresses.filter(p => p.status === 'completed').length;

  const handleFinish = () => {
    // Construct final clips
    const result: VaultClip[] = clipsToUpload.map(clip => ({
      id: clip.id,
      title: clip.title,
      filename: clip.filename,
      fileSize: clip.fileSize,
      duration: clip.duration,
      durationFormatted: clip.durationFormatted,
      width: clip.width,
      height: clip.height,
      aspectRatio: clip.aspectRatio,
      aspectRatioLabel: clip.aspectRatioLabel,
      category: clip.category,
      game: clip.game,
      tags: clip.tags,
      thumbnailUrl: clip.thumbnailUrl,
      videoUrl: clip.videoUrl,
      supabaseStorageUrl: `https://applet-gaming-vault.supabase.co/storage/v1/object/public/gaming-vault-raw-assets/${clip.filename}`,
      syncedAt: new Date().toISOString(),
      uploadedAt: new Date().toISOString(),
    }));
    onSyncComplete(result);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4">
      <div className="w-full max-w-3xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              {isCompleted ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <CloudUpload className="w-5 h-5 animate-pulse" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">
                {isCompleted ? 'Cloud Sync & Database Write Complete' : 'Syncing to Supabase Cloud Storage'}
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Bucket: <span className="text-slate-300">gaming-vault-raw-assets</span> · DB: <span className="text-cyan-400">PostgreSQL (vault_clips)</span>
              </p>
            </div>
          </div>

          <div className="text-right font-mono text-xs">
            <div className="text-cyan-400 font-bold">{overallPercent}% Complete</div>
            <div className="text-slate-500 text-[11px]">
              {completedCount} / {clipsToUpload.length} Synced
            </div>
          </div>
        </div>

        {/* Global Progress Bar */}
        <div className="w-full bg-slate-950 h-2">
          <div
            className={`h-full transition-all duration-200 ${
              isCompleted
                ? 'bg-gradient-to-r from-emerald-500 to-cyan-400'
                : 'bg-gradient-to-r from-cyan-500 via-blue-500 to-indigo-500'
            }`}
            style={{ width: `${overallPercent}%` }}
          />
        </div>

        {/* Progress List */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3 min-h-0">
          {clipsToUpload.map(clip => {
            const prog = progresses.find(p => p.clipId === clip.id);
            const status = prog?.status || 'queued';
            const percent = prog?.progress || 0;

            return (
              <div
                key={clip.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 hover:border-slate-700/80 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-8 rounded bg-slate-900 border border-slate-800 overflow-hidden shrink-0">
                      {clip.thumbnailUrl && (
                        <img
                          src={clip.thumbnailUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-slate-200 truncate">
                        {clip.title}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                        <span>{clip.filename}</span>
                        <span>·</span>
                        <span>{formatBytes(clip.fileSize)}</span>
                        <span>·</span>
                        <span className="text-cyan-400">{clip.aspectRatioLabel}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded ${
                        status === 'completed'
                          ? 'text-emerald-400 bg-emerald-950/60 border border-emerald-500/30'
                          : status === 'writing_db'
                          ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-500/30'
                          : 'text-slate-400 bg-slate-900'
                      }`}
                    >
                      {status === 'completed'
                        ? 'Synced ✓'
                        : status === 'writing_db'
                        ? 'Writing SQL...'
                        : status === 'syncing_bucket'
                        ? 'Cloud Bucket Sync...'
                        : `${percent}%`}
                    </span>
                  </div>
                </div>

                {/* Progress Bar for this file */}
                <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      status === 'completed'
                        ? 'bg-emerald-500'
                        : 'bg-gradient-to-r from-cyan-400 to-blue-500'
                    }`}
                    style={{ width: `${percent}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Telemetry Log Terminal */}
        <div className="px-6 py-3 bg-slate-950 border-t border-slate-800/80 font-mono text-[11px] text-slate-400 shrink-0">
          <div className="flex items-center gap-2 text-slate-500 mb-1.5 font-semibold uppercase tracking-wider text-[10px]">
            <Activity className="w-3.5 h-3.5 text-cyan-400" />
            <span>Supabase & PostgreSQL Ingestion Pipeline</span>
          </div>
          <div className="h-16 overflow-y-auto space-y-0.5 text-slate-400 selection:bg-cyan-500/20">
            {logs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('[SUCCESS]')
                    ? 'text-emerald-400 font-semibold'
                    : log.includes('[POSTGRES]')
                    ? 'text-cyan-300'
                    : 'text-slate-400'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-900 border-t border-slate-800 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-400 font-mono">
            {isCompleted ? (
              <span className="text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                All assets indexed & ready in Vault!
              </span>
            ) : (
              <span>Uploading multi-part objects to Supabase S3 bucket...</span>
            )}
          </div>

          <button
            type="button"
            disabled={!isCompleted}
            onClick={handleFinish}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-xs font-semibold transition-all ${
              isCompleted
                ? 'bg-gradient-to-r from-cyan-400 to-cyan-300 hover:from-cyan-300 hover:to-cyan-200 text-slate-950 shadow-lg shadow-cyan-500/25 hover:scale-[1.02] active:scale-[0.98]'
                : 'bg-slate-800 text-slate-500 cursor-not-allowed'
            }`}
          >
            <span>Open Asset Vault Gallery</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

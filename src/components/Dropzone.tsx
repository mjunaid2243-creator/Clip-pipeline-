import React, { useState, useRef } from 'react';
import { Upload, Film, Sparkles, FolderUp, CheckCircle2, ShieldCheck, Zap } from 'lucide-react';
import { SAMPLE_GAMING_BATCH, createRealSyntheticVideoFile } from '../utils/sampleClips';

interface DropzoneProps {
  onFilesSelected: (files: File[]) => void;
  isProcessing?: boolean;
}

export const Dropzone: React.FC<DropzoneProps> = ({ onFilesSelected, isProcessing = false }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isGeneratingSamples, setIsGeneratingSamples] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files).filter(
        file => file.type.startsWith('video/') || /\.(mp4|webm|mov|mkv)$/i.test(file.name)
      );

      if (filesArray.length > 0) {
        onFilesSelected(filesArray);
      } else {
        alert('Please drop video files (.mp4, .webm, .mov)');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      // Reset input value so re-selecting same files triggers change
      e.target.value = '';
    }
  };

  const handleLoadSampleBatch = async () => {
    setIsGeneratingSamples(true);
    try {
      // Generate real playable files for the 8 clips in the sample pack
      const files: File[] = [];
      for (const config of SAMPLE_GAMING_BATCH) {
        const file = await createRealSyntheticVideoFile(config);
        files.push(file);
      }
      onFilesSelected(files);
    } catch (err) {
      console.error('Error generating sample batch:', err);
    } finally {
      setIsGeneratingSamples(false);
    }
  };

  return (
    <div className="w-full">
      {/* Dashed Border Dropzone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative group cursor-pointer rounded-2xl border-2 border-dashed transition-all duration-200 p-8 sm:p-12 text-center flex flex-col items-center justify-center ${
          isDragOver
            ? 'border-cyan-400 bg-cyan-950/20 shadow-2xl shadow-cyan-500/10 scale-[1.005]'
            : 'border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/70 shadow-inner'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="video/mp4,video/webm,video/quicktime,video/x-matroska,.mp4,.webm,.mov"
          className="hidden"
          onChange={handleFileInputChange}
          disabled={isProcessing || isGeneratingSamples}
        />

        {/* Upload Visual Icon */}
        <div className="relative mb-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-b from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center shadow-lg group-hover:scale-105 group-hover:border-cyan-500/50 transition-all">
            <Upload className="w-7 h-7 text-cyan-400 group-hover:text-cyan-300 transition-colors" />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-cyan-500 flex items-center justify-center border-2 border-slate-900 shadow">
            <Film className="w-3.5 h-3.5 text-slate-950" />
          </div>
        </div>

        {/* Primary Headline & Instructions */}
        <h3 className="text-lg sm:text-xl font-bold text-white mb-2">
          Drop Raw Gaming Clips Here
        </h3>
        <p className="text-sm text-slate-400 max-w-lg mb-6 leading-relaxed">
          Drag and drop a batch of 5 to 10 raw clips (e.g. GTA V stunts, Minecraft parkour, Subway Surfers)
          from your local folder directly into the vault.
        </p>

        {/* Action Buttons inside Dropzone */}
        <div className="flex flex-wrap items-center justify-center gap-3" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing || isGeneratingSamples}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 shadow-sm transition-all hover:scale-[1.02]"
          >
            <FolderUp className="w-4 h-4 text-cyan-400" />
            <span>Browse Local Files</span>
          </button>

          <button
            type="button"
            onClick={handleLoadSampleBatch}
            disabled={isProcessing || isGeneratingSamples}
            className="flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-4 h-4 text-cyan-300 animate-pulse" />
            <span>
              {isGeneratingSamples ? 'Generating Sample Batch...' : 'Load Sample Gaming Batch (8 Clips)'}
            </span>
          </button>
        </div>

        <div className="mt-6 flex items-center gap-3 text-xs text-slate-500 font-mono">
          <span>Supported: .MP4 · .WEBM · .MOV</span>
          <span>·</span>
          <span>Max 2GB / batch</span>
          <span>·</span>
          <span>Client-Side Parsing</span>
        </div>
      </div>

      {/* Feature Value Props strip below dropzone */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/80 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-800/80 text-cyan-400 shrink-0">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200 mb-0.5">Instant File API Extraction</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Detects 16:9 Landscape vs 9:16 Vertical (Shorts/TikTok), extracts duration & paints canvas thumbnails.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/80 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-800/80 text-amber-400 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200 mb-0.5">Bulk & Individual Tagging</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Tag entire batches in 1 click (e.g. "Category: Background Loop") then customize game, vibe, and hook metadata.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/80 flex items-start gap-3">
          <div className="p-2 rounded-lg bg-slate-800/80 text-emerald-400 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-semibold text-slate-200 mb-0.5">Supabase Storage & PostgreSQL</h4>
            <p className="text-xs text-slate-400 leading-normal">
              Concurrent chunked upload with progress bars, pushing directly to cloud buckets and relational database.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

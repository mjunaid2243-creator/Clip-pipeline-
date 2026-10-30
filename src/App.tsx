import React, { useState, useEffect } from 'react';
import { VaultClip, LocalParsedClip } from './types';
import { parseVideoFile } from './utils/mediaParser';
import { loadSavedVaultClips, saveVaultClips } from './utils/storage';
import { Header } from './components/Header';
import { Dropzone } from './components/Dropzone';
import { LocalParsingBanner } from './components/LocalParsingBanner';
import { TaggingModal } from './components/TaggingModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { AssetVault } from './components/AssetVault';
import { RemixBuilder } from './components/RemixBuilder';
import { ClipPlayerModal } from './components/ClipPlayerModal';
import { Film, Upload, Sparkles, CheckCircle2 } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'vault' | 'remix'>('vault');
  const [vaultClips, setVaultClips] = useState<VaultClip[]>([]);
  
  // Modals & Ingestion Flow State
  const [showUploadDropzone, setShowUploadDropzone] = useState(false);
  const [isParsingFiles, setIsParsingFiles] = useState(false);
  const [parsingProgress, setParsingProgress] = useState({
    total: 0,
    completed: 0,
    currentFileName: '',
  });

  const [parsedBatch, setParsedBatch] = useState<LocalParsedClip[]>([]);
  const [isTaggingModalOpen, setIsTaggingModalOpen] = useState(false);

  const [clipsToSync, setClipsToSync] = useState<LocalParsedClip[]>([]);
  const [isCloudSyncModalOpen, setIsCloudSyncModalOpen] = useState(false);

  // Preview & Remix selection
  const [previewingClip, setPreviewingClip] = useState<VaultClip | null>(null);
  const [selectedRemixClip, setSelectedRemixClip] = useState<VaultClip | null>(null);
  const [notification, setNotification] = useState<string | null>(null);

  // Load persisted clips on mount
  useEffect(() => {
    const saved = loadSavedVaultClips();
    setVaultClips(saved);
  }, []);

  // Show temporary toast notification
  const notify = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  /**
   * Step 1 -> Step 2:
   * Files dropped or selected -> Process via browser File API
   */
  const handleFilesSelected = async (files: File[]) => {
    if (files.length === 0) return;

    setShowUploadDropzone(false);
    setIsParsingFiles(true);
    setParsingProgress({
      total: files.length,
      completed: 0,
      currentFileName: files[0].name,
    });

    const parsedResults: LocalParsedClip[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setParsingProgress({
        total: files.length,
        completed: i,
        currentFileName: file.name,
      });

      try {
        const parsed = await parseVideoFile(file);
        parsedResults.push(parsed);
      } catch (err) {
        console.error('Error parsing file:', file.name, err);
      }
    }

    setIsParsingFiles(false);

    if (parsedResults.length > 0) {
      setParsedBatch(parsedResults);
      setIsTaggingModalOpen(true); // Open Step 3 Tagging Modal
      notify(`Parsed ${parsedResults.length} clips with File API! Opening tagging modal.`);
    }
  };

  /**
   * Step 3 -> Step 4:
   * User configured bulk & individual tags in modal, clicked "Save & Upload"
   */
  const handleProceedToUpload = (updatedClips: LocalParsedClip[]) => {
    setIsTaggingModalOpen(false);
    setClipsToSync(updatedClips);
    setIsCloudSyncModalOpen(true); // Open Step 4 Cloud Sync Modal
  };

  /**
   * Step 4 -> Step 5:
   * All files pushed to Supabase Cloud Storage & PostgreSQL write complete
   */
  const handleSyncComplete = (newSyncedClips: VaultClip[]) => {
    setIsCloudSyncModalOpen(false);

    // Merge into vault clips
    setVaultClips(prev => {
      const updated = [...newSyncedClips, ...prev];
      saveVaultClips(updated);
      return updated;
    });

    // Make sure we are on Asset Vault view to see the new clips immediately
    setActiveTab('vault');
    notify(`✓ Synced ${newSyncedClips.length} clips to Supabase Cloud Storage & PostgreSQL!`);
  };

  // Delete clip from vault
  const handleDeleteClip = (clipId: string) => {
    setVaultClips(prev => {
      const updated = prev.filter(c => c.id !== clipId);
      saveVaultClips(updated);
      return updated;
    });
    notify('Asset removed from Vault.');
  };

  // Send clip to remix
  const handleSendToRemix = (clip: VaultClip) => {
    setSelectedRemixClip(clip);
    setActiveTab('remix');
    notify(`Loaded "${clip.title}" into Remix Recipe Builder.`);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-cyan-500/40 text-cyan-200 text-xs font-semibold shadow-2xl animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenUpload={() => setShowUploadDropzone(true)}
        vaultCount={vaultClips.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Dropzone View (Always shown if vault is empty or if user clicked "Upload Clips") */}
        {(showUploadDropzone || vaultClips.length === 0) && (
          <section className="relative">
            {vaultClips.length > 0 && (
              <div className="flex justify-between items-center mb-3">
                <span className="text-xs font-mono text-slate-400">Step 1: Raw Asset Ingestion</span>
                <button
                  onClick={() => setShowUploadDropzone(false)}
                  className="text-xs text-slate-500 hover:text-slate-300 underline"
                >
                  Hide Dropzone
                </button>
              </div>
            )}
            <Dropzone
              onFilesSelected={handleFilesSelected}
              isProcessing={isParsingFiles}
            />
          </section>
        )}

        {/* Tab Content: Vault Gallery vs Remix Studio */}
        {activeTab === 'vault' ? (
          <section className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-800/80">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                  Asset Vault
                </h1>
                <p className="text-xs text-slate-400 mt-1">
                  Cloud storage repository for raw gameplay captures, categorized by aspect ratio, tags, and game.
                </p>
              </div>

              {!showUploadDropzone && vaultClips.length > 0 && (
                <button
                  onClick={() => setShowUploadDropzone(true)}
                  className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 transition-colors self-start sm:self-auto"
                >
                  <Upload className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Show Dropzone</span>
                </button>
              )}
            </div>

            <AssetVault
              clips={vaultClips}
              onOpenUpload={() => setShowUploadDropzone(true)}
              onPreviewClip={clip => setPreviewingClip(clip)}
              onSendToRemix={handleSendToRemix}
              onDeleteClip={handleDeleteClip}
            />
          </section>
        ) : (
          <section>
            <RemixBuilder
              vaultClips={vaultClips}
              initialSelectedClip={selectedRemixClip}
              onOpenUpload={() => {
                setShowUploadDropzone(true);
                setActiveTab('vault');
              }}
            />
          </section>
        )}
      </main>

      {/* Step 2: Client-side Parsing Banner / Overlay */}
      {isParsingFiles && (
        <LocalParsingBanner
          totalFiles={parsingProgress.total}
          completedFiles={parsingProgress.completed}
          currentFileName={parsingProgress.currentFileName}
        />
      )}

      {/* Step 3: Tagging Modal */}
      {isTaggingModalOpen && (
        <TaggingModal
          clips={parsedBatch}
          isOpen={isTaggingModalOpen}
          onClose={() => setIsTaggingModalOpen(false)}
          onProceedToUpload={handleProceedToUpload}
        />
      )}

      {/* Step 4: Supabase Cloud Sync Modal */}
      {isCloudSyncModalOpen && (
        <CloudSyncModal
          clipsToUpload={clipsToSync}
          isOpen={isCloudSyncModalOpen}
          onSyncComplete={handleSyncComplete}
        />
      )}

      {/* Clip Fullscreen Preview Modal */}
      {previewingClip && (
        <ClipPlayerModal
          clip={previewingClip}
          isOpen={!!previewingClip}
          onClose={() => setPreviewingClip(null)}
          onSendToRemix={handleSendToRemix}
        />
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-5 text-center text-xs text-slate-600 font-mono">
        ClipVault Ingestion Pipeline · Supabase Cloud Storage · PostgreSQL Metadata
      </footer>
    </div>
  );
}

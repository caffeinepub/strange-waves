import React, { useState, useRef } from 'react';
import { useListAlbums, useGetAudioFilesByAlbum, useUploadTrackWithAlbum, useIsCallerAdmin } from '../hooks/useQueries';
import type { AlbumView, AudioFile } from '../backend';
import {
  Disc3, Music, Upload, Play, Pause, Loader2, AlertCircle,
  Headphones, Star, TrendingUp, ChevronDown, ChevronUp,
  ImageIcon, FileAudio, X, CheckCircle2,
} from 'lucide-react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface AlbumPageProps {
  albumId: string;
  onNavigate: (page: string) => void;
}

const SSCC_ABOUT = [
  "SScc no.2 is the SteveStrange curator's cut into the exploration of pushing ai generated sounds with human curation to find the multi-dimensional realms the mind's hue of thought will discover when frequencies activate the dormant or the empowerment of being.",
  "SScc is a journey of finding the frequency of energy, and making it our moment.",
  "The tracks are comprehensive models of the structure of reality and identity, through which prior reality interpretations can be united within a greater picture of innerstanding.",
];

// Inline mini audio player for track list
function TrackPlayer({ file }: { file: AudioFile }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadAndPlay = async () => {
    if (!srcUrl) {
      setLoading(true);
      try {
        const url = file.blob.getDirectURL();
        setSrcUrl(url);
      } catch {
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
  };
  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };
  const handleEnded = () => setIsPlaying(false);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="flex items-center gap-3 w-full">
      {srcUrl && (
        <audio
          ref={audioRef}
          src={srcUrl}
          onTimeUpdate={handleTimeUpdate}
          onLoadedMetadata={handleLoadedMetadata}
          onEnded={handleEnded}
          onCanPlay={() => {
            if (isPlaying && audioRef.current) audioRef.current.play();
          }}
        />
      )}
      <button
        onClick={loadAndPlay}
        disabled={loading}
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, oklch(0.72 0.18 175), oklch(0.65 0.22 200))',
          boxShadow: isPlaying ? '0 0 12px oklch(0.72 0.18 175 / 0.6)' : 'none',
        }}
      >
        {loading ? (
          <Loader2 className="h-4 w-4 text-white animate-spin" />
        ) : isPlaying ? (
          <Pause className="h-4 w-4 text-white" />
        ) : (
          <Play className="h-4 w-4 text-white ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between text-xs mb-1" style={{ color: 'oklch(0.70 0.08 175)' }}>
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>
        <div
          className="w-full h-1 rounded-full overflow-hidden cursor-pointer"
          style={{ background: 'oklch(0.25 0.04 200)' }}
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            audioRef.current.currentTime = pct * duration;
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background: 'linear-gradient(90deg, oklch(0.72 0.18 175), oklch(0.78 0.20 145))',
            }}
          />
        </div>
      </div>
    </div>
  );
}

// Full track upload form for admins
function TrackUploadForm({ albumId }: { albumId: string }) {
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: adminLoading } = useIsCallerAdmin();
  const uploadMutation = useUploadTrackWithAlbum();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const audioInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Only show for authenticated admins
  if (!identity || adminLoading || !isAdmin) return null;

  const handleAudioSelect = (file: File) => {
    if (!file.type.startsWith('audio/')) return;
    setAudioFile(file);
    if (!title) {
      setTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleImageSelect = (file: File) => {
    if (!file.type.startsWith('image/')) return;
    setCoverImageFile(file);
    const url = URL.createObjectURL(file);
    setCoverPreviewUrl(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (!file) return;
    if (file.type.startsWith('audio/')) handleAudioSelect(file);
    else if (file.type.startsWith('image/')) handleImageSelect(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!audioFile || !title.trim()) return;

    const audioBuffer = await audioFile.arrayBuffer();
    const audioData = new Uint8Array(audioBuffer);

    let coverImageData: Uint8Array | undefined;
    if (coverImageFile) {
      const imgBuffer = await coverImageFile.arrayBuffer();
      coverImageData = new Uint8Array(imgBuffer);
    }

    const id = `track-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    try {
      await uploadMutation.mutateAsync({
        id,
        title: title.trim(),
        description: description.trim() || undefined,
        duration: 0,
        size: audioFile.size,
        audioData,
        coverImageData,
        creator: 'SteveStrange',
        isPublic: true,
        albumId,
        onProgress: setUploadProgress,
      });

      // Reset form on success
      setTitle('');
      setDescription('');
      setAudioFile(null);
      setCoverImageFile(null);
      setCoverPreviewUrl(null);
      setUploadProgress(0);
    } catch {
      setUploadProgress(0);
    }
  };

  const isPending = uploadMutation.isPending;
  const canSubmit = !!audioFile && !!title.trim() && !isPending;

  return (
    <div
      className="mt-8 rounded-2xl overflow-hidden"
      style={{
        background: 'oklch(0.12 0.05 200)',
        border: '1px solid oklch(0.30 0.10 175 / 0.5)',
        boxShadow: '0 0 40px oklch(0.72 0.18 175 / 0.08)',
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-3 px-6 py-4" style={{ borderBottom: '1px solid oklch(0.22 0.06 200 / 0.6)' }}>
        <div
          className="w-1 h-5 rounded-full"
          style={{ background: 'linear-gradient(180deg, oklch(0.72 0.18 175), oklch(0.85 0.20 145))' }}
        />
        <span className="text-sm font-semibold tracking-widest uppercase" style={{ color: 'oklch(0.72 0.18 175)' }}>
          Upload Track
        </span>
        <span
          className="ml-2 text-xs px-2 py-0.5 rounded-full"
          style={{
            background: 'oklch(0.72 0.18 175 / 0.12)',
            color: 'oklch(0.72 0.18 175)',
            border: '1px solid oklch(0.72 0.18 175 / 0.25)',
          }}
        >
          Owner Only
        </span>
      </div>

      <form onSubmit={handleSubmit} className="px-6 py-6 space-y-5">
        {/* Audio file drop zone */}
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'oklch(0.60 0.10 175)' }}>
            Audio File <span style={{ color: 'oklch(0.65 0.22 25)' }}>*</span>
          </label>
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => !audioFile && audioInputRef.current?.click()}
            className="relative rounded-xl p-5 text-center transition-all duration-200"
            style={{
              border: `2px dashed ${dragOver ? 'oklch(0.72 0.18 175)' : audioFile ? 'oklch(0.72 0.18 175 / 0.5)' : 'oklch(0.28 0.06 200)'}`,
              background: dragOver ? 'oklch(0.72 0.18 175 / 0.06)' : audioFile ? 'oklch(0.72 0.18 175 / 0.04)' : 'oklch(0.14 0.04 200 / 0.5)',
              cursor: audioFile ? 'default' : 'pointer',
            }}
          >
            <input
              ref={audioInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleAudioSelect(f); }}
            />
            {audioFile ? (
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <FileAudio className="h-5 w-5 flex-shrink-0" style={{ color: 'oklch(0.72 0.18 175)' }} />
                  <span className="text-sm truncate" style={{ color: 'oklch(0.80 0.06 175)' }}>{audioFile.name}</span>
                  <span className="text-xs flex-shrink-0" style={{ color: 'oklch(0.50 0.06 200)' }}>
                    {(audioFile.size / 1024 / 1024).toFixed(1)} MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setAudioFile(null); }}
                  className="flex-shrink-0 p-1 rounded-full transition-colors hover:opacity-80"
                  style={{ color: 'oklch(0.55 0.10 175)' }}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <>
                <FileAudio className="h-8 w-8 mx-auto mb-2" style={{ color: 'oklch(0.45 0.08 175)' }} />
                <p className="text-sm font-medium" style={{ color: 'oklch(0.65 0.12 175)' }}>
                  Drop audio file or click to browse
                </p>
                <p className="text-xs mt-1" style={{ color: 'oklch(0.42 0.05 200)' }}>
                  MP3, WAV, FLAC, AAC, OGG supported
                </p>
              </>
            )}
          </div>
        </div>

        {/* Cover image */}
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'oklch(0.60 0.10 175)' }}>
            Cover Image <span style={{ color: 'oklch(0.55 0.06 200)' }}>(optional)</span>
          </label>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div
              className="flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden flex items-center justify-center"
              style={{ background: 'oklch(0.16 0.05 200)', border: '1px solid oklch(0.25 0.05 200)' }}
            >
              {coverPreviewUrl ? (
                <img src={coverPreviewUrl} alt="Cover preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-6 w-6" style={{ color: 'oklch(0.38 0.05 200)' }} />
              )}
            </div>
            <div className="flex-1">
              <button
                type="button"
                onClick={() => imageInputRef.current?.click()}
                className="w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200 hover:opacity-90"
                style={{
                  background: 'oklch(0.18 0.06 200)',
                  border: '1px solid oklch(0.28 0.06 200)',
                  color: 'oklch(0.70 0.08 175)',
                }}
              >
                {coverImageFile ? 'Change Image' : 'Select Cover Image'}
              </button>
              {coverImageFile && (
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-xs truncate" style={{ color: 'oklch(0.55 0.06 200)' }}>{coverImageFile.name}</span>
                  <button
                    type="button"
                    onClick={() => { setCoverImageFile(null); setCoverPreviewUrl(null); }}
                    className="ml-2 flex-shrink-0 text-xs hover:opacity-80"
                    style={{ color: 'oklch(0.55 0.10 175)' }}
                  >
                    Remove
                  </button>
                </div>
              )}
              <input
                ref={imageInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }}
              />
            </div>
          </div>
        </div>

        {/* Track title */}
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'oklch(0.60 0.10 175)' }}>
            Track Title <span style={{ color: 'oklch(0.65 0.22 25)' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter track title…"
            maxLength={120}
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none transition-all duration-200"
            style={{
              background: 'oklch(0.16 0.05 200)',
              border: `1px solid ${title.trim() ? 'oklch(0.72 0.18 175 / 0.4)' : 'oklch(0.26 0.05 200)'}`,
              color: 'oklch(0.88 0.04 175)',
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold tracking-widest uppercase mb-2" style={{ color: 'oklch(0.60 0.10 175)' }}>
            Description <span style={{ color: 'oklch(0.55 0.06 200)' }}>(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe this track, its energy, its intent…"
            rows={3}
            maxLength={500}
            className="w-full rounded-lg px-4 py-2.5 text-sm outline-none resize-none transition-all duration-200"
            style={{
              background: 'oklch(0.16 0.05 200)',
              border: '1px solid oklch(0.26 0.05 200)',
              color: 'oklch(0.88 0.04 175)',
            }}
          />
          <div className="text-right mt-1">
            <span className="text-xs" style={{ color: 'oklch(0.40 0.04 200)' }}>{description.length}/500</span>
          </div>
        </div>

        {/* Upload progress */}
        {isPending && uploadProgress > 0 && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs" style={{ color: 'oklch(0.60 0.08 175)' }}>
              <span>Uploading…</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'oklch(0.20 0.04 200)' }}>
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${uploadProgress}%`,
                  background: 'linear-gradient(90deg, oklch(0.72 0.18 175), oklch(0.78 0.20 145))',
                }}
              />
            </div>
          </div>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full flex items-center justify-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200"
          style={{
            background: canSubmit
              ? 'linear-gradient(135deg, oklch(0.72 0.18 175), oklch(0.65 0.22 200))'
              : 'oklch(0.20 0.04 200)',
            color: canSubmit ? 'oklch(0.10 0.04 200)' : 'oklch(0.40 0.05 200)',
            cursor: canSubmit ? 'pointer' : 'not-allowed',
            boxShadow: canSubmit ? '0 0 20px oklch(0.72 0.18 175 / 0.3)' : 'none',
          }}
        >
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Uploading Track…</span>
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              <span>Upload Track to Collection</span>
            </>
          )}
        </button>

        {!audioFile && (
          <p className="text-center text-xs" style={{ color: 'oklch(0.42 0.05 200)' }}>
            Select an audio file to enable upload
          </p>
        )}
      </form>
    </div>
  );
}

export default function AlbumPage({ albumId, onNavigate }: AlbumPageProps) {
  const [bannerError, setBannerError] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(true);

  const { data: albums = [], isLoading, isError } = useListAlbums();

  // Find album with robust matching
  const albumData: AlbumView | undefined = React.useMemo(() => {
    if (!albums.length) return undefined;
    let found = albums.find((a) => a.id === albumId);
    if (found) return found;
    const normId = albumId.replace(/-/g, '_');
    found = albums.find((a) => a.id === normId || a.id.replace(/-/g, '_') === normId);
    if (found) return found;
    found = albums.find(
      (a) =>
        a.name.toLowerCase().replace(/\s+/g, '-') === albumId ||
        a.name.toLowerCase().replace(/\s+/g, '_') === albumId
    );
    if (found) return found;
    found = albums.find((a) => a.name === 'SScc Collection');
    return found;
  }, [albums, albumId]);

  // Use album-specific query for tracks
  const resolvedAlbumId = albumData?.id ?? null;
  const { data: albumTracks = [] } = useGetAudioFilesByAlbum(resolvedAlbumId);

  const tierConfig = [
    {
      tier: albumData?.listenerTier,
      icon: <Headphones className="h-5 w-5" />,
      gradient: 'linear-gradient(135deg, oklch(0.20 0.06 200), oklch(0.16 0.04 175))',
      accentColor: 'oklch(0.72 0.18 175)',
      glowColor: 'oklch(0.72 0.18 175 / 0.25)',
      label: 'Listener',
      desc: 'Entry-level access to the SScc frequency collection.',
    },
    {
      tier: albumData?.collectorTier,
      icon: <Star className="h-5 w-5" />,
      gradient: 'linear-gradient(135deg, oklch(0.20 0.08 220), oklch(0.16 0.06 200))',
      accentColor: 'oklch(0.78 0.20 145)',
      glowColor: 'oklch(0.78 0.20 145 / 0.25)',
      label: 'Collector',
      desc: 'Collectible ownership rights and deeper connection to the project.',
    },
    {
      tier: albumData?.investorTier,
      icon: <TrendingUp className="h-5 w-5" />,
      gradient: 'linear-gradient(135deg, oklch(0.20 0.10 30), oklch(0.16 0.08 10))',
      accentColor: 'oklch(0.78 0.18 45)',
      glowColor: 'oklch(0.78 0.18 45 / 0.25)',
      label: 'Investor',
      desc: 'Top-tier stake in the project with revenue participation.',
    },
  ];

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        style={{ background: 'oklch(0.10 0.04 200)' }}
      >
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: 'oklch(0.72 0.18 175)' }}
        />
        <p className="text-sm" style={{ color: 'oklch(0.55 0.10 175)' }}>
          Loading album…
        </p>
      </div>
    );
  }

  // ── Error ────────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4"
        style={{ background: 'oklch(0.10 0.04 200)' }}
      >
        <AlertCircle className="h-12 w-12" style={{ color: 'oklch(0.62 0.24 25)' }} />
        <h2 className="text-xl font-semibold" style={{ color: 'oklch(0.90 0.04 175)' }}>
          Failed to load album
        </h2>
        <button
          onClick={() => onNavigate('home')}
          className="px-4 py-2 rounded-md text-sm transition-opacity hover:opacity-90"
          style={{ background: 'oklch(0.72 0.18 175)', color: 'oklch(0.10 0.04 200)' }}
        >
          Go Home
        </button>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen" style={{ background: 'oklch(0.10 0.04 200)' }}>

      {/* ── Hero Banner ─────────────────────────────────────────────────── */}
      <div className="relative w-full overflow-hidden" style={{ height: 'clamp(220px, 40vw, 480px)' }}>
        {!bannerError ? (
          <img
            src="/assets/generated/sscc-banner.dim_1400x500.jpg"
            alt="SScc Banner"
            className="w-full h-full object-cover object-center"
            onError={() => setBannerError(true)}
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: 'linear-gradient(135deg, oklch(0.15 0.08 175), oklch(0.12 0.06 200), oklch(0.18 0.10 145))',
            }}
          >
            <Disc3 className="h-20 w-20 opacity-30" style={{ color: 'oklch(0.72 0.18 175)' }} />
          </div>
        )}
        {/* Gradient overlay — bottom fade into page bg */}
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(to bottom, transparent 30%, oklch(0.10 0.04 200 / 0.6) 70%, oklch(0.10 0.04 200) 100%)',
          }}
        />
      </div>

      {/* ── SScc Title ──────────────────────────────────────────────────── */}
      <div className="flex flex-col items-center text-center px-4 -mt-4 mb-10">
        <h1
          className="font-black tracking-widest select-none"
          style={{
            fontSize: 'clamp(3.5rem, 10vw, 7rem)',
            letterSpacing: '0.15em',
            background:
              'linear-gradient(135deg, oklch(0.72 0.18 175) 0%, oklch(0.85 0.20 145) 30%, oklch(0.90 0.15 200) 55%, oklch(0.80 0.22 310) 80%, oklch(0.72 0.18 175) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            filter: 'drop-shadow(0 0 24px oklch(0.72 0.18 175 / 0.5))',
            lineHeight: 1.1,
          }}
        >
          SScc
        </h1>
        <p
          className="mt-2 text-xs tracking-[0.4em] uppercase font-medium"
          style={{ color: 'oklch(0.55 0.12 175)' }}
        >
          SteveStrange Curator's Cut
        </p>
        {/* Iridescent divider */}
        <div
          className="mt-4 h-px w-48"
          style={{
            background:
              'linear-gradient(90deg, transparent, oklch(0.72 0.18 175), oklch(0.85 0.20 145), oklch(0.72 0.18 175), transparent)',
          }}
        />
      </div>

      {/* ── Page Content ────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 pb-16 max-w-4xl space-y-10">

        {/* ── About Section ─────────────────────────────────────────────── */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'oklch(0.13 0.05 200)',
            border: '1px solid oklch(0.28 0.08 175 / 0.4)',
            boxShadow: '0 0 40px oklch(0.72 0.18 175 / 0.06)',
          }}
        >
          {/* Section header */}
          <button
            className="w-full flex items-center justify-between px-6 py-4 transition-colors"
            style={{ color: 'oklch(0.72 0.18 175)' }}
            onClick={() => setAboutExpanded((v) => !v)}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-1 h-5 rounded-full"
                style={{ background: 'linear-gradient(180deg, oklch(0.72 0.18 175), oklch(0.85 0.20 145))' }}
              />
              <span className="text-sm font-semibold tracking-widest uppercase">About</span>
            </div>
            {aboutExpanded ? <ChevronUp className="h-4 w-4 opacity-60" /> : <ChevronDown className="h-4 w-4 opacity-60" />}
          </button>

          {aboutExpanded && (
            <div className="px-6 pb-6 space-y-5">
              {SSCC_ABOUT.map((paragraph, i) => (
                <p
                  key={i}
                  className="leading-relaxed text-sm md:text-base"
                  style={{ color: 'oklch(0.75 0.05 200)' }}
                >
                  {paragraph}
                </p>
              ))}
            </div>
          )}
        </section>

        {/* ── Tracks / Collection Section ───────────────────────────────── */}
        <section
          className="rounded-2xl overflow-hidden"
          style={{
            background: 'oklch(0.13 0.05 200)',
            border: '1px solid oklch(0.28 0.08 175 / 0.4)',
            boxShadow: '0 0 40px oklch(0.72 0.18 175 / 0.06)',
          }}
        >
          <div className="flex items-center gap-3 px-6 py-4">
            <div
              className="w-1 h-5 rounded-full"
              style={{ background: 'linear-gradient(180deg, oklch(0.78 0.20 145), oklch(0.72 0.18 175))' }}
            />
            <span
              className="text-sm font-semibold tracking-widest uppercase"
              style={{ color: 'oklch(0.78 0.20 145)' }}
            >
              Collection
            </span>
            {albumTracks.length > 0 && (
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{
                  background: 'oklch(0.78 0.20 145 / 0.15)',
                  color: 'oklch(0.78 0.20 145)',
                  border: '1px solid oklch(0.78 0.20 145 / 0.3)',
                }}
              >
                {albumTracks.length} {albumTracks.length === 1 ? 'track' : 'tracks'}
              </span>
            )}
          </div>

          <div className="px-6 pb-6">
            {albumTracks.length > 0 ? (
              <ul className="space-y-3">
                {albumTracks.map((track, i) => (
                  <li
                    key={track.id}
                    className="rounded-xl p-4 transition-all duration-200"
                    style={{
                      background: 'oklch(0.16 0.05 200)',
                      border: '1px solid oklch(0.24 0.06 175 / 0.3)',
                    }}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      {/* Cover art or number */}
                      {track.coverImage ? (
                        <img
                          src={track.coverImage.getDirectURL()}
                          alt={`${track.title} cover`}
                          className="flex-shrink-0 w-10 h-10 rounded-lg object-cover"
                          style={{ border: '1px solid oklch(0.28 0.06 175 / 0.4)' }}
                        />
                      ) : (
                        <div
                          className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold"
                          style={{
                            background: 'linear-gradient(135deg, oklch(0.20 0.08 175), oklch(0.16 0.06 200))',
                            color: 'oklch(0.72 0.18 175)',
                            border: '1px solid oklch(0.28 0.06 175 / 0.3)',
                          }}
                        >
                          {i + 1}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate" style={{ color: 'oklch(0.88 0.06 175)' }}>
                          {track.title}
                        </p>
                        {track.creator && (
                          <p className="text-xs mt-0.5 truncate" style={{ color: 'oklch(0.55 0.08 175)' }}>
                            {track.creator}
                          </p>
                        )}
                      </div>
                    </div>
                    <TrackPlayer file={track} />
                  </li>
                ))}
              </ul>
            ) : (
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <Music className="h-10 w-10 opacity-20" style={{ color: 'oklch(0.72 0.18 175)' }} />
                <p className="text-sm" style={{ color: 'oklch(0.45 0.06 200)' }}>
                  No tracks yet — the collection is forming.
                </p>
              </div>
            )}

            {/* Owner-only upload form */}
            {resolvedAlbumId && <TrackUploadForm albumId={resolvedAlbumId} />}
          </div>
        </section>

        {/* ── Mint Tier Cards ───────────────────────────────────────────── */}
        <section>
          <div className="flex items-center gap-3 mb-6">
            <div
              className="w-1 h-5 rounded-full"
              style={{ background: 'linear-gradient(180deg, oklch(0.78 0.18 45), oklch(0.72 0.18 175))' }}
            />
            <span
              className="text-sm font-semibold tracking-widest uppercase"
              style={{ color: 'oklch(0.78 0.18 45)' }}
            >
              Mint Tiers
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {tierConfig.map(({ tier, icon, gradient, accentColor, glowColor, label, desc }) => (
              <div
                key={label}
                className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02]"
                style={{
                  background: gradient,
                  border: `1px solid ${accentColor.replace(')', ' / 0.3)')}`,
                  boxShadow: `0 0 30px ${glowColor}`,
                }}
              >
                <div className="flex items-center gap-2" style={{ color: accentColor }}>
                  {icon}
                  <span className="text-sm font-bold tracking-wide">{label}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: 'oklch(0.65 0.04 200)' }}>
                  {desc}
                </p>
                {tier && (
                  <div className="mt-auto pt-3 space-y-1.5" style={{ borderTop: `1px solid ${accentColor.replace(')', ' / 0.15)')}` }}>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'oklch(0.55 0.05 200)' }}>Price</span>
                      <span className="font-semibold" style={{ color: accentColor }}>
                        {tier.price.toString()} ICP
                      </span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span style={{ color: 'oklch(0.55 0.05 200)' }}>Supply</span>
                      <span className="font-semibold" style={{ color: accentColor }}>
                        {tier.supply.toString()}
                      </span>
                    </div>
                    {tier.description && (
                      <p className="text-xs pt-1" style={{ color: 'oklch(0.55 0.05 200)' }}>
                        {tier.description}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}

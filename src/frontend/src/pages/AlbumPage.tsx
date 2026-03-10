import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Disc3,
  Headphones,
  Loader2,
  Maximize2,
  Music,
  Pause,
  Play,
  Radio,
  Star,
  TrendingUp,
  Volume2,
  VolumeX,
} from "lucide-react";
import React, { useState, useRef, useEffect, useCallback } from "react";
import type { AlbumView, AudioFile } from "../backend";
import { FileType } from "../backend";
import { NFTMintDialog } from "../components/NFTMintDialog";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAudioFiles, useListAlbums, useMintNFT } from "../hooks/useQueries";

interface AlbumPageProps {
  albumId: string;
  onNavigate: (page: string) => void;
}

const SSCC_ABOUT = [
  "SScc no.2 is the SteveStrange curator's cut into the exploration of pushing ai generated sounds with human curation to find the multi-dimensional realms the mind's hue of thought will discover when frequencies activate the dormant or the empowerment of being.",
  "SScc is a journey of finding the frequency of energy, and making it our moment.",
  "The tracks are comprehensive models of the structure of reality and identity, through which prior reality interpretations can be united within a greater picture of innerstanding.",
];

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Featured Album Player ────────────────────────────────────────────────────
interface FeaturedPlayerProps {
  selectedTrack: AudioFile | null;
  trackIndex: number;
  totalTracks: number;
}

function FeaturedPlayer({
  selectedTrack,
  trackIndex,
  totalTracks,
}: FeaturedPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [srcUrl, setSrcUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const prevTrackIdRef = useRef<string | null>(null);

  // Load track whenever selectedTrack changes
  useEffect(() => {
    if (!selectedTrack) {
      setSrcUrl(null);
      setCoverUrl(null);
      setIsPlaying(false);
      setCurrentTime(0);
      setDuration(0);
      prevTrackIdRef.current = null;
      return;
    }

    if (selectedTrack.id === prevTrackIdRef.current) return;
    prevTrackIdRef.current = selectedTrack.id;

    setIsLoading(true);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);

    try {
      const audioUrl = selectedTrack.blob.getDirectURL();
      setSrcUrl(audioUrl);
    } catch {
      setIsLoading(false);
    }

    if (selectedTrack.coverImage) {
      try {
        setCoverUrl(selectedTrack.coverImage.getDirectURL());
      } catch {
        setCoverUrl(null);
      }
    } else {
      setCoverUrl(null);
    }
  }, [selectedTrack]);

  // Apply volume/mute to audio element
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !srcUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
  }, [isPlaying, srcUrl]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!audioRef.current || !duration || !progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      audioRef.current.currentTime = pct * duration;
      setCurrentTime(pct * duration);
    },
    [duration],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!selectedTrack) {
    // Placeholder state
    return (
      <div
        data-ocid="album.player.card"
        className="rounded-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.13 0.06 200), oklch(0.11 0.04 175))",
          border: "1px solid oklch(0.25 0.08 175 / 0.35)",
          boxShadow:
            "0 0 60px oklch(0.72 0.18 175 / 0.07), inset 0 1px 0 oklch(0.72 0.18 175 / 0.1)",
        }}
      >
        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
          {/* Artwork placeholder */}
          <div
            className="flex-shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-xl flex items-center justify-center relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, oklch(0.16 0.08 175), oklch(0.14 0.06 200))",
              border: "1px solid oklch(0.28 0.08 175 / 0.3)",
            }}
          >
            <div
              className="absolute inset-0 opacity-20"
              style={{
                background:
                  "radial-gradient(circle at 50% 50%, oklch(0.72 0.18 175), transparent 70%)",
              }}
            />
            <Radio
              className="h-12 w-12 relative z-10"
              style={{ color: "oklch(0.42 0.10 175)" }}
            />
          </div>

          {/* Text + controls placeholder */}
          <div className="flex-1 min-w-0 flex flex-col items-center sm:items-start gap-3 text-center sm:text-left">
            <div>
              <p
                className="text-base font-semibold"
                style={{ color: "oklch(0.50 0.08 175)" }}
              >
                Select a track to play
              </p>
              <p
                className="text-xs mt-1"
                style={{ color: "oklch(0.35 0.05 200)" }}
              >
                Choose from the collection below
              </p>
            </div>

            {/* Inactive progress bar */}
            <div className="w-full max-w-xs sm:max-w-none">
              <div
                className="flex justify-between text-xs mb-1.5"
                style={{ color: "oklch(0.35 0.05 200)" }}
              >
                <span>0:00</span>
                <span>--:--</span>
              </div>
              <div
                className="w-full h-1.5 rounded-full"
                style={{ background: "oklch(0.20 0.04 200)" }}
              />
            </div>

            {/* Inactive controls */}
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center opacity-30"
                style={{ background: "oklch(0.20 0.06 200)" }}
              >
                <Play
                  className="h-5 w-5"
                  style={{ color: "oklch(0.55 0.10 175)" }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      data-ocid="album.player.card"
      className="rounded-2xl overflow-hidden"
      style={{
        background:
          "linear-gradient(135deg, oklch(0.13 0.06 200), oklch(0.11 0.04 175))",
        border: "1px solid oklch(0.30 0.10 175 / 0.45)",
        boxShadow:
          "0 0 60px oklch(0.72 0.18 175 / 0.12), inset 0 1px 0 oklch(0.72 0.18 175 / 0.12)",
      }}
    >
      {/* Hidden audio element */}
      {srcUrl && (
        <audio
          ref={audioRef}
          src={srcUrl}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          onTimeUpdate={() => {
            if (!isSeeking && audioRef.current)
              setCurrentTime(audioRef.current.currentTime);
          }}
          onLoadedMetadata={() => {
            if (audioRef.current) {
              setDuration(audioRef.current.duration);
              setIsLoading(false);
              audioRef.current.volume = isMuted ? 0 : volume;
              audioRef.current.play().catch(() => {});
            }
          }}
          onCanPlay={() => setIsLoading(false)}
          onWaiting={() => setIsLoading(true)}
        >
          <track kind="captions" />
        </audio>
      )}

      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
        {/* Cover artwork */}
        <div
          className="flex-shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden relative"
          style={{
            border: "1px solid oklch(0.32 0.10 175 / 0.4)",
            boxShadow: isPlaying
              ? "0 0 30px oklch(0.72 0.18 175 / 0.35)"
              : "0 4px 20px oklch(0 0 0 / 0.4)",
          }}
        >
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={`${selectedTrack.title} cover`}
              className="w-full h-full object-cover"
              style={{
                transition: "transform 0.3s ease",
                transform: isPlaying ? "scale(1.03)" : "scale(1)",
              }}
            />
          ) : (
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.18 0.10 175), oklch(0.14 0.07 200))",
              }}
            >
              <Music
                className="h-12 w-12 opacity-50"
                style={{ color: "oklch(0.72 0.18 175)" }}
              />
            </div>
          )}
          {/* Playing pulse ring */}
          {isPlaying && (
            <div
              className="absolute inset-0 rounded-xl pointer-events-none"
              style={{
                border: "2px solid oklch(0.72 0.18 175 / 0.6)",
                animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
              }}
            />
          )}
        </div>

        {/* Track info + controls */}
        <div className="flex-1 min-w-0 flex flex-col gap-4 w-full sm:w-auto">
          {/* Track meta */}
          <div className="text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
              <span
                className="text-xs px-2 py-0.5 rounded-full font-medium tracking-wider uppercase"
                style={{
                  background: "oklch(0.72 0.18 175 / 0.12)",
                  color: "oklch(0.72 0.18 175)",
                  border: "1px solid oklch(0.72 0.18 175 / 0.25)",
                }}
              >
                {trackIndex + 1} / {totalTracks}
              </span>
              {isPlaying && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full font-medium"
                  style={{
                    background: "oklch(0.78 0.20 145 / 0.12)",
                    color: "oklch(0.78 0.20 145)",
                    border: "1px solid oklch(0.78 0.20 145 / 0.25)",
                  }}
                >
                  Now Playing
                </span>
              )}
            </div>
            <h3
              className="text-lg sm:text-xl font-bold truncate"
              style={{ color: "oklch(0.92 0.06 175)" }}
            >
              {selectedTrack.title}
            </h3>
            {selectedTrack.creator && (
              <p
                className="text-sm mt-0.5 truncate"
                style={{ color: "oklch(0.58 0.10 175)" }}
              >
                {selectedTrack.creator}
              </p>
            )}
          </div>

          {/* Progress bar */}
          <div className="w-full">
            <div
              ref={progressBarRef}
              className="w-full h-2 rounded-full cursor-pointer relative group"
              style={{ background: "oklch(0.20 0.05 200)" }}
              onClick={handleSeek}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ")
                  handleSeek(e as unknown as React.MouseEvent<HTMLDivElement>);
              }}
              onMouseDown={() => setIsSeeking(true)}
              onMouseUp={() => setIsSeeking(false)}
              role="slider"
              tabIndex={0}
              aria-label="Seek audio"
              aria-valuemin={0}
              aria-valuemax={duration || 100}
              aria-valuenow={currentTime}
              data-ocid="album.player.canvas_target"
            >
              {/* Fill */}
              <div
                className="h-full rounded-full transition-all duration-100 relative"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, oklch(0.72 0.18 175), oklch(0.80 0.20 145))",
                }}
              >
                {/* Thumb */}
                <div
                  className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{
                    background: "oklch(0.95 0.06 175)",
                    boxShadow: "0 0 8px oklch(0.72 0.18 175 / 0.8)",
                    transform: "translate(50%, -50%)",
                  }}
                />
              </div>
            </div>
            <div
              className="flex justify-between text-xs mt-1.5"
              style={{ color: "oklch(0.50 0.08 175)" }}
            >
              <span>{formatTime(currentTime)}</span>
              <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
            </div>
          </div>

          {/* Playback controls row */}
          <div className="flex items-center justify-between gap-2">
            {/* Play / Pause */}
            <button
              type="button"
              onClick={togglePlay}
              disabled={isLoading && !srcUrl}
              data-ocid="album.player.button"
              className="w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.72 0.18 175), oklch(0.65 0.22 200))",
                boxShadow: isPlaying
                  ? "0 0 24px oklch(0.72 0.18 175 / 0.55), 0 4px 12px oklch(0 0 0 / 0.3)"
                  : "0 4px 12px oklch(0 0 0 / 0.3)",
              }}
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isLoading ? (
                <Loader2 className="h-6 w-6 text-black animate-spin" />
              ) : isPlaying ? (
                <Pause className="h-6 w-6 text-black" />
              ) : (
                <Play className="h-6 w-6 text-black ml-0.5" />
              )}
            </button>

            {/* Volume control */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsMuted((m) => !m)}
                data-ocid="album.player.toggle"
                className="p-2 rounded-lg transition-colors hover:opacity-80"
                style={{
                  color: isMuted
                    ? "oklch(0.45 0.05 200)"
                    : "oklch(0.65 0.12 175)",
                }}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => {
                  const v = Number.parseFloat(e.target.value);
                  setVolume(v);
                  if (isMuted && v > 0) setIsMuted(false);
                }}
                className="w-20 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: "oklch(0.72 0.18 175)",
                  background: `linear-gradient(to right, oklch(0.72 0.18 175) ${(isMuted ? 0 : volume) * 100}%, oklch(0.22 0.05 200) ${(isMuted ? 0 : volume) * 100}%)`,
                }}
                aria-label="Volume"
              />
            </div>

            {/* Track size info */}
            {selectedTrack.size > 0 && (
              <span
                className="text-xs hidden sm:block"
                style={{ color: "oklch(0.38 0.05 200)" }}
              >
                {(Number(selectedTrack.size) / 1024 / 1024).toFixed(1)} MB
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Inline mini TrackPlayer ──────────────────────────────────────────────────
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
        >
          <track kind="captions" />
        </audio>
      )}
      <button
        type="button"
        onClick={loadAndPlay}
        disabled={loading}
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.72 0.18 175), oklch(0.65 0.22 200))",
          boxShadow: isPlaying ? "0 0 12px oklch(0.72 0.18 175 / 0.6)" : "none",
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
        <div
          className="flex justify-between text-xs mb-1"
          style={{ color: "oklch(0.70 0.08 175)" }}
        >
          <span>{formatTime(currentTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
        </div>
        <div
          className="w-full h-1 rounded-full overflow-hidden cursor-pointer"
          style={{ background: "oklch(0.25 0.04 200)" }}
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration || 100}
          aria-valuenow={currentTime}
          onClick={(e) => {
            if (!audioRef.current || !duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const pct = x / rect.width;
            audioRef.current.currentTime = pct * duration;
          }}
          onKeyDown={(e) => {
            if (!audioRef.current || !duration) return;
            if (e.key === "ArrowRight")
              audioRef.current.currentTime = Math.min(
                duration,
                currentTime + 5,
              );
            if (e.key === "ArrowLeft")
              audioRef.current.currentTime = Math.max(0, currentTime - 5);
          }}
        >
          <div
            className="h-full rounded-full transition-all duration-100"
            style={{
              width: `${progress}%`,
              background:
                "linear-gradient(90deg, oklch(0.72 0.18 175), oklch(0.78 0.20 145))",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main AlbumPage ───────────────────────────────────────────────────────────
export default function AlbumPage({ albumId, onNavigate }: AlbumPageProps) {
  const [bannerError, setBannerError] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<AudioFile | null>(null);
  const [mintTrack, setMintTrack] = useState<AudioFile | null>(null);
  const [mintDialogOpen, setMintDialogOpen] = useState(false);

  const { data: albums = [], isLoading, isError } = useListAlbums();
  const { identity } = useInternetIdentity();
  const mintMutation = useMintNFT();

  const albumData: AlbumView | undefined = React.useMemo(() => {
    if (!albums.length) return undefined;
    let found = albums.find((a) => a.id === albumId);
    if (found) return found;
    const normId = albumId.replace(/-/g, "_");
    found = albums.find(
      (a) => a.id === normId || a.id.replace(/-/g, "_") === normId,
    );
    if (found) return found;
    found = albums.find(
      (a) =>
        a.name.toLowerCase().replace(/\s+/g, "-") === albumId ||
        a.name.toLowerCase().replace(/\s+/g, "_") === albumId,
    );
    if (found) return found;
    found = albums.find((a) => a.name === "SScc Collection");
    return found;
  }, [albums, albumId]);

  const { data: allTracks = [] } = useAudioFiles();

  // Show the upload button as soon as the user is signed in with a non-anonymous
  // principal. The backend upload mutation enforces admin-only access and will
  // return an error if the caller is not actually an admin.
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const tierConfig = [
    {
      tier: albumData?.listenerTier,
      icon: <Headphones className="h-5 w-5" />,
      gradient:
        "linear-gradient(135deg, oklch(0.20 0.06 200), oklch(0.16 0.04 175))",
      accentColor: "oklch(0.72 0.18 175)",
      glowColor: "oklch(0.72 0.18 175 / 0.25)",
      label: "Listener",
      desc: "Entry-level access to the SScc frequency collection.",
    },
    {
      tier: albumData?.collectorTier,
      icon: <Star className="h-5 w-5" />,
      gradient:
        "linear-gradient(135deg, oklch(0.20 0.08 220), oklch(0.16 0.06 200))",
      accentColor: "oklch(0.78 0.20 145)",
      glowColor: "oklch(0.78 0.20 145 / 0.25)",
      label: "Collector",
      desc: "Collectible ownership rights and deeper connection to the project.",
    },
    {
      tier: albumData?.investorTier,
      icon: <TrendingUp className="h-5 w-5" />,
      gradient:
        "linear-gradient(135deg, oklch(0.20 0.10 30), oklch(0.16 0.08 10))",
      accentColor: "oklch(0.78 0.18 45)",
      glowColor: "oklch(0.78 0.18 45 / 0.25)",
      label: "Investor",
      desc: "Top-tier stake in the project with revenue participation.",
    },
  ];

  const selectedTrackIndex = selectedTrack
    ? allTracks.findIndex((t) => t.id === selectedTrack.id)
    : -1;

  // ── Loading ──────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] gap-4"
        style={{ background: "oklch(0.10 0.04 200)" }}
      >
        <div
          className="animate-spin rounded-full h-10 w-10 border-b-2"
          style={{ borderColor: "oklch(0.72 0.18 175)" }}
        />
        <p className="text-sm" style={{ color: "oklch(0.55 0.10 175)" }}>
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
        style={{ background: "oklch(0.10 0.04 200)" }}
      >
        <AlertCircle
          className="h-12 w-12"
          style={{ color: "oklch(0.62 0.24 25)" }}
        />
        <h2
          className="text-xl font-semibold"
          style={{ color: "oklch(0.90 0.04 175)" }}
        >
          Failed to load album
        </h2>
        <button
          type="button"
          onClick={() => onNavigate("home")}
          className="px-4 py-2 rounded-md text-sm transition-opacity hover:opacity-90"
          style={{
            background: "oklch(0.72 0.18 175)",
            color: "oklch(0.10 0.04 200)",
          }}
        >
          Go Home
        </button>
      </div>
    );
  }

  // ── Main render ──────────────────────────────────────────────────────────
  return (
    <>
      <div
        className="min-h-screen"
        style={{ background: "oklch(0.10 0.04 200)" }}
      >
        {/* ── Hero Banner ─────────────────────────────────────────────────── */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: "clamp(220px, 40vw, 480px)" }}
        >
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
                background:
                  "linear-gradient(135deg, oklch(0.15 0.08 175), oklch(0.12 0.06 200), oklch(0.18 0.10 145))",
              }}
            >
              <Disc3
                className="h-20 w-20 opacity-30"
                style={{ color: "oklch(0.72 0.18 175)" }}
              />
            </div>
          )}
          {/* Gradient overlay */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 30%, oklch(0.10 0.04 200 / 0.6) 70%, oklch(0.10 0.04 200) 100%)",
            }}
          />
        </div>

        {/* ── SScc Title ──────────────────────────────────────────────────── */}
        <div className="flex flex-col items-center text-center px-4 -mt-4 mb-10">
          <h1
            className="font-black tracking-widest select-none"
            style={{
              fontSize: "clamp(3.5rem, 10vw, 7rem)",
              letterSpacing: "0.15em",
              background:
                "linear-gradient(135deg, oklch(0.72 0.18 175) 0%, oklch(0.85 0.20 145) 30%, oklch(0.90 0.15 200) 55%, oklch(0.80 0.22 310) 80%, oklch(0.72 0.18 175) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 24px oklch(0.72 0.18 175 / 0.5))",
              lineHeight: 1.1,
            }}
          >
            SScc
          </h1>
          <p
            className="mt-2 text-xs tracking-[0.4em] uppercase font-medium"
            style={{ color: "oklch(0.55 0.12 175)" }}
          >
            SteveStrange Curator's Cut
          </p>
          {/* Iridescent divider */}
          <div
            className="mt-4 h-px w-48"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.72 0.18 175), oklch(0.85 0.20 145), oklch(0.72 0.18 175), transparent)",
            }}
          />
        </div>

        {/* ── Page Content ────────────────────────────────────────────────── */}
        <div className="container mx-auto px-4 pb-16 max-w-4xl space-y-10">
          {/* ── Featured Album Player ──────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-1 h-5 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, oklch(0.72 0.18 175), oklch(0.85 0.20 145))",
                }}
              />
              <span
                className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: "oklch(0.72 0.18 175)" }}
              >
                Now Playing
              </span>
            </div>
            <FeaturedPlayer
              selectedTrack={selectedTrack}
              trackIndex={selectedTrackIndex >= 0 ? selectedTrackIndex : 0}
              totalTracks={allTracks.length}
            />
          </section>

          {/* ── About Section ─────────────────────────────────────────────── */}
          <section
            className="rounded-2xl overflow-hidden"
            style={{
              background: "oklch(0.13 0.05 200)",
              border: "1px solid oklch(0.28 0.08 175 / 0.4)",
              boxShadow: "0 0 40px oklch(0.72 0.18 175 / 0.06)",
            }}
          >
            <button
              type="button"
              className="w-full flex items-center justify-between px-6 py-4 transition-colors"
              style={{ color: "oklch(0.72 0.18 175)" }}
              onClick={() => setAboutExpanded((v) => !v)}
              data-ocid="album.about.toggle"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-1 h-5 rounded-full"
                  style={{
                    background:
                      "linear-gradient(180deg, oklch(0.72 0.18 175), oklch(0.85 0.20 145))",
                  }}
                />
                <span className="text-sm font-semibold tracking-widest uppercase">
                  About
                </span>
              </div>
              {aboutExpanded ? (
                <ChevronUp className="h-4 w-4 opacity-60" />
              ) : (
                <ChevronDown className="h-4 w-4 opacity-60" />
              )}
            </button>

            {aboutExpanded && (
              <div className="px-6 pb-6 space-y-5">
                {SSCC_ABOUT.map((paragraph) => (
                  <p
                    key={paragraph.slice(0, 40)}
                    className="leading-relaxed text-sm md:text-base"
                    style={{ color: "oklch(0.75 0.05 200)" }}
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
              background: "oklch(0.13 0.05 200)",
              border: "1px solid oklch(0.28 0.08 175 / 0.4)",
              boxShadow: "0 0 40px oklch(0.72 0.18 175 / 0.06)",
            }}
          >
            <div className="flex items-center gap-3 px-6 py-4">
              <div
                className="w-1 h-5 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, oklch(0.78 0.20 145), oklch(0.72 0.18 175))",
                }}
              />
              <span
                className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: "oklch(0.78 0.20 145)" }}
              >
                Collection
              </span>
              {allTracks.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.78 0.20 145 / 0.15)",
                    color: "oklch(0.78 0.20 145)",
                    border: "1px solid oklch(0.78 0.20 145 / 0.3)",
                  }}
                >
                  {allTracks.length}{" "}
                  {allTracks.length === 1 ? "track" : "tracks"}
                </span>
              )}
            </div>

            <div className="px-6 pb-6">
              {allTracks.length > 0 ? (
                <ul className="space-y-3" data-ocid="album.collection.list">
                  {allTracks.map((track, i) => {
                    const isSelected = selectedTrack?.id === track.id;
                    return (
                      <li
                        key={track.id}
                        data-ocid={`album.collection.item.${i + 1}`}
                        className="rounded-xl p-4 transition-all duration-200"
                        style={{
                          background: isSelected
                            ? "oklch(0.18 0.08 175 / 0.6)"
                            : "oklch(0.16 0.05 200)",
                          border: isSelected
                            ? "1px solid oklch(0.72 0.18 175 / 0.45)"
                            : "1px solid oklch(0.24 0.06 175 / 0.3)",
                          boxShadow: isSelected
                            ? "0 0 20px oklch(0.72 0.18 175 / 0.1)"
                            : "none",
                        }}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          {/* Cover art / number — clicking loads featured player */}
                          <button
                            type="button"
                            onClick={() => setSelectedTrack(track)}
                            data-ocid={`album.collection.button.${i + 1}`}
                            className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center group relative transition-all duration-200 hover:ring-2"
                            style={{
                              border: `1px solid ${isSelected ? "oklch(0.72 0.18 175 / 0.5)" : "oklch(0.28 0.06 175 / 0.4)"}`,
                            }}
                            aria-label={`Load ${track.title} in featured player`}
                          >
                            {track.coverImage ? (
                              <>
                                <img
                                  src={track.coverImage.getDirectURL()}
                                  alt={`${track.title} cover`}
                                  className="w-full h-full object-cover"
                                />
                                {/* Hover overlay */}
                                <div
                                  className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                  style={{ background: "oklch(0 0 0 / 0.55)" }}
                                >
                                  <Maximize2 className="h-3.5 w-3.5 text-white" />
                                </div>
                              </>
                            ) : (
                              <div
                                className="w-full h-full flex items-center justify-center text-xs font-bold"
                                style={{
                                  background: isSelected
                                    ? "linear-gradient(135deg, oklch(0.28 0.12 175), oklch(0.22 0.10 200))"
                                    : "linear-gradient(135deg, oklch(0.20 0.08 175), oklch(0.16 0.06 200))",
                                  color: "oklch(0.72 0.18 175)",
                                }}
                              >
                                {isSelected ? (
                                  <Maximize2 className="h-3.5 w-3.5" />
                                ) : (
                                  <span>{i + 1}</span>
                                )}
                              </div>
                            )}
                          </button>

                          {/* Track info — clicking also loads featured player */}
                          <button
                            type="button"
                            onClick={() => setSelectedTrack(track)}
                            className="flex-1 min-w-0 text-left transition-opacity hover:opacity-80"
                            aria-label={`Play ${track.title}`}
                          >
                            <p
                              className="text-sm font-semibold truncate"
                              style={{
                                color: isSelected
                                  ? "oklch(0.92 0.08 175)"
                                  : "oklch(0.88 0.06 175)",
                              }}
                            >
                              {track.title}
                            </p>
                            {track.creator && (
                              <p
                                className="text-xs mt-0.5 truncate"
                                style={{ color: "oklch(0.55 0.08 175)" }}
                              >
                                {track.creator}
                              </p>
                            )}
                          </button>

                          {/* "In player" badge */}
                          {isSelected && (
                            <span
                              className="flex-shrink-0 text-xs px-1.5 py-0.5 rounded-md font-medium"
                              style={{
                                background: "oklch(0.72 0.18 175 / 0.15)",
                                color: "oklch(0.72 0.18 175)",
                                border: "1px solid oklch(0.72 0.18 175 / 0.25)",
                              }}
                            >
                              ♪
                            </span>
                          )}
                        </div>

                        {/* Mint button (authenticated users) */}
                        {isAuthenticated && (
                          <div className="mt-2 flex justify-end">
                            <button
                              type="button"
                              data-ocid={`album.track.button.${i + 1}`}
                              onClick={() => {
                                setMintTrack(track);
                                setMintDialogOpen(true);
                              }}
                              className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95"
                              style={{
                                background: "oklch(0.78 0.20 145 / 0.14)",
                                color: "oklch(0.78 0.20 145)",
                                border: "1px solid oklch(0.78 0.20 145 / 0.35)",
                                boxShadow:
                                  "0 0 12px oklch(0.78 0.20 145 / 0.10)",
                              }}
                            >
                              <Disc3 className="h-3 w-3" />
                              <span>Mint NFT</span>
                            </button>
                          </div>
                        )}

                        {/* Inline mini player */}
                        <TrackPlayer file={track} />
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-10 gap-3"
                  data-ocid="album.collection.empty_state"
                >
                  <Music
                    className="h-10 w-10 opacity-20"
                    style={{ color: "oklch(0.72 0.18 175)" }}
                  />
                  <p
                    className="text-sm"
                    style={{ color: "oklch(0.45 0.06 200)" }}
                  >
                    No tracks yet — the collection is forming.
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* ── Mint Tier Cards ───────────────────────────────────────────── */}
          <section>
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-1 h-5 rounded-full"
                style={{
                  background:
                    "linear-gradient(180deg, oklch(0.78 0.18 45), oklch(0.72 0.18 175))",
                }}
              />
              <span
                className="text-sm font-semibold tracking-widest uppercase"
                style={{ color: "oklch(0.78 0.18 45)" }}
              >
                Mint Tiers
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tierConfig.map(
                ({
                  tier,
                  icon,
                  gradient,
                  accentColor,
                  glowColor,
                  label,
                  desc,
                }) => (
                  <div
                    key={label}
                    className="rounded-2xl p-5 flex flex-col gap-3 transition-all duration-300 hover:scale-[1.02]"
                    style={{
                      background: gradient,
                      border: `1px solid ${accentColor.replace(")", " / 0.3)")}`,
                      boxShadow: `0 0 30px ${glowColor}`,
                    }}
                  >
                    <div
                      className="flex items-center gap-2"
                      style={{ color: accentColor }}
                    >
                      {icon}
                      <span className="text-sm font-bold tracking-wide">
                        {label}
                      </span>
                    </div>
                    <p
                      className="text-xs leading-relaxed"
                      style={{ color: "oklch(0.65 0.04 200)" }}
                    >
                      {desc}
                    </p>
                    {tier && (
                      <div
                        className="mt-auto pt-3 space-y-1.5"
                        style={{
                          borderTop: `1px solid ${accentColor.replace(")", " / 0.15)")}`,
                        }}
                      >
                        <div className="flex justify-between text-xs">
                          <span style={{ color: "oklch(0.55 0.05 200)" }}>
                            Price
                          </span>
                          <span
                            className="font-semibold"
                            style={{ color: accentColor }}
                          >
                            {tier.price.toString()} ICP
                          </span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span style={{ color: "oklch(0.55 0.05 200)" }}>
                            Supply
                          </span>
                          <span
                            className="font-semibold"
                            style={{ color: accentColor }}
                          >
                            {tier.supply.toString()}
                          </span>
                        </div>
                        {tier.description && (
                          <p
                            className="text-xs pt-1"
                            style={{ color: "oklch(0.55 0.05 200)" }}
                          >
                            {tier.description}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ),
              )}
            </div>
          </section>
        </div>
      </div>
      {mintTrack && (
        <NFTMintDialog
          open={mintDialogOpen}
          onOpenChange={(open) => {
            setMintDialogOpen(open);
            if (!open) setMintTrack(null);
          }}
          audioFile={mintTrack}
          isLoading={mintMutation.isPending}
          onMint={async (data) => {
            await mintMutation.mutateAsync({
              audioFile: mintTrack,
              title: data.title,
              description: data.description,
              artist: data.artist,
              fileType: data.fileType,
            });
            setMintDialogOpen(false);
            setMintTrack(null);
          }}
        />
      )}
    </>
  );
}

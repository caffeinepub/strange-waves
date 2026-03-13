import {
  ChevronDown,
  ChevronUp,
  Disc3,
  Loader2,
  Music,
  Pause,
  Play,
  Radio,
  Volume2,
  VolumeX,
} from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AudioFile } from "../backend";
import { NFTMintDialog } from "../components/NFTMintDialog";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useAudioFiles, useMintNFTWithParams } from "../hooks/useQueries";

interface AlbumPageProps {
  albumId: string;
  onNavigate: (page: string) => void;
}

interface AlbumStaticConfig {
  displayTitle: string;
  subtitle: string;
  bannerSrc: string;
  bannerAlt: string;
  trackFilterKeyword: string;
  about: string[];
  emptyStateHint: string;
}

const ALBUM_CONFIGS: Record<string, AlbumStaticConfig> = {
  sscc_collection: {
    displayTitle: "SScc",
    subtitle: "SteveStrange Curator's Cut",
    bannerSrc: "/assets/SScc banner krystic world.jpg",
    bannerAlt: "SScc Banner",
    trackFilterKeyword: "sscc",
    about: [
      "SScc is the SteveStrange curator's cut into the exploration of pushing ai generated sounds with human curation to find the multi-dimensional realms the mind's hue of thought will discover when frequencies activate the dormant or the empowerment of being.",
      "A comprehensive model of the structure of reality and identity, through which prior reality interpretations can be united within a greater picture of innerstanding.",
      "Cosmic Structure, the context within which our evolution occurs and the hidden mechanics of evolution as being the process of dimensional ascension, through progressive cellular transmutation. The Anatomy of multi-dimensional identity and the krystal body, our personal, indelible connection to the Divine, and the point of union between science and spirituality. We have discovered our hidden evolutionary potential to reclaim our immortality and re-enter the cycles of higher evolution through methods of activation. Can we hear the frequency to explore some oscillation.",
      "Beginning measures we can take, to prepare our bodies for the time it takes. Acceleration and continuum shift, while simultaneously improving our health, creating personal protection and accelerating the process of our self. Biological and spiritual evolution.",
      "The choice belongs to each of us.",
    ],
    emptyStateHint:
      'Upload tracks with "SScc" in the title from the main page to populate this collection.',
  },
  knight_of_the_soul: {
    displayTitle: "Knight of the Soul",
    subtitle: "SteveStrange",
    bannerSrc: "",
    bannerAlt: "Knight of the Soul Banner",
    trackFilterKeyword: "knight of the soul",
    about: [
      "Knight of the Soul is a sonic journey into the depths of inner strength, resilience, and transcendence. This collection explores the intersection of human spirit and universal consciousness through sound.",
      "Each track is a chapter in the story of the soul's passage — through challenge, transformation, and ultimately, illumination.",
    ],
    emptyStateHint:
      'Upload tracks with "Knight of the Soul" in the title from the main page to populate this collection.',
  },
};

function getAlbumConfig(albumId: string): AlbumStaticConfig {
  const normalized = albumId.replace(/-/g, "_");
  return ALBUM_CONFIGS[normalized] ?? ALBUM_CONFIGS.sscc_collection;
}

function formatTime(s: number): string {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// ─── Audio Visualizer Bars (CSS-only, decorative) ─────────────────────────────
function AudioVisualizer() {
  return (
    <>
      <style>{`
        @keyframes bar-bounce-1 { 0%,100%{height:3px} 50%{height:13px} }
        @keyframes bar-bounce-2 { 0%,100%{height:6px} 50%{height:20px} }
        @keyframes bar-bounce-3 { 0%,100%{height:4px} 50%{height:17px} }
        @keyframes bar-bounce-4 { 0%,100%{height:8px} 50%{height:22px} }
        @keyframes bar-bounce-5 { 0%,100%{height:5px} 50%{height:15px} }
        @keyframes bar-bounce-6 { 0%,100%{height:3px} 50%{height:18px} }
        @keyframes bar-bounce-7 { 0%,100%{height:7px} 50%{height:12px} }
      `}</style>
      <div
        className="flex items-end gap-[3px]"
        style={{ height: "22px" }}
        aria-hidden="true"
      >
        {[
          { anim: "bar-bounce-1", dur: "0.55s" },
          { anim: "bar-bounce-2", dur: "0.70s" },
          { anim: "bar-bounce-3", dur: "0.45s" },
          { anim: "bar-bounce-4", dur: "0.80s" },
          { anim: "bar-bounce-5", dur: "0.60s" },
          { anim: "bar-bounce-6", dur: "0.50s" },
          { anim: "bar-bounce-7", dur: "0.75s" },
        ].map(({ anim, dur }, idx) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: decorative bars have no identity
            key={idx}
            style={{
              width: "3px",
              borderRadius: "2px",
              background: "oklch(0.72 0.18 175)",
              animation: `${anim} ${dur} ease-in-out infinite`,
              animationDelay: `${idx * 0.06}s`,
              boxShadow: "0 0 4px oklch(0.72 0.18 175 / 0.8)",
            }}
          />
        ))}
      </div>
    </>
  );
}

// ─── Featured Album Player — reads state from global AudioPlayerContext ───────
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
  const progressBarRef = useRef<HTMLDivElement>(null);
  const {
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    coverImageUrl,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
  } = useAudioPlayer();

  const [localVolume, setLocalVolume] = useState(volume);

  // Keep local volume slider in sync with context
  useEffect(() => {
    setLocalVolume(volume);
  }, [volume]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!duration || !progressBarRef.current) return;
      const rect = progressBarRef.current.getBoundingClientRect();
      const pct = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width),
      );
      seek(pct * duration);
    },
    [duration, seek],
  );

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (!selectedTrack) {
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
      <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
        <div
          className="flex-shrink-0 w-28 h-28 sm:w-36 sm:h-36 rounded-xl overflow-hidden relative"
          style={{
            border: "1px solid oklch(0.32 0.10 175 / 0.4)",
            boxShadow: isPlaying
              ? "0 0 30px oklch(0.72 0.18 175 / 0.35)"
              : "0 4px 20px oklch(0 0 0 / 0.4)",
          }}
        >
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
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

        <div className="flex-1 min-w-0 flex flex-col gap-4 w-full sm:w-auto">
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
              role="slider"
              tabIndex={0}
              aria-label="Seek audio"
              aria-valuemin={0}
              aria-valuemax={duration || 100}
              aria-valuenow={currentTime}
              data-ocid="album.player.canvas_target"
            >
              <div
                className="h-full rounded-full transition-all duration-100 relative"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(90deg, oklch(0.72 0.18 175), oklch(0.80 0.20 145))",
                }}
              >
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

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={togglePlay}
              disabled={isLoading}
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

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={toggleMute}
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
                value={isMuted ? 0 : localVolume}
                onChange={(e) => {
                  const v = Number.parseFloat(e.target.value);
                  setLocalVolume(v);
                  setVolume(v);
                }}
                className="w-20 h-1.5 rounded-full appearance-none cursor-pointer"
                style={{
                  accentColor: "oklch(0.72 0.18 175)",
                  background: `linear-gradient(to right, oklch(0.72 0.18 175) ${
                    (isMuted ? 0 : localVolume) * 100
                  }%, oklch(0.22 0.05 200) ${(isMuted ? 0 : localVolume) * 100}%)`,
                }}
                aria-label="Volume"
              />
            </div>

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

// ─── Inline mini TrackPlayer — delegates to global AudioPlayerContext ─────────
function TrackPlayer({ file }: { file: AudioFile }) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    isLoading,
    setTrack,
    togglePlay,
    seek,
  } = useAudioPlayer();

  const isThisTrack =
    currentTrack?.source === "local" && currentTrack.data.id === file.id;

  const displayTime = isThisTrack ? currentTime : 0;
  const displayDuration = isThisTrack ? duration : 0;
  const displayPlaying = isThisTrack && isPlaying;
  const displayLoading = isThisTrack && isLoading;

  const progress =
    displayDuration > 0 ? (displayTime / displayDuration) * 100 : 0;

  const handleClick = () => {
    if (isThisTrack) {
      togglePlay();
    } else {
      setTrack({ source: "local", data: file });
    }
  };

  return (
    <div className="flex items-center gap-2 w-full mt-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={displayLoading}
        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center transition-all duration-200"
        style={{
          background:
            "linear-gradient(135deg, oklch(0.72 0.18 175), oklch(0.65 0.22 200))",
          boxShadow: displayPlaying
            ? "0 0 10px oklch(0.72 0.18 175 / 0.6)"
            : "none",
        }}
        aria-label={displayPlaying ? "Pause" : "Play"}
      >
        {displayLoading ? (
          <Loader2 className="h-3 w-3 text-black animate-spin" />
        ) : displayPlaying ? (
          <Pause className="h-3 w-3 text-black" />
        ) : (
          <Play className="h-3 w-3 text-black ml-0.5" />
        )}
      </button>
      <div className="flex-1 min-w-0">
        <div
          className="flex justify-between text-[10px] mb-0.5"
          style={{ color: "oklch(0.55 0.08 175)" }}
        >
          <span>{formatTime(displayTime)}</span>
          <span>
            {displayDuration > 0 ? formatTime(displayDuration) : "--:--"}
          </span>
        </div>
        <div
          className="w-full h-1 rounded-full overflow-hidden cursor-pointer"
          style={{ background: "oklch(0.25 0.04 200)" }}
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={displayDuration || 100}
          aria-valuenow={displayTime}
          onClick={(e) => {
            if (!isThisTrack || !displayDuration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seek(pct * displayDuration);
          }}
          onKeyDown={(e) => {
            if (!isThisTrack || !displayDuration) return;
            if (e.key === "ArrowRight")
              seek(Math.min(displayDuration, displayTime + 5));
            if (e.key === "ArrowLeft") seek(Math.max(0, displayTime - 5));
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

// ─── Track Card (horizontal carousel item) ───────────────────────────────────
interface TrackCardProps {
  track: AudioFile;
  index: number;
  isSelected: boolean;
  isAuthenticated: boolean;
  onSelect: (track: AudioFile) => void;
  onMint: (track: AudioFile) => void;
}

function TrackCard({
  track,
  index,
  isSelected,
  isAuthenticated,
  onSelect,
  onMint,
}: TrackCardProps) {
  const [coverUrl, setCoverUrl] = useState<string | null>(null);

  useEffect(() => {
    if (track.coverImage) {
      try {
        setCoverUrl(track.coverImage.getDirectURL());
      } catch {
        setCoverUrl(null);
      }
    }
  }, [track.coverImage]);

  return (
    <li
      data-ocid={`album.collection.item.${index + 1}`}
      className="flex-shrink-0 flex flex-col rounded-2xl overflow-hidden transition-all duration-300 cursor-pointer"
      style={{
        width: "168px",
        scrollSnapAlign: "start",
        background: isSelected
          ? "oklch(0.18 0.08 175 / 0.6)"
          : "oklch(0.16 0.05 200)",
        border: isSelected
          ? "1px solid oklch(0.72 0.18 175 / 0.6)"
          : "1px solid oklch(0.24 0.06 175 / 0.3)",
        boxShadow: isSelected
          ? "0 0 24px oklch(0.72 0.18 175 / 0.25), 0 4px 16px oklch(0 0 0 / 0.4)"
          : "0 4px 12px oklch(0 0 0 / 0.3)",
      }}
    >
      {/* Cover art */}
      <button
        type="button"
        onClick={() => onSelect(track)}
        data-ocid={`album.collection.button.${index + 1}`}
        aria-label={`Load ${track.title} in player`}
        className="relative w-full flex-shrink-0 overflow-hidden group"
        style={{ height: "168px" }}
      >
        {coverUrl ? (
          <img
            src={coverUrl}
            alt={`${track.title} cover`}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: isSelected
                ? "linear-gradient(135deg, oklch(0.22 0.12 175), oklch(0.17 0.09 200))"
                : "linear-gradient(135deg, oklch(0.18 0.08 175), oklch(0.14 0.06 200))",
            }}
          >
            <Music
              className="h-10 w-10 opacity-40"
              style={{ color: "oklch(0.72 0.18 175)" }}
            />
            <span
              className="absolute bottom-2 left-2 text-xs font-bold"
              style={{ color: "oklch(0.45 0.10 175)" }}
            >
              #{index + 1}
            </span>
          </div>
        )}

        {/* Hover overlay with play icon */}
        <div
          className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
          style={{ background: "oklch(0 0 0 / 0.45)" }}
        >
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center"
            style={{
              background: "oklch(0.72 0.18 175 / 0.9)",
              boxShadow: "0 0 20px oklch(0.72 0.18 175 / 0.6)",
            }}
          >
            <Play className="h-4 w-4 text-black ml-0.5" />
          </div>
        </div>

        {/* Audio visualizer (only when selected) */}
        {isSelected && (
          <div
            className="absolute bottom-0 left-0 right-0 flex items-end justify-center pb-2"
            style={{
              background:
                "linear-gradient(to top, oklch(0 0 0 / 0.65), transparent)",
            }}
          >
            <AudioVisualizer />
          </div>
        )}

        {/* "Now Playing" glow ring when selected */}
        {isSelected && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              border: "2px solid oklch(0.72 0.18 175 / 0.5)",
              animation: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
            }}
          />
        )}
      </button>

      {/* Card body */}
      <div className="flex flex-col flex-1 p-3 gap-1">
        {/* Track title */}
        <button
          type="button"
          onClick={() => onSelect(track)}
          className="text-left w-full group/title"
          aria-label={`Select ${track.title}`}
        >
          <p
            className="text-xs font-semibold truncate leading-tight group-hover/title:opacity-80 transition-opacity"
            style={{
              color: isSelected
                ? "oklch(0.92 0.10 175)"
                : "oklch(0.85 0.06 175)",
            }}
          >
            {track.title}
          </p>
          {track.creator && (
            <p
              className="text-[10px] mt-0.5 truncate"
              style={{ color: "oklch(0.50 0.08 175)" }}
            >
              {track.creator}
            </p>
          )}
        </button>

        {/* Mini player */}
        <TrackPlayer file={track} />

        {/* Mint NFT icon button (authenticated only) */}
        {isAuthenticated && (
          <div className="flex justify-end mt-1">
            <button
              type="button"
              data-ocid={`album.track.button.${index + 1}`}
              onClick={() => onMint(track)}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-semibold tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95"
              style={{
                background: "oklch(0.78 0.20 145 / 0.14)",
                color: "oklch(0.78 0.20 145)",
                border: "1px solid oklch(0.78 0.20 145 / 0.35)",
              }}
              aria-label={`Mint NFT for ${track.title}`}
            >
              <Disc3 className="h-2.5 w-2.5" />
              <span>Mint</span>
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

// ─── Main AlbumPage ───────────────────────────────────────────────────────────
export default function AlbumPage({
  albumId,
  onNavigate: _onNavigate,
}: AlbumPageProps) {
  const [bannerError, setBannerError] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<AudioFile | null>(null);
  const [mintTrack, setMintTrack] = useState<AudioFile | null>(null);
  const [mintDialogOpen, setMintDialogOpen] = useState(false);

  const { setTrack: setGlobalTrack } = useAudioPlayer();
  const { identity } = useInternetIdentity();
  const mintMutation = useMintNFTWithParams();

  // Tracks load independently — page shell always renders regardless
  const { data: allTracks = [], isLoading: tracksLoading } = useAudioFiles();
  const albumConfig = getAlbumConfig(albumId);
  const albumTracks = allTracks.filter((t) =>
    t.title
      .toLowerCase()
      .includes(albumConfig.trackFilterKeyword.toLowerCase()),
  );
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const selectedTrackIndex = selectedTrack
    ? albumTracks.findIndex((t) => t.id === selectedTrack.id)
    : -1;

  return (
    <>
      <div
        className="min-h-screen"
        style={{ background: "oklch(0.10 0.04 200)" }}
      >
        {/* Hero Banner */}
        <div
          className="relative w-full overflow-hidden"
          style={{ height: "clamp(220px, 40vw, 480px)" }}
        >
          {!bannerError && albumConfig.bannerSrc ? (
            <img
              src={albumConfig.bannerSrc}
              alt={albumConfig.bannerAlt}
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
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(to bottom, transparent 30%, oklch(0.10 0.04 200 / 0.6) 70%, oklch(0.10 0.04 200) 100%)",
            }}
          />
        </div>

        {/* Title */}
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
            {albumConfig.displayTitle}
          </h1>
          <p
            className="mt-2 text-xs tracking-[0.4em] uppercase font-medium"
            style={{ color: "oklch(0.55 0.12 175)" }}
          >
            {albumConfig.subtitle}
          </p>
          <div
            className="mt-4 h-px w-48"
            style={{
              background:
                "linear-gradient(90deg, transparent, oklch(0.72 0.18 175), oklch(0.85 0.20 145), oklch(0.72 0.18 175), transparent)",
            }}
          />
        </div>

        {/* Page Content */}
        <div className="container mx-auto px-4 pb-16 max-w-4xl space-y-10">
          {/* Featured Player */}
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
              totalTracks={albumTracks.length}
            />
          </section>

          {/* About */}
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
                {albumConfig.about.map((paragraph) => (
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

          {/* Collection — Horizontal Carousel */}
          <section
            className="rounded-2xl overflow-hidden"
            style={{
              background: "oklch(0.13 0.05 200)",
              border: "1px solid oklch(0.28 0.08 175 / 0.4)",
              boxShadow: "0 0 40px oklch(0.72 0.18 175 / 0.06)",
            }}
          >
            {/* Section header */}
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
              {albumTracks.length > 0 && (
                <span
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    background: "oklch(0.78 0.20 145 / 0.15)",
                    color: "oklch(0.78 0.20 145)",
                    border: "1px solid oklch(0.78 0.20 145 / 0.3)",
                  }}
                >
                  {albumTracks.length}{" "}
                  {albumTracks.length === 1 ? "track" : "tracks"}
                </span>
              )}
              {albumTracks.length > 2 && (
                <span
                  className="ml-auto text-xs"
                  style={{ color: "oklch(0.42 0.06 175)" }}
                >
                  ← scroll →
                </span>
              )}
            </div>

            {/* Carousel or loading/empty state */}
            <div className="pb-6">
              {tracksLoading ? (
                <div
                  className="flex items-center justify-center py-10 gap-3"
                  data-ocid="album.collection.loading_state"
                >
                  <div
                    className="animate-spin rounded-full h-6 w-6 border-b-2"
                    style={{ borderColor: "oklch(0.72 0.18 175)" }}
                  />
                  <span
                    className="text-sm"
                    style={{ color: "oklch(0.55 0.10 175)" }}
                  >
                    Loading tracks…
                  </span>
                </div>
              ) : albumTracks.length > 0 ? (
                <ul
                  data-ocid="album.collection.list"
                  className="flex gap-4 overflow-x-auto px-6"
                  style={{
                    scrollSnapType: "x mandatory",
                    WebkitOverflowScrolling: "touch",
                    paddingBottom: "16px",
                    scrollbarWidth: "thin",
                    scrollbarColor: "oklch(0.28 0.08 175 / 0.4) transparent",
                  }}
                >
                  {albumTracks.map((track, i) => (
                    <TrackCard
                      key={track.id}
                      track={track}
                      index={i}
                      isSelected={selectedTrack?.id === track.id}
                      isAuthenticated={isAuthenticated}
                      onSelect={(t) => {
                        setSelectedTrack(t);
                        setGlobalTrack({ source: "local", data: t });
                      }}
                      onMint={(t) => {
                        setMintTrack(t);
                        setMintDialogOpen(true);
                      }}
                    />
                  ))}
                </ul>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-10 gap-3 px-6"
                  data-ocid="album.collection.empty_state"
                >
                  <Music
                    className="h-10 w-10 opacity-20"
                    style={{ color: "oklch(0.72 0.18 175)" }}
                  />
                  <p
                    className="text-sm text-center max-w-xs"
                    style={{ color: "oklch(0.45 0.06 200)" }}
                  >
                    {albumConfig.emptyStateHint}
                  </p>
                </div>
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
              audioFile: mintTrack!,
              title: data.title,
              description: data.description,
              artist: data.artist,
              fileType: data.fileType,
              price: data.price,
              stableCoin: data.stableCoin,
              royaltyPercentage: data.royaltyPercentage,
              revenueSplits: data.revenueSplits,
              editionCount: data.editionCount,
            });
            setMintDialogOpen(false);
            setMintTrack(null);
          }}
        />
      )}
    </>
  );
}

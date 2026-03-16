import { Slider } from "@/components/ui/slider";
import {
  ChevronUp,
  Cloud,
  Loader2,
  Music,
  Pause,
  Play,
  Radio,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function PersistentAudioPlayer() {
  const {
    currentTrack,
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
    openPopup,
  } = useAudioPlayer();

  if (!currentTrack) return null;

  const title =
    currentTrack.source === "audius"
      ? currentTrack.data.title
      : currentTrack.data.title;

  const artist =
    currentTrack.source === "audius" ? currentTrack.data.user.name : null;

  const artwork =
    currentTrack.source === "audius"
      ? currentTrack.data.artwork?.["150x150"] ||
        currentTrack.data.artwork?.["480x480"] ||
        null
      : coverImageUrl;

  const sourceIcon =
    currentTrack.source === "audius" ? (
      <Radio className="h-3 w-3" />
    ) : currentTrack.source === "remote" ? (
      <Cloud className="h-3 w-3" />
    ) : (
      <Upload className="h-3 w-3" />
    );

  const sourceLabel =
    currentTrack.source === "audius"
      ? "Audius"
      : currentTrack.source === "remote"
        ? "Remote"
        : "Local";

  const progress = duration > 0 ? currentTime : 0;

  return (
    <AnimatePresence>
      <motion.div
        data-ocid="persistent_player.panel"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 100, opacity: 0 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background:
            "linear-gradient(to top, oklch(0.09 0.04 220), oklch(0.11 0.05 220 / 0.97))",
          borderTop: "1px solid oklch(0.25 0.08 175 / 0.4)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 -4px 40px oklch(0 0 0 / 0.5)",
        }}
      >
        {/* Progress bar - full width, thin strip at top */}
        <div
          className="w-full cursor-pointer"
          role="slider"
          tabIndex={0}
          aria-label="Seek"
          aria-valuemin={0}
          aria-valuemax={duration || 100}
          aria-valuenow={currentTime}
          style={{ height: "3px", background: "oklch(0.20 0.04 220)" }}
          onClick={(e) => {
            if (!duration) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            seek(pct * duration);
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight")
              seek(Math.min(duration, currentTime + 5));
            if (e.key === "ArrowLeft") seek(Math.max(0, currentTime - 5));
          }}
        >
          <div
            style={{
              height: "100%",
              width: duration > 0 ? `${(currentTime / duration) * 100}%` : "0%",
              background:
                "linear-gradient(to right, oklch(0.65 0.18 175), oklch(0.72 0.20 175))",
              transition: "width 0.1s linear",
            }}
          />
        </div>

        <div className="flex items-center gap-3 px-4 py-2 md:gap-4">
          {/* Expand button + artwork */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              data-ocid="persistent_player.expand_button"
              onClick={openPopup}
              className="flex h-7 w-7 items-center justify-center rounded-full transition-all hover:scale-110"
              style={{
                background: "oklch(0.18 0.06 175 / 0.6)",
                border: "1px solid oklch(0.65 0.18 175 / 0.3)",
                color: "oklch(0.65 0.18 175)",
              }}
              aria-label="Expand player"
            >
              <ChevronUp className="h-3.5 w-3.5" />
            </button>

            <button
              type="button"
              className="h-10 w-10 flex-shrink-0 rounded-md overflow-hidden flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.18 0.10 175), oklch(0.14 0.07 200))",
                border: "1px solid oklch(0.30 0.10 175 / 0.3)",
              }}
              onClick={openPopup}
              aria-label="Open track popup"
            >
              {artwork ? (
                <img
                  src={artwork}
                  alt={title}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Music
                  className="h-5 w-5"
                  style={{ color: "oklch(0.60 0.15 175)" }}
                />
              )}
            </button>
          </div>

          {/* Track info */}
          <div className="min-w-0 flex-1">
            <p
              className="text-xs font-semibold truncate"
              style={{ color: "oklch(0.92 0.04 200)" }}
            >
              {title}
            </p>
            <div className="flex items-center gap-1.5">
              {artist && (
                <p
                  className="text-xs truncate"
                  style={{ color: "oklch(0.55 0.06 200)" }}
                >
                  {artist}
                </p>
              )}
              <span
                className="flex items-center gap-0.5 text-xs flex-shrink-0"
                style={{ color: "oklch(0.45 0.06 200)" }}
              >
                {sourceIcon}
                <span className="hidden sm:inline">{sourceLabel}</span>
              </span>
            </div>
          </div>

          {/* Center: play/pause + time */}
          <div className="flex flex-col items-center gap-1 flex-shrink-0">
            <button
              type="button"
              data-ocid="persistent_player.toggle"
              onClick={togglePlay}
              className="h-9 w-9 rounded-full flex items-center justify-center transition-all"
              style={{
                background:
                  "linear-gradient(135deg, oklch(0.65 0.18 175), oklch(0.58 0.16 160))",
                boxShadow: isPlaying
                  ? "0 0 16px oklch(0.65 0.18 175 / 0.5)"
                  : "none",
              }}
            >
              {isLoading ? (
                <Loader2
                  className="h-4 w-4 animate-spin"
                  style={{ color: "oklch(0.10 0.03 175)" }}
                />
              ) : isPlaying ? (
                <Pause
                  className="h-4 w-4"
                  style={{ color: "oklch(0.10 0.03 175)" }}
                />
              ) : (
                <Play
                  className="h-4 w-4 ml-0.5"
                  style={{ color: "oklch(0.10 0.03 175)" }}
                />
              )}
            </button>
            <div
              className="text-xs tabular-nums"
              style={{ color: "oklch(0.45 0.06 200)" }}
            >
              {formatTime(currentTime)}
              <span className="mx-0.5">/</span>
              {formatTime(duration)}
            </div>
          </div>

          {/* Seek slider - hidden on mobile */}
          <div className="hidden md:flex flex-1 max-w-xs items-center">
            <Slider
              data-ocid="persistent_player.seek_input"
              value={[progress]}
              max={duration || 100}
              step={0.5}
              onValueChange={(v) => seek(v[0])}
              className="cursor-pointer"
            />
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              data-ocid="persistent_player.volume_toggle"
              onClick={toggleMute}
              className="p-1.5 rounded transition-colors hover:bg-white/10"
              style={{ color: "oklch(0.55 0.06 200)" }}
            >
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </button>
            <div className="hidden sm:block w-20">
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.02}
                onValueChange={(v) => setVolume(v[0])}
                className="cursor-pointer"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

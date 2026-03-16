import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import {
  ChevronDown,
  Headphones,
  ListPlus,
  Loader2,
  Music,
  Pause,
  Play,
  Radio,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { usePlayCount } from "../hooks/usePlayCounts";
import { useAddTrackToPlaylist, usePlaylists } from "../hooks/useQueries";

function formatTime(s: number) {
  if (!Number.isFinite(s) || s < 0) return "0:00";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export function TrackPopupPlayer() {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    coverImageUrl,
    repeat,
    shuffle,
    isPopupOpen,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleRepeat,
    toggleShuffle,
    playNext,
    playPrev,
    closePopup,
  } = useAudioPlayer();

  const { data: playlists = [] } = usePlaylists();
  const addToPlaylist = useAddTrackToPlaylist();

  const trackId = currentTrack?.data.id;
  const playCount = usePlayCount(trackId);

  if (!currentTrack) return null;

  const title =
    currentTrack.source === "audius"
      ? currentTrack.data.title
      : currentTrack.data.title;

  const artist =
    currentTrack.source === "audius"
      ? currentTrack.data.user.name
      : currentTrack.source === "local" || currentTrack.source === "remote"
        ? currentTrack.data.creator
        : null;

  const artwork =
    currentTrack.source === "audius"
      ? currentTrack.data.artwork?.["480x480"] ||
        currentTrack.data.artwork?.["150x150"] ||
        null
      : coverImageUrl;

  const sourceLabel = currentTrack.source === "audius" ? "Audius" : "Local";

  const progress = duration > 0 ? currentTime : 0;

  const handleShare = () => {
    const id = currentTrack.data.id;
    const url = `${window.location.origin}${window.location.pathname}?track=${encodeURIComponent(id)}`;
    navigator.clipboard
      .writeText(url)
      .then(() => {
        toast.success("Link copied to clipboard!");
      })
      .catch(() => {
        toast.error("Could not copy link");
      });
  };

  return (
    <AnimatePresence>
      {isPopupOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="popup-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-[59]"
            style={{
              background: "oklch(0.05 0.02 220 / 0.85)",
              backdropFilter: "blur(12px)",
            }}
            onClick={closePopup}
          />

          {/* Panel */}
          <motion.div
            key="popup-panel"
            data-ocid="track_popup.panel"
            initial={{ scale: 0.92, opacity: 0, y: 24 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 24 }}
            transition={{ type: "spring", stiffness: 340, damping: 28 }}
            className="fixed inset-x-4 bottom-24 sm:bottom-20 z-[60] mx-auto max-w-md rounded-2xl overflow-hidden max-h-[85vh] overflow-y-auto"
            style={{
              background:
                "linear-gradient(160deg, oklch(0.13 0.06 220), oklch(0.09 0.04 195))",
              border: "1px solid oklch(0.25 0.10 175 / 0.45)",
              boxShadow:
                "0 24px 80px oklch(0 0 0 / 0.7), 0 0 0 1px oklch(0.65 0.18 175 / 0.08) inset",
            }}
          >
            {/* Top bar */}
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <span
                className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium"
                style={{
                  background: "oklch(0.65 0.18 175 / 0.15)",
                  color: "oklch(0.72 0.20 175)",
                  border: "1px solid oklch(0.65 0.18 175 / 0.25)",
                }}
              >
                <Radio className="h-3 w-3" />
                {sourceLabel}
              </span>

              <div className="flex items-center gap-2">
                {/* Share button */}
                <button
                  type="button"
                  data-ocid="track_popup.share_button"
                  onClick={handleShare}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{
                    background: "oklch(0.20 0.05 220 / 0.8)",
                    color: "oklch(0.65 0.08 200)",
                  }}
                  aria-label="Share track"
                >
                  <Share2 className="h-4 w-4" />
                </button>

                {/* Close button */}
                <button
                  type="button"
                  data-ocid="track_popup.close_button"
                  onClick={closePopup}
                  className="flex h-8 w-8 items-center justify-center rounded-full transition-colors"
                  style={{
                    background: "oklch(0.20 0.05 220 / 0.8)",
                    color: "oklch(0.65 0.08 200)",
                  }}
                  aria-label="Collapse player"
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Cover Art */}
            <div className="flex justify-center px-6 py-3 sm:py-5">
              <div
                className="relative h-40 w-40 sm:h-56 sm:w-56 rounded-xl overflow-hidden flex-shrink-0"
                style={{
                  boxShadow: isPlaying
                    ? "0 0 0 3px oklch(0.65 0.18 175 / 0.3), 0 12px 48px oklch(0.65 0.18 175 / 0.35)"
                    : "0 8px 32px oklch(0 0 0 / 0.5)",
                  transition: "box-shadow 0.4s ease",
                }}
              >
                {artwork ? (
                  <img
                    src={artwork}
                    alt={title}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div
                    className="h-full w-full flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, oklch(0.20 0.12 175), oklch(0.15 0.08 200))",
                    }}
                  >
                    <Music
                      className="h-16 w-16"
                      style={{ color: "oklch(0.60 0.15 175)" }}
                    />
                  </div>
                )}

                {/* Pulsing glow ring when playing */}
                {isPlaying && (
                  <motion.div
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    animate={{ opacity: [0.4, 0.1, 0.4] }}
                    transition={{
                      duration: 2,
                      repeat: Number.POSITIVE_INFINITY,
                      ease: "easeInOut",
                    }}
                    style={{
                      boxShadow: "inset 0 0 20px oklch(0.65 0.18 175 / 0.3)",
                    }}
                  />
                )}
              </div>
            </div>

            {/* Track info */}
            <div className="px-6 pb-2 text-center">
              <h2
                className="text-lg font-bold truncate"
                style={{ color: "oklch(0.94 0.04 200)" }}
              >
                {title}
              </h2>
              {artist && (
                <p
                  className="text-sm mt-0.5 truncate"
                  style={{ color: "oklch(0.55 0.06 200)" }}
                >
                  {artist}
                </p>
              )}
              {/* Play count */}
              <div className="flex items-center justify-center gap-3 pt-1.5 pb-1">
                <span
                  className="flex items-center gap-1 text-xs"
                  style={{ color: "oklch(0.50 0.06 200)" }}
                >
                  <Headphones className="h-3.5 w-3.5" />
                  {playCount} {playCount === 1 ? "play" : "plays"}
                </span>
              </div>
            </div>

            {/* Progress */}
            <div className="px-5 pb-3">
              <Slider
                value={[progress]}
                max={duration || 100}
                step={0.5}
                onValueChange={(v) => seek(v[0])}
                className="cursor-pointer"
              />
              <div className="flex justify-between mt-1">
                <span
                  className="text-xs tabular-nums"
                  style={{ color: "oklch(0.45 0.06 200)" }}
                >
                  {formatTime(currentTime)}
                </span>
                <span
                  className="text-xs tabular-nums"
                  style={{ color: "oklch(0.45 0.06 200)" }}
                >
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Main Controls */}
            <div className="flex items-center justify-center gap-6 pb-4 px-5">
              <button
                type="button"
                data-ocid="track_popup.prev_button"
                onClick={playPrev}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
                style={{ color: "oklch(0.65 0.08 200)" }}
                aria-label="Previous track"
              >
                <SkipBack className="h-5 w-5" />
              </button>

              <button
                type="button"
                data-ocid="track_popup.toggle"
                onClick={togglePlay}
                className="flex h-14 w-14 items-center justify-center rounded-full transition-all"
                style={{
                  background:
                    "linear-gradient(135deg, oklch(0.65 0.18 175), oklch(0.58 0.16 160))",
                  boxShadow: isPlaying
                    ? "0 0 24px oklch(0.65 0.18 175 / 0.55)"
                    : "0 4px 16px oklch(0 0 0 / 0.4)",
                  transform: isPlaying ? "scale(1.05)" : "scale(1)",
                  transition: "all 0.2s ease",
                }}
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <Loader2
                    className="h-6 w-6 animate-spin"
                    style={{ color: "oklch(0.10 0.03 175)" }}
                  />
                ) : isPlaying ? (
                  <Pause
                    className="h-6 w-6"
                    style={{ color: "oklch(0.10 0.03 175)" }}
                  />
                ) : (
                  <Play
                    className="h-6 w-6 ml-0.5"
                    style={{ color: "oklch(0.10 0.03 175)" }}
                  />
                )}
              </button>

              <button
                type="button"
                data-ocid="track_popup.next_button"
                onClick={playNext}
                className="flex h-10 w-10 items-center justify-center rounded-full transition-all"
                style={{ color: "oklch(0.65 0.08 200)" }}
                aria-label="Next track"
              >
                <SkipForward className="h-5 w-5" />
              </button>
            </div>

            {/* Mode Controls */}
            <div className="flex items-center justify-center gap-4 pb-4">
              <button
                type="button"
                data-ocid="track_popup.repeat_toggle"
                onClick={toggleRepeat}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
                style={{
                  background: repeat
                    ? "oklch(0.65 0.18 175 / 0.18)"
                    : "transparent",
                  color: repeat
                    ? "oklch(0.72 0.20 175)"
                    : "oklch(0.45 0.06 200)",
                  boxShadow: repeat
                    ? "0 0 10px oklch(0.65 0.18 175 / 0.35)"
                    : "none",
                  border: `1px solid ${repeat ? "oklch(0.65 0.18 175 / 0.4)" : "oklch(0.25 0.05 220 / 0.5)"}`,
                }}
                aria-label={repeat ? "Repeat on" : "Repeat off"}
                aria-pressed={repeat}
              >
                <Repeat1 className="h-4 w-4" />
              </button>

              <button
                type="button"
                data-ocid="track_popup.shuffle_toggle"
                onClick={toggleShuffle}
                className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
                style={{
                  background: shuffle
                    ? "oklch(0.65 0.18 175 / 0.18)"
                    : "transparent",
                  color: shuffle
                    ? "oklch(0.72 0.20 175)"
                    : "oklch(0.45 0.06 200)",
                  boxShadow: shuffle
                    ? "0 0 10px oklch(0.65 0.18 175 / 0.35)"
                    : "none",
                  border: `1px solid ${shuffle ? "oklch(0.65 0.18 175 / 0.4)" : "oklch(0.25 0.05 220 / 0.5)"}`,
                }}
                aria-label={shuffle ? "Shuffle on" : "Shuffle off"}
                aria-pressed={shuffle}
              >
                <Shuffle className="h-4 w-4" />
              </button>

              {/* Add to Playlist */}
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    data-ocid="track_popup.add_to_playlist_button"
                    className="flex h-9 w-9 items-center justify-center rounded-full transition-all"
                    style={{
                      background: "transparent",
                      color: "oklch(0.45 0.06 200)",
                      border: "1px solid oklch(0.25 0.05 220 / 0.5)",
                    }}
                    aria-label="Add to playlist"
                  >
                    <ListPlus className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-56 p-2"
                  align="center"
                  side="top"
                  style={{
                    background: "oklch(0.14 0.06 220)",
                    border: "1px solid oklch(0.25 0.08 200 / 0.5)",
                    zIndex: 9999,
                  }}
                >
                  <p
                    className="text-xs font-medium px-2 pb-2"
                    style={{ color: "oklch(0.55 0.06 200)" }}
                  >
                    Add to Playlist
                  </p>
                  {playlists.length === 0 && (
                    <p
                      className="text-xs px-2 py-1"
                      style={{ color: "oklch(0.45 0.05 200)" }}
                    >
                      No playlists yet
                    </p>
                  )}
                  {playlists.map((pl) => (
                    <button
                      key={pl.id}
                      type="button"
                      className="w-full text-left text-sm px-2 py-1.5 rounded transition-colors"
                      style={{ color: "oklch(0.80 0.04 200)" }}
                      onMouseEnter={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "oklch(0.20 0.06 200 / 0.5)";
                      }}
                      onMouseLeave={(e) => {
                        (
                          e.currentTarget as HTMLButtonElement
                        ).style.background = "transparent";
                      }}
                      onClick={() => {
                        if (!trackId) return;
                        addToPlaylist.mutate({ playlistId: pl.id, trackId });
                        toast.success(`Added to ${pl.title}`);
                      }}
                    >
                      {pl.title}
                    </button>
                  ))}
                </PopoverContent>
              </Popover>
            </div>

            {/* Volume */}
            <div className="flex items-center gap-3 px-5 pb-5">
              <button
                type="button"
                onClick={toggleMute}
                className="flex-shrink-0 transition-colors"
                style={{ color: "oklch(0.50 0.06 200)" }}
                aria-label={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </button>
              <Slider
                value={[isMuted ? 0 : volume]}
                max={1}
                step={0.02}
                onValueChange={(v) => setVolume(v[0])}
                className="flex-1 cursor-pointer"
              />
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

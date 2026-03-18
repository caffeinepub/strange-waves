import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { incrementPlayCount } from "../hooks/usePlayCounts";
import type { CombinedAudio } from "../hooks/useQueries";
import { getAudiusStreamUrl } from "../lib/audiusApi";

interface AudioPlayerState {
  currentTrack: CombinedAudio | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  audioUrl: string;
  coverImageUrl: string | null;
  isLoading: boolean;
  repeat: boolean;
  shuffle: boolean;
  trackList: CombinedAudio[];
  isPopupOpen: boolean;
  setTrack: (audio: CombinedAudio) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  setTrackList: (tracks: CombinedAudio[]) => void;
  playNext: () => void;
  playPrev: () => void;
  toggleRepeat: () => void;
  toggleShuffle: () => void;
  openPopup: () => void;
  closePopup: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerState | null>(null);

export function AudioPlayerProvider({
  children,
}: { children: React.ReactNode }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const blobUrlsRef = useRef<string[]>([]);

  const [currentTrack, setCurrentTrack] = useState<CombinedAudio | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [trackList, setTrackList] = useState<CombinedAudio[]>([]);
  const [isPopupOpen, setIsPopupOpen] = useState(false);

  // Keep refs for use inside event handlers without stale closures
  const repeatRef = useRef(repeat);
  const shuffleRef = useRef(shuffle);
  const trackListRef = useRef(trackList);
  const currentTrackRef = useRef(currentTrack);
  const volumeRef = useRef(volume);
  const isMutedRef = useRef(isMuted);
  const audioUrlRef = useRef(audioUrl);
  const isPlayingRef = useRef(isPlaying);

  useEffect(() => {
    repeatRef.current = repeat;
  }, [repeat]);
  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);
  useEffect(() => {
    trackListRef.current = trackList;
  }, [trackList]);
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);
  useEffect(() => {
    audioUrlRef.current = audioUrl;
  }, [audioUrl]);
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      for (const url of blobUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const setTrack = useCallback(async (audio: CombinedAudio) => {
    // Revoke previous blob URLs
    for (const url of blobUrlsRef.current) {
      URL.revokeObjectURL(url);
    }
    blobUrlsRef.current = [];

    setCurrentTrack(audio);
    setIsLoading(true);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setCoverImageUrl(null);

    try {
      let url = "";
      if (audio.source === "local" || audio.source === "remote") {
        try {
          url = audio.data.blob.getDirectURL();
        } catch {
          const bytes = await audio.data.blob.getBytes();
          const blob = new Blob([bytes], { type: "audio/mpeg" });
          url = URL.createObjectURL(blob);
          blobUrlsRef.current.push(url);
        }

        if (audio.data.coverImage) {
          try {
            const imgUrl = audio.data.coverImage.getDirectURL();
            setCoverImageUrl(imgUrl);
          } catch {
            try {
              const imgBytes = await audio.data.coverImage.getBytes();
              const imgBlob = new Blob([imgBytes], { type: "image/jpeg" });
              const imgUrl = URL.createObjectURL(imgBlob);
              blobUrlsRef.current.push(imgUrl);
              setCoverImageUrl(imgUrl);
            } catch {
              setCoverImageUrl(null);
            }
          }
        }
      } else if (audio.source === "audius") {
        url = await getAudiusStreamUrl(audio.data.id);
        const artworkUrl =
          audio.data.artwork?.["480x480"] ||
          audio.data.artwork?.["150x150"] ||
          null;
        setCoverImageUrl(artworkUrl ?? null);
      }

      setAudioUrl(url);
    } catch (err) {
      console.error("[AudioPlayerContext] Failed to load audio:", err);
      setCurrentTrack(null);
      setIsLoading(false);
    }
  }, []);

  const play = useCallback(() => {
    audioRef.current?.play().catch(() => {});
  }, []);

  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || !audioUrlRef.current) return;
    if (isPlayingRef.current) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  }, []);

  const seek = useCallback((time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  }, []);

  const handleSetVolume = useCallback((v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setVolume(v);
    if (v > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    if (!audioRef.current) return;
    if (isMutedRef.current) {
      audioRef.current.volume = volumeRef.current || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  }, []);

  const toggleRepeat = useCallback(() => setRepeat((r) => !r), []);
  const toggleShuffle = useCallback(() => setShuffle((s) => !s), []);
  const openPopup = useCallback(() => setIsPopupOpen(true), []);
  const closePopup = useCallback(() => setIsPopupOpen(false), []);

  const playNext = useCallback(() => {
    const list = trackListRef.current;
    const current = currentTrackRef.current;
    if (list.length === 0) return;

    if (shuffleRef.current) {
      const idx = Math.floor(Math.random() * list.length);
      setTrack(list[idx]);
      return;
    }

    if (!current) {
      setTrack(list[0]);
      return;
    }

    const currentIdx = list.findIndex((t) => {
      if (t.source !== current.source) return false;
      if (t.source === "audius" && current.source === "audius") {
        return t.data.id === current.data.id;
      }
      if (
        (t.source === "local" || t.source === "remote") &&
        (current.source === "local" || current.source === "remote")
      ) {
        return t.data.id === current.data.id;
      }
      return false;
    });

    const nextIdx = currentIdx === -1 ? 0 : (currentIdx + 1) % list.length;
    setTrack(list[nextIdx]);
  }, [setTrack]);

  const playPrev = useCallback(() => {
    const list = trackListRef.current;
    const current = currentTrackRef.current;

    // If more than 3 seconds in, restart instead
    if (audioRef.current && audioRef.current.currentTime > 3) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }

    if (list.length === 0) return;

    if (!current) {
      setTrack(list[0]);
      return;
    }

    const currentIdx = list.findIndex((t) => {
      if (t.source !== current.source) return false;
      if (t.source === "audius" && current.source === "audius") {
        return t.data.id === current.data.id;
      }
      if (
        (t.source === "local" || t.source === "remote") &&
        (current.source === "local" || current.source === "remote")
      ) {
        return t.data.id === current.data.id;
      }
      return false;
    });

    const prevIdx = currentIdx <= 0 ? list.length - 1 : currentIdx - 1;
    setTrack(list[prevIdx]);
  }, [setTrack]);

  const handleEnded = useCallback(() => {
    if (repeatRef.current) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else if (trackListRef.current.length > 1) {
      playNext();
    } else {
      setIsPlaying(false);
      setCurrentTime(0);
    }
  }, [playNext]);

  const handlePlay = useCallback(() => {
    setIsPlaying(true);
    const track = currentTrackRef.current;
    if (track) {
      incrementPlayCount(track.data.id);
    }
  }, []);

  return (
    <AudioPlayerContext.Provider
      value={{
        currentTrack,
        isPlaying,
        currentTime,
        duration,
        volume,
        isMuted,
        audioUrl,
        coverImageUrl,
        isLoading,
        repeat,
        shuffle,
        trackList,
        isPopupOpen,
        setTrack,
        play,
        pause,
        togglePlay,
        seek,
        setVolume: handleSetVolume,
        toggleMute,
        setTrackList,
        playNext,
        playPrev,
        toggleRepeat,
        toggleShuffle,
        openPopup,
        closePopup,
      }}
    >
      {children}
      {/* biome-ignore lint/a11y/useMediaCaption: global music streaming player */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        onPlay={handlePlay}
        onPause={() => setIsPlaying(false)}
        onEnded={handleEnded}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
            audioRef.current.volume = isMutedRef.current
              ? 0
              : volumeRef.current;
            setIsLoading(false);
            audioRef.current.play().catch(() => {});
          }
        }}
        onCanPlay={() => setIsLoading(false)}
        onWaiting={() => setIsLoading(true)}
        onError={() => setIsLoading(false)}
        style={{ display: "none" }}
      />
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer(): AudioPlayerState {
  const ctx = useContext(AudioPlayerContext);
  if (!ctx)
    throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return ctx;
}

import { createContext, useContext, useEffect, useRef, useState } from "react";
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
  setTrack: (audio: CombinedAudio) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  seek: (time: number) => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
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

  // Cleanup blob URLs on unmount
  useEffect(() => {
    return () => {
      for (const url of blobUrlsRef.current) {
        URL.revokeObjectURL(url);
      }
    };
  }, []);

  const setTrack = async (audio: CombinedAudio) => {
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
        // Try getDirectURL first (faster), fall back to blob
        try {
          url = audio.data.blob.getDirectURL();
        } catch {
          const bytes = await audio.data.blob.getBytes();
          const blob = new Blob([bytes], { type: "audio/mpeg" });
          url = URL.createObjectURL(blob);
          blobUrlsRef.current.push(url);
        }

        // Load cover image
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
        url = getAudiusStreamUrl(audio.data.id);
        // Audius artwork
        const artworkUrl =
          audio.data.artwork?.["480x480"] ||
          audio.data.artwork?.["150x150"] ||
          null;
        setCoverImageUrl(artworkUrl ?? null);
      }

      setAudioUrl(url);
    } catch (err) {
      console.error("[AudioPlayerContext] Failed to load audio:", err);
      setIsLoading(false);
    }
  };

  const play = () => {
    audioRef.current?.play().catch(() => {});
  };

  const pause = () => {
    audioRef.current?.pause();
  };

  const togglePlay = () => {
    if (!audioRef.current || !audioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {});
    }
  };

  const seek = (time: number) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const handleSetVolume = (v: number) => {
    if (audioRef.current) audioRef.current.volume = v;
    setVolume(v);
    if (v > 0) setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioRef.current.volume = 0;
      setIsMuted(true);
    }
  };

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
        setTrack,
        play,
        pause,
        togglePlay,
        seek,
        setVolume: handleSetVolume,
        toggleMute,
      }}
    >
      {children}
      {/* biome-ignore lint/a11y/useMediaCaption: global music streaming player */}
      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        preload="metadata"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
        }}
        onTimeUpdate={() => {
          if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
        }}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
            audioRef.current.volume = isMuted ? 0 : volume;
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

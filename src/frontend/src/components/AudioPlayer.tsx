import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import {
  Cloud,
  Music,
  Pause,
  Play,
  Radio,
  Upload,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { CombinedAudio } from "../hooks/useQueries";
import { getAudiusStreamUrl } from "../lib/audiusApi";

interface AudioPlayerProps {
  audio: CombinedAudio;
}

export function AudioPlayer({ audio }: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string>("");
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null);

  useEffect(() => {
    let createdUrls: string[] = [];

    const loadAudio = async () => {
      if (audio.source === "local" || audio.source === "remote") {
        const blob = await audio.data.blob.getBytes();
        const url = URL.createObjectURL(
          new Blob([blob], { type: "audio/mpeg" }),
        );
        createdUrls.push(url);
        setAudioUrl(url);

        // Load cover image if available
        if (audio.data.coverImage) {
          try {
            const imageBytes = await audio.data.coverImage.getBytes();
            const imageBlob = new Blob([imageBytes], { type: "image/jpeg" });
            const imageUrl = URL.createObjectURL(imageBlob);
            createdUrls.push(imageUrl);
            setCoverImageUrl(imageUrl);
          } catch (error) {
            console.error("Failed to load cover image:", error);
            setCoverImageUrl(null);
          }
        } else {
          setCoverImageUrl(null);
        }
        return;
      }
      if (audio.source === "audius") {
        const url = getAudiusStreamUrl(audio.data.id);
        setAudioUrl(url);
        setCoverImageUrl(null);
      }
    };

    loadAudio();
    setIsPlaying(false);
    setCurrentTime(0);

    return () => {
      for (const u of createdUrls) URL.revokeObjectURL(u);
    };
  }, [audio]);

  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const updateTime = () => setCurrentTime(audioElement.currentTime);
    const updateDuration = () => setDuration(audioElement.duration);
    const handleEnded = () => setIsPlaying(false);

    audioElement.addEventListener("timeupdate", updateTime);
    audioElement.addEventListener("loadedmetadata", updateDuration);
    audioElement.addEventListener("ended", handleEnded);

    return () => {
      audioElement.removeEventListener("timeupdate", updateTime);
      audioElement.removeEventListener("loadedmetadata", updateDuration);
      audioElement.removeEventListener("ended", handleEnded);
    };
  }, []);

  const togglePlay = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = value[0];
    setCurrentTime(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    if (!audioRef.current) return;
    const newVolume = value[0];
    audioRef.current.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
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

  const formatTime = (time: number) => {
    if (Number.isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getSourceIcon = () => {
    if (audio.source === "audius") return <Radio className="h-4 w-4" />;
    if (audio.source === "remote") return <Cloud className="h-4 w-4" />;
    return <Upload className="h-4 w-4" />;
  };

  const getSourceLabel = () => {
    if (audio.source === "audius") return "Audius";
    if (audio.source === "remote") return "Remote";
    return "Local";
  };

  const getTitle = () => {
    if (audio.source === "audius") return audio.data.title;
    return audio.data.title;
  };

  const getArtist = () => {
    if (audio.source === "audius") return audio.data.user.name;
    return null;
  };

  const getArtwork = () => {
    if (audio.source === "audius" && audio.data.artwork?.["480x480"]) {
      return audio.data.artwork["480x480"];
    }
    if (
      (audio.source === "local" || audio.source === "remote") &&
      coverImageUrl
    ) {
      return coverImageUrl;
    }
    return null;
  };

  return (
    <Card className="border-2 bg-gradient-to-br from-primary/5 to-accent/5">
      <CardContent className="p-6">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {/* Artwork */}
          <div className="flex shrink-0 items-center justify-center">
            {getArtwork() ? (
              <img
                src={getArtwork()!}
                alt={getTitle()}
                className="h-32 w-32 rounded-lg object-cover shadow-lg"
              />
            ) : (
              <div className="flex h-32 w-32 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent shadow-lg">
                <Music className="h-16 w-16 text-primary-foreground" />
              </div>
            )}
          </div>

          {/* Player Controls */}
          <div className="flex-1 space-y-4">
            {/* Track Info */}
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-bold">{getTitle()}</h3>
                <Badge
                  variant={
                    audio.source === "audius"
                      ? "outline"
                      : audio.source === "remote"
                        ? "outline"
                        : "secondary"
                  }
                >
                  {getSourceIcon()}
                  <span className="ml-1">{getSourceLabel()}</span>
                </Badge>
              </div>
              {getArtist() && (
                <p className="text-sm text-muted-foreground">{getArtist()}</p>
              )}
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <Slider
                value={[currentTime]}
                max={duration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                onClick={togglePlay}
                className="h-12 w-12 rounded-full"
              >
                {isPlaying ? (
                  <Pause className="h-5 w-5" />
                ) : (
                  <Play className="h-5 w-5" />
                )}
              </Button>

              <div className="flex flex-1 items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  className="shrink-0"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                <Slider
                  value={[isMuted ? 0 : volume]}
                  max={1}
                  step={0.01}
                  onValueChange={handleVolumeChange}
                  className="w-24 cursor-pointer"
                />
              </div>
            </div>
          </div>
        </div>

        {/* biome-ignore lint/a11y/useMediaCaption: audio player for music streaming, captions not applicable */}
        <audio ref={audioRef} src={audioUrl} preload="metadata" />
      </CardContent>
    </Card>
  );
}

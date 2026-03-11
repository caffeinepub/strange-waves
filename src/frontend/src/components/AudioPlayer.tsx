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
import { useEffect } from "react";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import type { CombinedAudio } from "../hooks/useQueries";

interface AudioPlayerProps {
  audio: CombinedAudio;
}

export function AudioPlayer({ audio }: AudioPlayerProps) {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    coverImageUrl,
    setTrack,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
  } = useAudioPlayer();

  // Load this audio into the global player when the prop changes
  useEffect(() => {
    setTrack(audio);
  }, [audio, setTrack]);

  const isThisTrackActive =
    currentTrack !== null &&
    ((currentTrack.source === "local" &&
      audio.source === "local" &&
      currentTrack.data.id === audio.data.id) ||
      (currentTrack.source === "audius" &&
        audio.source === "audius" &&
        currentTrack.data.id === audio.data.id));

  const displayTime = isThisTrackActive ? currentTime : 0;
  const displayDuration = isThisTrackActive ? duration : 0;
  const displayPlaying = isThisTrackActive && isPlaying;

  const handleSeek = (value: number[]) => {
    if (isThisTrackActive) seek(value[0]);
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
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

  const getTitle = () => audio.data.title;

  const getArtist = () => {
    if (audio.source === "audius") return audio.data.user.name;
    return null;
  };

  const getArtwork = () => {
    if (audio.source === "audius" && audio.data.artwork?.["480x480"]) {
      return audio.data.artwork["480x480"];
    }
    if (isThisTrackActive && coverImageUrl) return coverImageUrl;
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
                value={[displayTime]}
                max={displayDuration || 100}
                step={0.1}
                onValueChange={handleSeek}
                className="cursor-pointer"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{formatTime(displayTime)}</span>
                <span>{formatTime(displayDuration)}</span>
              </div>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-4">
              <Button
                size="lg"
                onClick={togglePlay}
                className="h-12 w-12 rounded-full"
              >
                {displayPlaying ? (
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
      </CardContent>
    </Card>
  );
}

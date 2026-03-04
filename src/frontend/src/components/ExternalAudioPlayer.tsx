/**
 * External Audio Player Component
 *
 * A standalone React component for embedding audio playback from the audio
 * streaming canister into external applications. This component handles
 * fetching metadata and streaming audio directly from the canister.
 *
 * @example Basic Usage in External App
 * ```tsx
 * import { ExternalAudioPlayer } from './ExternalAudioPlayer';
 * import { useActor } from '../hooks/useActor';
 *
 * function MyApp() {
 *   const { actor } = useActor();
 *
 *   return (
 *     <ExternalAudioPlayer
 *       canisterId="rrkah-fqaaa-aaaaa-aaaaq-cai"
 *       fileId="audio-123"
 *       title="My Audio Track"
 *       actor={actor}
 *     />
 *   );
 * }
 * ```
 *
 * @example With Dynamic File Selection
 * ```tsx
 * import { ExternalAudioPlayer } from './ExternalAudioPlayer';
 * import { listAudioFiles } from '../lib/audioApiClient';
 * import { useActor } from '../hooks/useActor';
 *
 * function AudioGallery() {
 *   const [files, setFiles] = useState([]);
 *   const [selectedId, setSelectedId] = useState(null);
 *   const { actor } = useActor();
 *   const canisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
 *
 *   useEffect(() => {
 *     if (actor) {
 *       listAudioFiles(canisterId, actor).then(setFiles);
 *     }
 *   }, [actor]);
 *
 *   return (
 *     <div>
 *       <select onChange={(e) => setSelectedId(e.target.value)}>
 *         {files.map(f => <option key={f.id} value={f.id}>{f.title}</option>)}
 *       </select>
 *       {selectedId && (
 *         <ExternalAudioPlayer
 *           canisterId={canisterId}
 *           fileId={selectedId}
 *           actor={actor}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * @example Iframe Embedding
 * You can also create a standalone page with this component and embed it via iframe:
 * ```html
 * <iframe
 *   src="https://your-app.ic0.app/player?canisterId=xxx&fileId=yyy"
 *   width="400"
 *   height="200"
 *   frameborder="0"
 * ></iframe>
 * ```
 */

import { Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import {
  type AudioMetadata,
  getAudioMetadata,
  streamAudio,
} from "../lib/audioApiClient";

export interface ExternalAudioPlayerProps {
  /** The canister ID of the audio streaming application */
  canisterId: string;
  /** The unique identifier of the audio file to play */
  fileId: string;
  /** The backend actor instance (required for metadata fetching) */
  actor?: any;
  /** Optional title override (if not provided, fetches from canister) */
  title?: string;
  /** Optional IC host URL (defaults to current host or ic0.app) */
  host?: string;
  /** Optional className for custom styling */
  className?: string;
  /** Whether to show minimal controls (default: false) */
  minimal?: boolean;
}

/**
 * ExternalAudioPlayer - A standalone audio player component for external integration
 *
 * This component provides a complete audio playback experience with controls
 * for play/pause, seeking, and volume. It streams audio directly from the
 * Internet Computer canister without requiring the full application context.
 */
export function ExternalAudioPlayer({
  canisterId,
  fileId,
  actor,
  title: providedTitle,
  host,
  className = "",
  minimal = false,
}: ExternalAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<AudioMetadata | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch metadata if title not provided
  useEffect(() => {
    if (!providedTitle && actor) {
      setIsLoading(true);
      getAudioMetadata(canisterId, fileId, actor)
        .then(setMetadata)
        .catch((err) => {
          console.error("Failed to fetch metadata:", err);
          setError("Failed to load audio metadata");
        })
        .finally(() => setIsLoading(false));
    } else if (providedTitle) {
      setIsLoading(false);
    }
  }, [canisterId, fileId, providedTitle, actor]);

  // Setup audio element
  useEffect(() => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const audioUrl = streamAudio(canisterId, fileId, host);
    audioElement.src = audioUrl;
    audioElement.load();

    const handleLoadedMetadata = () => {
      setDuration(audioElement.duration);
      setIsLoading(false);
      setError(null);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audioElement.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setError("Failed to load audio file");
      setIsLoading(false);
    };

    audioElement.addEventListener("loadedmetadata", handleLoadedMetadata);
    audioElement.addEventListener("timeupdate", handleTimeUpdate);
    audioElement.addEventListener("ended", handleEnded);
    audioElement.addEventListener("error", handleError);

    return () => {
      audioElement.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audioElement.removeEventListener("timeupdate", handleTimeUpdate);
      audioElement.removeEventListener("ended", handleEnded);
      audioElement.removeEventListener("error", handleError);
      audioElement.pause();
    };
  }, [canisterId, fileId, host]);

  const togglePlayPause = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isPlaying) {
      audioElement.pause();
    } else {
      audioElement.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const newTime = Number.parseFloat(e.target.value);
    audioElement.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    const newVolume = Number.parseFloat(e.target.value);
    audioElement.volume = newVolume;
    setVolume(newVolume);
    setIsMuted(newVolume === 0);
  };

  const toggleMute = () => {
    const audioElement = audioRef.current;
    if (!audioElement) return;

    if (isMuted) {
      audioElement.volume = volume || 0.5;
      setIsMuted(false);
    } else {
      audioElement.volume = 0;
      setIsMuted(true);
    }
  };

  const formatTime = (time: number) => {
    if (Number.isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const displayTitle = providedTitle || metadata?.title || "Loading...";

  if (error) {
    return (
      <div
        className={`rounded-lg border border-red-500 bg-red-50 p-4 text-red-800 ${className}`}
      >
        <p className="font-semibold">Error</p>
        <p className="text-sm">{error}</p>
      </div>
    );
  }

  if (minimal) {
    return (
      <div
        className={`flex items-center gap-3 rounded-lg border bg-white p-3 shadow-sm ${className}`}
      >
        {/* biome-ignore lint/a11y/useMediaCaption: music streaming player, captions not applicable */}
        <audio ref={audioRef} preload="metadata" />
        <button
          type="button"
          onClick={togglePlayPause}
          disabled={isLoading}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        </button>
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-900">{displayTitle}</p>
          <p className="text-xs text-gray-500">
            {formatTime(currentTime)} / {formatTime(duration)}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border bg-white p-6 shadow-lg ${className}`}>
      {/* biome-ignore lint/a11y/useMediaCaption: music streaming player, captions not applicable */}
      <audio ref={audioRef} preload="metadata" />

      <div className="space-y-4">
        {/* Track Info */}
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-900">{displayTitle}</h3>
          <p className="text-sm text-gray-500">Now Playing</p>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <input
            type="range"
            min="0"
            max={duration || 100}
            step="0.1"
            value={currentTime}
            onChange={handleSeek}
            disabled={isLoading}
            className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-600 disabled:opacity-50"
            style={{
              background: `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${(currentTime / duration) * 100}%, rgb(229, 231, 235) ${(currentTime / duration) * 100}%, rgb(229, 231, 235) 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={togglePlayPause}
            disabled={isLoading}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
            aria-label={isPlaying ? "Pause" : "Play"}
          >
            {isPlaying ? <Pause size={24} /> : <Play size={24} />}
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggleMute}
            className="text-gray-600 hover:text-gray-900"
            aria-label={isMuted ? "Unmute" : "Mute"}
          >
            {isMuted || volume === 0 ? (
              <VolumeX size={20} />
            ) : (
              <Volume2 size={20} />
            )}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={handleVolumeChange}
            className="h-2 w-24 cursor-pointer appearance-none rounded-lg bg-gray-200 accent-purple-600"
          />
        </div>
      </div>
    </div>
  );
}

/**
 * Integration Examples and Documentation
 * ======================================
 *
 * ## Installation in External App
 *
 * 1. Copy the following files to your React project:
 *    - lib/audioApiClient.ts
 *    - components/ExternalAudioPlayer.tsx
 *    - hooks/useActor.ts (for actor initialization)
 *
 * 2. Install required dependencies:
 *    ```bash
 *    npm install @dfinity/agent @dfinity/actor lucide-react
 *    ```
 *
 * 3. Copy the backend interface file:
 *    - backend.d.ts (TypeScript types)
 *
 * ## Usage Examples
 *
 * ### Example 1: Simple Player
 * ```tsx
 * import { ExternalAudioPlayer } from './components/ExternalAudioPlayer';
 * import { useActor } from './hooks/useActor';
 *
 * function App() {
 *   const { actor } = useActor();
 *
 *   return (
 *     <ExternalAudioPlayer
 *       canisterId="rrkah-fqaaa-aaaaa-aaaaq-cai"
 *       fileId="audio-123"
 *       title="My Podcast Episode"
 *       actor={actor}
 *     />
 *   );
 * }
 * ```
 *
 * ### Example 2: Audio Library with Selection
 * ```tsx
 * import { useState, useEffect } from 'react';
 * import { ExternalAudioPlayer } from './components/ExternalAudioPlayer';
 * import { listAudioFiles } from './lib/audioApiClient';
 * import { useActor } from './hooks/useActor';
 *
 * function AudioLibrary() {
 *   const [files, setFiles] = useState([]);
 *   const [selectedId, setSelectedId] = useState(null);
 *   const { actor } = useActor();
 *   const canisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
 *
 *   useEffect(() => {
 *     if (actor) {
 *       listAudioFiles(canisterId, actor).then(setFiles);
 *     }
 *   }, [actor]);
 *
 *   return (
 *     <div>
 *       <h2>Audio Library</h2>
 *       <ul>
 *         {files.map(file => (
 *           <li key={file.id} onClick={() => setSelectedId(file.id)}>
 *             {file.title} - {Math.floor(file.duration / 60)}:{(file.duration % 60).toString().padStart(2, '0')}
 *           </li>
 *         ))}
 *       </ul>
 *       {selectedId && (
 *         <ExternalAudioPlayer
 *           canisterId={canisterId}
 *           fileId={selectedId}
 *           actor={actor}
 *         />
 *       )}
 *     </div>
 *   );
 * }
 * ```
 *
 * ### Example 3: Minimal Player
 * ```tsx
 * <ExternalAudioPlayer
 *   canisterId="rrkah-fqaaa-aaaaa-aaaaq-cai"
 *   fileId="audio-123"
 *   actor={actor}
 *   minimal={true}
 * />
 * ```
 *
 * ### Example 4: Direct Stream URL (No Actor Required)
 * ```tsx
 * import { streamAudio } from './lib/audioApiClient';
 *
 * function CustomPlayer() {
 *   const streamUrl = streamAudio('rrkah-fqaaa-aaaaa-aaaaq-cai', 'audio-123');
 *
 *   return (
 *     <audio controls src={streamUrl}>
 *       Your browser does not support the audio element.
 *     </audio>
 *   );
 * }
 * ```
 *
 * ### Example 5: Iframe Embedding
 * Create a standalone player page and embed it:
 *
 * ```html
 * <!-- In your HTML -->
 * <iframe
 *   src="https://your-audio-app.ic0.app/embed?fileId=audio-123"
 *   width="400"
 *   height="250"
 *   frameborder="0"
 *   allow="autoplay"
 * ></iframe>
 * ```
 *
 * ```tsx
 * // Create an embed route in your app
 * import { useActor } from './hooks/useActor';
 *
 * function EmbedPage() {
 *   const params = new URLSearchParams(window.location.search);
 *   const fileId = params.get('fileId');
 *   const { actor } = useActor();
 *   const canisterId = 'rrkah-fqaaa-aaaaa-aaaaq-cai';
 *
 *   return (
 *     <div style={{ padding: '20px' }}>
 *       <ExternalAudioPlayer
 *         canisterId={canisterId}
 *         fileId={fileId}
 *         actor={actor}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * ## API Reference
 *
 * ### listAudioFiles(canisterId, actor)
 * Fetches all available audio files from the canister.
 * Returns: Promise<AudioMetadata[]>
 *
 * ### getAudioMetadata(canisterId, fileId, actor)
 * Fetches metadata for a specific audio file.
 * Returns: Promise<AudioMetadata>
 *
 * ### streamAudio(canisterId, fileId, host?)
 * Returns the direct streaming URL for an audio file.
 * Returns: string (URL)
 * Note: Does not require actor - can be used standalone
 *
 * ### getAudioBlob(canisterId, fileId, actor)
 * Fetches the complete audio file as a Blob.
 * Returns: Promise<Blob>
 *
 * ## Props Reference - ExternalAudioPlayer
 *
 * - canisterId (required): The canister ID of the audio streaming app
 * - fileId (required): The unique identifier of the audio file
 * - actor (optional): Backend actor instance (required for metadata fetching)
 * - title (optional): Override title (otherwise fetched from canister if actor provided)
 * - host (optional): IC host URL (defaults to current host or ic0.app)
 * - className (optional): Additional CSS classes
 * - minimal (optional): Show minimal controls (default: false)
 */

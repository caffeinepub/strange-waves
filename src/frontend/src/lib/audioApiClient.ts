/**
 * Audio API Client for External Integration
 *
 * This module provides utilities for external applications to interact with the
 * audio streaming canister. It allows third-party apps to list, fetch metadata,
 * and stream audio files from the deployed canister.
 *
 * @example Basic Usage
 * ```typescript
 * import { listAudioFiles, getAudioMetadata, streamAudio } from './audioApiClient';
 *
 * // List all available audio files
 * const files = await listAudioFiles('your-canister-id');
 *
 * // Get metadata for a specific file
 * const metadata = await getAudioMetadata('your-canister-id', 'file-id');
 *
 * // Get streaming URL for audio playback
 * const streamUrl = streamAudio('your-canister-id', 'file-id');
 * ```
 *
 * @example Using with HTML5 Audio Element
 * ```typescript
 * const audioElement = document.querySelector('audio');
 * audioElement.src = streamAudio('your-canister-id', 'file-id');
 * audioElement.play();
 * ```
 */

import type { AudioFile } from "../backend";

/**
 * Configuration for the audio API client
 */
export interface AudioApiConfig {
  canisterId: string;
  host?: string;
}

/**
 * Simplified audio file metadata for external consumption
 */
export interface AudioMetadata {
  id: string;
  title: string;
  duration: number;
  size: number;
  uploadTimestamp: number;
}

/**
 * Converts backend AudioFile to simplified AudioMetadata
 */
function convertToMetadata(audioFile: AudioFile): AudioMetadata {
  return {
    id: audioFile.id,
    title: audioFile.title,
    duration: Number(audioFile.duration),
    size: Number(audioFile.size),
    uploadTimestamp: Number(audioFile.uploadTimestamp),
  };
}

/**
 * Lists all available audio files from the canister
 *
 * Note: This function requires the backend actor to be initialized.
 * For external applications, you'll need to set up the actor with
 * @dfinity/agent and the canister interface.
 *
 * @param canisterId - The canister ID of the audio streaming app
 * @param actor - The initialized backend actor instance
 * @returns Promise resolving to array of audio file metadata
 *
 * @example
 * ```typescript
 * import { useActor } from './hooks/useActor';
 *
 * const { actor } = useActor();
 * const files = await listAudioFiles('rrkah-fqaaa-aaaaa-aaaaq-cai', actor);
 * console.log(`Found ${files.length} audio files`);
 * files.forEach(file => console.log(file.title));
 * ```
 */
export async function listAudioFiles(
  _canisterId: string,
  actor: any,
): Promise<AudioMetadata[]> {
  try {
    if (!actor) {
      throw new Error("Actor not initialized");
    }
    const audioFiles = await actor.listAudioFiles();
    return audioFiles.map(convertToMetadata);
  } catch (error) {
    console.error("Failed to list audio files:", error);
    throw new Error(
      `Failed to fetch audio files: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Fetches metadata for a specific audio file
 *
 * @param canisterId - The canister ID of the audio streaming app
 * @param fileId - The unique identifier of the audio file
 * @param actor - The initialized backend actor instance
 * @returns Promise resolving to audio file metadata
 *
 * @example
 * ```typescript
 * const metadata = await getAudioMetadata('rrkah-fqaaa-aaaaa-aaaaq-cai', 'audio-123', actor);
 * console.log(`Title: ${metadata.title}`);
 * console.log(`Duration: ${metadata.duration} seconds`);
 * ```
 */
export async function getAudioMetadata(
  _canisterId: string,
  fileId: string,
  actor: any,
): Promise<AudioMetadata> {
  try {
    if (!actor) {
      throw new Error("Actor not initialized");
    }
    const audioFile = await actor.getAudioFileMetadata(fileId);
    return convertToMetadata(audioFile);
  } catch (error) {
    console.error("Failed to get audio metadata:", error);
    throw new Error(
      `Failed to fetch metadata for file ${fileId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

/**
 * Returns the direct streaming URL for an audio file
 *
 * This URL can be used directly with HTML5 audio elements, video players,
 * or any media player that supports HTTP streaming. The URL points to the
 * canister's blob storage and supports byte-range requests for seeking.
 *
 * @param canisterId - The canister ID of the audio streaming app
 * @param fileId - The unique identifier of the audio file
 * @param host - Optional IC host URL (defaults to current host or ic0.app)
 * @returns Direct streaming URL for the audio file
 *
 * @example Direct Usage
 * ```typescript
 * const streamUrl = streamAudio('rrkah-fqaaa-aaaaa-aaaaq-cai', 'audio-123');
 * const audio = new Audio(streamUrl);
 * audio.play();
 * ```
 *
 * @example With React
 * ```tsx
 * function AudioPlayer({ canisterId, fileId }) {
 *   const streamUrl = streamAudio(canisterId, fileId);
 *   return <audio src={streamUrl} controls />;
 * }
 * ```
 */
export function streamAudio(
  canisterId: string,
  fileId: string,
  host?: string,
): string {
  // Use provided host, or default to current location host in browser, or ic0.app
  const baseHost =
    host ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "https://ic0.app");
  // The blob storage URL format for direct streaming
  return `${baseHost}/api/v2/canister/${canisterId}/blob/${fileId}`;
}

/**
 * Fetches the complete audio file as a Blob
 *
 * Use this when you need the entire file data, for example to process
 * the audio or save it locally. For streaming playback, prefer streamAudio().
 *
 * @param canisterId - The canister ID of the audio streaming app
 * @param fileId - The unique identifier of the audio file
 * @param actor - The initialized backend actor instance
 * @returns Promise resolving to a Blob containing the audio data
 *
 * @example
 * ```typescript
 * const blob = await getAudioBlob('rrkah-fqaaa-aaaaa-aaaaq-cai', 'audio-123', actor);
 * const url = URL.createObjectURL(blob);
 * const audio = new Audio(url);
 * audio.play();
 * ```
 */
export async function getAudioBlob(
  _canisterId: string,
  fileId: string,
  actor: any,
): Promise<Blob> {
  try {
    if (!actor) {
      throw new Error("Actor not initialized");
    }
    const audioFile = await actor.getAudioFileMetadata(fileId);
    const bytes = await audioFile.blob.getBytes();
    return new Blob([bytes], { type: "audio/mpeg" });
  } catch (error) {
    console.error("Failed to get audio blob:", error);
    throw new Error(
      `Failed to fetch audio blob for file ${fileId}: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
  }
}

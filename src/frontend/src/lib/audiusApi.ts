/**
 * Audius API Integration Module
 *
 * This module provides functions to interact with the Audius public API
 * for searching and streaming music tracks.
 */

const AUDIUS_API_HOST = "https://discoveryprovider.audius.co";
const APP_NAME = "AudioStreamingPlatform";

export interface AudiusTrack {
  id: string;
  title: string;
  duration: number;
  artwork?: {
    "150x150"?: string;
    "480x480"?: string;
    "1000x1000"?: string;
  };
  user: {
    name: string;
    handle: string;
    is_verified?: boolean;
  };
  genre?: string;
  mood?: string;
  play_count?: number;
  permalink?: string;
  is_streamable?: boolean;
}

export interface AudiusSearchResponse {
  data: AudiusTrack[];
}

/**
 * Search for tracks on Audius by keyword
 * @param query - Search keyword
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise with array of tracks
 */
export async function searchAudiusTracks(
  query: string,
  limit = 10,
): Promise<AudiusTrack[]> {
  if (!query.trim()) {
    return [];
  }

  try {
    const url = new URL(`${AUDIUS_API_HOST}/v1/tracks/search`);
    url.searchParams.append("query", query);
    url.searchParams.append("app_name", APP_NAME);
    url.searchParams.append("limit", limit.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Audius API error: ${response.status}`);
    }

    const data: AudiusSearchResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error searching Audius tracks:", error);
    throw error;
  }
}

/**
 * Get the stream URL for an Audius track
 * @param trackId - The Audius track ID
 * @returns Stream URL for the track
 */
export function getAudiusStreamUrl(trackId: string): string {
  return `${AUDIUS_API_HOST}/v1/tracks/${trackId}/stream?app_name=${APP_NAME}`;
}

/**
 * Get trending tracks from Audius
 * @param limit - Maximum number of results (default: 10)
 * @returns Promise with array of trending tracks
 */
export async function getTrendingAudiusTracks(
  limit = 10,
): Promise<AudiusTrack[]> {
  try {
    const url = new URL(`${AUDIUS_API_HOST}/v1/tracks/trending`);
    url.searchParams.append("app_name", APP_NAME);
    url.searchParams.append("limit", limit.toString());

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Audius API error: ${response.status}`);
    }

    const data: AudiusSearchResponse = await response.json();
    return data.data || [];
  } catch (error) {
    console.error("Error fetching trending Audius tracks:", error);
    throw error;
  }
}

/**
 * Get metadata for a specific Audius track
 * @param trackId - The Audius track ID
 * @returns Promise with track metadata
 */
export async function getAudiusTrackMetadata(
  trackId: string,
): Promise<AudiusTrack> {
  try {
    const url = new URL(`${AUDIUS_API_HOST}/v1/tracks/${trackId}`);
    url.searchParams.append("app_name", APP_NAME);

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`Audius API error: ${response.status}`);
    }

    const data: { data: AudiusTrack } = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching Audius track metadata:", error);
    throw error;
  }
}

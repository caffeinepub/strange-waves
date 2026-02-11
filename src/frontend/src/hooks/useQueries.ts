import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useActorReady } from './useActorReady';
import type { AudioFile, Genre, PlaylistView, MintNFTRequest, NFTRecord, NFTRecordWithParams, MintNFTWithParamsRequest, RevenueSplit, StableCoin, NFTParameters, AudiusTrack } from '../backend';
import { ExternalBlob, FileType } from '../backend';
import { toast } from 'sonner';
import { useState, useEffect, useRef } from 'react';
import { searchAudiusTracks, getTrendingAudiusTracks, type AudiusTrack as AudiusAPITrack } from '../lib/audiusApi';
import { useInternetIdentity } from './useInternetIdentity';
import { Principal } from '@icp-sdk/core/principal';

// Action queue for pending operations
type QueuedAction = {
  id: string;
  action: () => Promise<void>;
  description: string;
};

const actionQueue: QueuedAction[] = [];
let isProcessingQueue = false;

async function processActionQueue(actor: any) {
  if (isProcessingQueue || !actor || actionQueue.length === 0) return;
  
  isProcessingQueue = true;
  console.log(`[ActionQueue] Processing ${actionQueue.length} queued action(s)`);
  
  while (actionQueue.length > 0) {
    const queuedAction = actionQueue.shift();
    if (queuedAction) {
      try {
        console.log(`[ActionQueue] Executing: ${queuedAction.description}`);
        await queuedAction.action();
        toast.success(`Completed: ${queuedAction.description}`);
      } catch (error: any) {
        console.error(`[ActionQueue] Failed to execute ${queuedAction.description}:`, error);
        toast.error(`Failed: ${queuedAction.description}`);
      }
    }
  }
  
  isProcessingQueue = false;
  console.log('[ActionQueue] Queue processing complete');
}

export function useAudioFiles() {
  const { actor, isFetching } = useActor();

  return useQuery<AudioFile[]>({
    queryKey: ['audioFiles'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllAudioFiles();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useAudioFile(id: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AudioFile | null>({
    queryKey: ['audioFile', id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getAudioFile(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useUploadAudioFile() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      duration,
      size,
      audioData,
      creator = 'Anonymous',
      genre = { __kind__: 'other', other: 'Unknown' } as Genre,
      isPublic = true,
      coverImage,
      onProgress,
    }: {
      id: string;
      title: string;
      duration: number;
      size: number;
      audioData: Uint8Array;
      creator?: string;
      genre?: Genre;
      isPublic?: boolean;
      coverImage?: Uint8Array;
      onProgress?: (percentage: number) => void;
    }) => {
      if (!actor || !isActorReady) {
        console.warn('[Upload] Actor not ready, queuing upload action');
        throw new Error('Actor not ready. Please wait or log in.');
      }

      console.log('[Upload] Starting audio file upload:', title);

      const typedAudioData = new Uint8Array(audioData.buffer) as Uint8Array<ArrayBuffer>;
      let audioBlob = ExternalBlob.fromBytes(typedAudioData);
      
      if (onProgress) {
        audioBlob = audioBlob.withUploadProgress(onProgress);
      }

      let coverImageBlob: ExternalBlob | undefined = undefined;
      if (coverImage) {
        const typedImageData = new Uint8Array(coverImage.buffer) as Uint8Array<ArrayBuffer>;
        coverImageBlob = ExternalBlob.fromBytes(typedImageData);
      }

      const audioFile: AudioFile = {
        id,
        title,
        duration: BigInt(duration),
        size: BigInt(size),
        uploadTimestamp: BigInt(Date.now() * 1000000),
        blob: audioBlob,
        creator,
        genre,
        isPublic,
        owner: undefined,
        coverImage: coverImageBlob,
      };

      await actor.uploadAudioFile(audioFile);
      
      console.log('[Upload] Audio file uploaded successfully:', title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
      toast.success('Audio file uploaded successfully');
    },
    onError: (error: Error) => {
      console.error('[Upload] Upload failed:', error);
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

export function useDeleteAudioFile() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      await actor.deleteAudioFile(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
      toast.success('Audio file deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Delete failed: ${error.message}`);
    },
  });
}

// Legacy NFT Minting Hook (without params)
export function useMintNFT() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      audioFile,
      title,
      description,
      artist,
      fileType,
    }: {
      audioFile: AudioFile;
      title: string;
      description: string;
      artist: string;
      fileType: FileType;
    }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }

      console.log('[NFT] Starting NFT minting:', title, 'Type:', fileType);

      const request: MintNFTRequest = {
        title,
        description,
        artist,
        fileType,
        originalContentId: audioFile.id,
        audioBlob: fileType === FileType.audio || fileType === FileType.combined ? audioFile.blob : undefined,
        imageBlob: fileType === FileType.image || fileType === FileType.combined ? audioFile.coverImage : undefined,
      };

      const response = await actor.mintNFT(request);

      if (response.__kind__ === 'unauthorized') {
        throw new Error('Unauthorized: You must be logged in to mint NFTs');
      }

      if (response.__kind__ === 'invalidInput') {
        throw new Error(`Invalid input: ${response.invalidInput}`);
      }

      console.log('[NFT] NFT minted successfully');
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
      queryClient.invalidateQueries({ queryKey: ['nftRecords'] });
      toast.success('NFT minted successfully!');
    },
    onError: (error: Error) => {
      console.error('[NFT] Minting failed:', error);
      toast.error(`Failed to mint NFT: ${error.message}`);
    },
  });
}

// Enhanced NFT Minting Hook with Custom Parameters
export function useMintNFTWithParams() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      audioFile,
      title,
      description,
      artist,
      fileType,
      price,
      stableCoin,
      royaltyPercentage,
      revenueSplits,
    }: {
      audioFile: AudioFile;
      title: string;
      description: string;
      artist: string;
      fileType: FileType;
      price: number;
      stableCoin: StableCoin;
      royaltyPercentage: number;
      revenueSplits: RevenueSplit[];
    }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }

      console.log('[NFT] Starting NFT minting with params:', title, 'Type:', fileType);

      // Convert revenue splits to proper format with Principal
      const formattedRevenueSplits: RevenueSplit[] = revenueSplits.map(split => ({
        address: Principal.fromText(split.address as any),
        percentage: BigInt(split.percentage)
      }));

      const params: NFTParameters = {
        price: BigInt(Math.round(price * 100)), // Convert to cents/smallest unit
        stableCoin,
        royaltyPercentage: BigInt(royaltyPercentage),
        revenueSplits: formattedRevenueSplits,
      };

      const request: MintNFTWithParamsRequest = {
        title,
        description,
        artist,
        fileType,
        originalContentId: audioFile.id,
        audioBlob: fileType === FileType.audio || fileType === FileType.combined ? audioFile.blob : undefined,
        imageBlob: fileType === FileType.image || fileType === FileType.combined ? audioFile.coverImage : undefined,
        params,
      };

      const response = await actor.mintNFTwithParams(request);

      if (response.__kind__ === 'unauthorized') {
        throw new Error('Unauthorized: You must be logged in to mint NFTs');
      }

      if (response.__kind__ === 'invalidInput') {
        throw new Error(`Invalid input: ${response.invalidInput}`);
      }

      console.log('[NFT] NFT with params minted successfully');
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
      queryClient.invalidateQueries({ queryKey: ['nftRecords'] });
      queryClient.invalidateQueries({ queryKey: ['nftRecordsWithParams'] });
      toast.success('NFT minted successfully with custom parameters!');
    },
    onError: (error: Error) => {
      console.error('[NFT] Minting with params failed:', error);
      toast.error(`Failed to mint NFT: ${error.message}`);
    },
  });
}

// NFT Query Hooks
export function useAllNFTRecords() {
  const { actor, isFetching } = useActor();

  return useQuery<NFTRecord[]>({
    queryKey: ['nftRecords'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNFTRecords();
    },
    enabled: !!actor && !isFetching,
  });
}

// Enhanced NFT Query Hooks with Params
export function useAllNFTRecordsWithParams() {
  const { actor, isFetching } = useActor();

  return useQuery<NFTRecordWithParams[]>({
    queryKey: ['nftRecordsWithParams'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllNFTRecordsWithParams();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCallerNFTRecordsWithParams() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<NFTRecordWithParams[]>({
    queryKey: ['nftRecordsWithParams', 'caller', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getCallerNFTRecordsWithParams();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// Audius API Hooks
export function useSearchAudiusTracks(query: string, enabled: boolean = true) {
  return useQuery<AudiusAPITrack[]>({
    queryKey: ['audiusTracks', 'search', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      return searchAudiusTracks(query, 20);
    },
    enabled: enabled && !!query.trim(),
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000,
  });
}

export function useTrendingAudiusTracks() {
  return useQuery<AudiusAPITrack[]>({
    queryKey: ['audiusTracks', 'trending'],
    queryFn: async () => {
      return getTrendingAudiusTracks(10);
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
}

// Playlist Hooks
export function useCallerPlaylists() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<PlaylistView[]>({
    queryKey: ['playlists', identity?.getPrincipal().toString()],
    queryFn: async () => {
      if (!actor || !identity) return [];
      return actor.getCallerPlaylists();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

export function useAllPlaylists() {
  const { actor, isFetching } = useActor();

  return useQuery<PlaylistView[]>({
    queryKey: ['playlists', 'all'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPlaylists();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useCreatePlaylist() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      if (!actor || !isActorReady) {
        console.warn('[Playlist] Actor not ready, queuing create playlist action');
        
        const queuedAction: QueuedAction = {
          id: `create-playlist-${id}`,
          description: `Create playlist "${title}"`,
          action: async () => {
            if (actor) {
              await actor.createPlaylist(id, title);
              console.log('[Playlist] Playlist created');
              queryClient.invalidateQueries({ queryKey: ['playlists'] });
            }
          },
        };
        actionQueue.push(queuedAction);
        
        throw new Error('Actor not ready. Your action has been queued and will be processed once ready.');
      }

      console.log('[Playlist] Creating playlist:', title);
      await actor.createPlaylist(id, title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist created successfully');
    },
    onError: (error: Error) => {
      console.error('[Playlist] Create failed:', error);
      toast.error(`Failed to create playlist: ${error.message}`);
    },
  });
}

export function useAddTrackToPlaylist() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
      if (!actor || !isActorReady) {
        console.warn('[Playlist] Actor not ready, queuing add track action');
        
        const queuedAction: QueuedAction = {
          id: `add-track-${playlistId}-${trackId}`,
          description: `Add track to playlist`,
          action: async () => {
            if (actor) {
              await actor.addTrackToPlaylist(playlistId, trackId);
              console.log('[Playlist] Track added');
              queryClient.invalidateQueries({ queryKey: ['playlists'] });
            }
          },
        };
        actionQueue.push(queuedAction);
        
        throw new Error('Actor not ready. Your action has been queued and will be processed once ready.');
      }

      console.log('[Playlist] Adding track to playlist:', playlistId);
      await actor.addTrackToPlaylist(playlistId, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Track added to playlist');
    },
    onError: (error: Error) => {
      console.error('[Playlist] Add track failed:', error);
      toast.error(`Failed to add track: ${error.message}`);
    },
  });
}

export function useAddAudiusTrackToPlaylist() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, track }: { playlistId: string; track: AudiusTrack }) => {
      if (!actor || !isActorReady) {
        console.warn('[Playlist] Actor not ready, queuing add Audius track action');
        
        const queuedAction: QueuedAction = {
          id: `add-audius-track-${playlistId}-${track.id}`,
          description: `Add Audius track to playlist`,
          action: async () => {
            if (actor) {
              await actor.addAudiusTrackToPlaylist(playlistId, track);
              console.log('[Playlist] Audius track added');
              queryClient.invalidateQueries({ queryKey: ['playlists'] });
            }
          },
        };
        actionQueue.push(queuedAction);
        
        throw new Error('Actor not ready. Your action has been queued and will be processed once ready.');
      }

      console.log('[Playlist] Adding Audius track to playlist:', playlistId, track.title);
      await actor.addAudiusTrackToPlaylist(playlistId, track);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Audius track added to playlist');
    },
    onError: (error: Error) => {
      console.error('[Playlist] Add Audius track failed:', error);
      toast.error(`Failed to add Audius track: ${error.message}`);
    },
  });
}

export function useRemoveTrackFromPlaylist() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      
      console.log('[Playlist] Removing track from playlist:', playlistId);
      await actor.removeTrackFromPlaylist(playlistId, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Track removed from playlist');
    },
    onError: (error: Error) => {
      console.error('[Playlist] Remove track failed:', error);
      toast.error(`Failed to remove track: ${error.message}`);
    },
  });
}

export function useRemoveAudiusTrackFromPlaylist() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      
      console.log('[Playlist] Removing Audius track from playlist:', playlistId);
      await actor.removeAudiusTrackFromPlaylist(playlistId, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Audius track removed from playlist');
    },
    onError: (error: Error) => {
      console.error('[Playlist] Remove Audius track failed:', error);
      toast.error(`Failed to remove Audius track: ${error.message}`);
    },
  });
}

export function useDeletePlaylist() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (playlistId: string) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      
      console.log('[Playlist] Deleting playlist:', playlistId);
      await actor.deletePlaylist(playlistId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist deleted successfully');
    },
    onError: (error: Error) => {
      console.error('[Playlist] Delete failed:', error);
      toast.error(`Failed to delete playlist: ${error.message}`);
    },
  });
}

export function useRenamePlaylist() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, newTitle }: { playlistId: string; newTitle: string }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      
      console.log('[Playlist] Renaming playlist:', playlistId, 'to', newTitle);
      await actor.updatePlaylistTitle(playlistId, newTitle);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist renamed successfully');
    },
    onError: (error: Error) => {
      console.error('[Playlist] Rename failed:', error);
      toast.error(`Failed to rename playlist: ${error.message}`);
    },
  });
}

export function useGetPlaylistById(playlistId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<PlaylistView | null>({
    queryKey: ['playlist', playlistId],
    queryFn: async () => {
      if (!actor || !playlistId) return null;
      return actor.getPlaylist(playlistId);
    },
    enabled: !!actor && !isFetching && !!playlistId,
  });
}

// Combined audio type for unified handling
export type CombinedAudio = 
  | { source: 'local'; data: AudioFile }
  | { source: 'remote'; data: AudioFile }
  | { source: 'audius'; data: AudiusAPITrack };

export function useSelectedAudio() {
  const [selectedAudio, setSelectedAudio] = useState<CombinedAudio | null>(null);

  return {
    selectedAudio,
    setSelectedAudio,
  };
}

// Hook to process queued actions when actor becomes ready
export function useActionQueueProcessor() {
  const { actor, isActorReady } = useActorReady();
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    if (isActorReady && actor && actionQueue.length > 0 && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      processActionQueue(actor).finally(() => {
        hasProcessedRef.current = false;
      });
    }
  }, [isActorReady, actor]);
}

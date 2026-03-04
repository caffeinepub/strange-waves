import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import { useActorReady } from './useActorReady';
import type { AudioFile, Genre, PlaylistView, MintNFTRequest, NFTRecord, NFTRecordWithParams, MintNFTWithParamsRequest, RevenueSplit, StableCoin, NFTParameters, AudiusTrack, AlbumView, AlbumInput } from '../backend';
import { ExternalBlob, FileType } from '../backend';
import { toast } from 'sonner';
import { useState } from 'react';
import { searchAudiusTracks, getTrendingAudiusTracks, type AudiusTrack as AudiusAPITrack } from '../lib/audiusApi';
import { useInternetIdentity } from './useInternetIdentity';

// ===== COMBINED AUDIO TYPE =====

export type CombinedAudio =
  | { source: 'local'; data: AudioFile }
  | { source: 'remote'; data: AudioFile }
  | { source: 'audius'; data: AudiusAPITrack };

// ===== SELECTED AUDIO STATE =====

let _selectedAudio: CombinedAudio | null = null;
const _selectedAudioListeners: Array<() => void> = [];

function setGlobalSelectedAudio(audio: CombinedAudio | null) {
  _selectedAudio = audio;
  _selectedAudioListeners.forEach((fn) => fn());
}

export function useSelectedAudio() {
  const [selectedAudio, setLocalAudio] = useState<CombinedAudio | null>(_selectedAudio);

  const setSelectedAudio = (audio: CombinedAudio | null) => {
    setGlobalSelectedAudio(audio);
    setLocalAudio(audio);
  };

  return { selectedAudio, setSelectedAudio };
}

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

  while (actionQueue.length > 0) {
    const queuedAction = actionQueue.shift();
    if (queuedAction) {
      try {
        await queuedAction.action();
        toast.success(`Completed: ${queuedAction.description}`);
      } catch (error: any) {
        toast.error(`Failed: ${queuedAction.description}`);
      }
    }
  }

  isProcessingQueue = false;
}

// No-op hook for action queue processing (queue is processed inline)
export function useActionQueueProcessor() {
  // Action queue is processed inline when actor becomes ready; no additional effect needed.
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

export function useGetAudioFilesByAlbum(albumId: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AudioFile[]>({
    queryKey: ['audioFilesByAlbum', albumId],
    queryFn: async () => {
      if (!actor || !albumId) return [];
      return actor.getAudioFilesByAlbum(albumId);
    },
    enabled: !!actor && !isFetching && !!albumId,
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
        throw new Error('Actor not ready. Please wait or log in.');
      }

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
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
      toast.success('Audio file uploaded successfully');
    },
    onError: (error: Error) => {
      toast.error(`Upload failed: ${error.message}`);
    },
  });
}

export function useUploadTrackWithAlbum() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      title,
      description,
      duration,
      size,
      audioData,
      coverImageData,
      creator = 'SteveStrange',
      genre = { __kind__: 'other', other: 'Unknown' } as Genre,
      isPublic = true,
      albumId,
      onProgress,
    }: {
      id: string;
      title: string;
      description?: string;
      duration: number;
      size: number;
      audioData: Uint8Array;
      coverImageData?: Uint8Array;
      creator?: string;
      genre?: Genre;
      isPublic?: boolean;
      albumId: string;
      onProgress?: (percentage: number) => void;
    }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }

      const typedAudioData = new Uint8Array(audioData.buffer) as Uint8Array<ArrayBuffer>;
      let audioBlob = ExternalBlob.fromBytes(typedAudioData);

      if (onProgress) {
        audioBlob = audioBlob.withUploadProgress(onProgress);
      }

      let coverImageBlob: ExternalBlob | undefined = undefined;
      if (coverImageData) {
        const typedImageData = new Uint8Array(coverImageData.buffer) as Uint8Array<ArrayBuffer>;
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
        albumId,
      };

      await actor.uploadTrackWithAlbum(audioFile, albumId);
      return id;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['audioFiles'] });
      queryClient.invalidateQueries({ queryKey: ['audioFilesByAlbum', variables.albumId] });
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Track uploaded successfully');
    },
    onError: (error: Error) => {
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

      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
      queryClient.invalidateQueries({ queryKey: ['nftRecords'] });
      toast.success('NFT minted successfully!');
    },
    onError: (error: Error) => {
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

      const params: NFTParameters = {
        price: BigInt(price),
        stableCoin,
        royaltyPercentage: BigInt(royaltyPercentage),
        revenueSplits,
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

      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['nfts'] });
      queryClient.invalidateQueries({ queryKey: ['nftRecordsWithParams'] });
      toast.success('NFT minted successfully!');
    },
    onError: (error: Error) => {
      toast.error(`Failed to mint NFT: ${error.message}`);
    },
  });
}

export function useNFTRecords() {
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

export function useNFTRecordsWithParams() {
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

// Aliases for backward compatibility
export const useCallerNFTRecordsWithParams = useNFTRecordsWithParams;
export const useAllNFTRecordsWithParams = useNFTRecordsWithParams;

export function usePlaylists() {
  const { actor, isFetching } = useActor();

  return useQuery<PlaylistView[]>({
    queryKey: ['playlists'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllPlaylists();
    },
    enabled: !!actor && !isFetching,
  });
}

// Alias for backward compatibility
export const useCallerPlaylists = usePlaylists;

export function useCreatePlaylist() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, title }: { id: string; title: string }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      return actor.createPlaylist(id, title);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create playlist: ${error.message}`);
    },
  });
}

export function useUpdatePlaylistTitle() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newTitle }: { id: string; newTitle: string }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      return actor.updatePlaylistTitle(id, newTitle);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist renamed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to rename playlist: ${error.message}`);
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
      return actor.updatePlaylistTitle(playlistId, newTitle);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist renamed successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to rename playlist: ${error.message}`);
    },
  });
}

export function useAddTrackToPlaylist() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, trackId }: { playlistId: string; trackId: string }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      return actor.addTrackToPlaylist(playlistId, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add track: ${error.message}`);
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
      return actor.removeTrackFromPlaylist(playlistId, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove track: ${error.message}`);
    },
  });
}

export function useDeletePlaylist() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      return actor.deletePlaylist(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
      toast.success('Playlist deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete playlist: ${error.message}`);
    },
  });
}

export function useAddAudiusTrackToPlaylist() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playlistId, track }: { playlistId: string; track: AudiusTrack }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      return actor.addAudiusTrackToPlaylist(playlistId, track);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add Audius track: ${error.message}`);
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
      return actor.removeAudiusTrackFromPlaylist(playlistId, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['playlists'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to remove Audius track: ${error.message}`);
    },
  });
}

// ===== ALBUM HOOKS =====

export function useListAlbums() {
  const { actor, isFetching } = useActor();

  return useQuery<AlbumView[]>({
    queryKey: ['albums'],
    queryFn: async () => {
      if (!actor) return [];
      return actor.listAlbums();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useGetAlbum(id: string | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AlbumView | null>({
    queryKey: ['album', id],
    queryFn: async () => {
      if (!actor || !id) return null;
      return actor.getAlbum(id);
    },
    enabled: !!actor && !isFetching && !!id,
  });
}

export function useCreateAlbum() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: AlbumInput) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      return actor.createAlbum(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Album created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create album: ${error.message}`);
    },
  });
}

export function useUpdateAlbum() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, input }: { id: string; input: AlbumInput }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      return actor.updateAlbum(id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Album updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update album: ${error.message}`);
    },
  });
}

export function useDeleteAlbum() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      return actor.deleteAlbum(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
      toast.success('Album deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete album: ${error.message}`);
    },
  });
}

export function useAddTrackToAlbum() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ albumId, trackId }: { albumId: string; trackId: string }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      return actor.addTrackToAlbum(albumId, trackId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['albums'] });
    },
    onError: (error: Error) => {
      toast.error(`Failed to add track to album: ${error.message}`);
    },
  });
}

// ===== ADMIN ROLE HOOK =====

export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();
  const { identity } = useInternetIdentity();

  return useQuery<boolean>({
    queryKey: ['isCallerAdmin'],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isCallerAdmin();
    },
    enabled: !!actor && !isFetching && !!identity,
  });
}

// ===== USER PROFILE HOOKS =====

export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery({
    queryKey: ['currentUserProfile'],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not available');
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor, isActorReady } = useActorReady();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: { name: string; email?: string; bio?: string }) => {
      if (!actor || !isActorReady) {
        throw new Error('Actor not ready. Please wait or log in.');
      }
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUserProfile'] });
      toast.success('Profile saved successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to save profile: ${error.message}`);
    },
  });
}

// ===== AUDIUS SEARCH HOOK =====

export function useSearchAudiusTracks(query: string) {
  return useQuery<AudiusAPITrack[]>({
    queryKey: ['audiusSearch', query],
    queryFn: async () => {
      if (!query.trim()) return [];
      return searchAudiusTracks(query);
    },
    enabled: !!query.trim(),
  });
}

export function useAudiusTrendingTracks() {
  return useQuery<AudiusAPITrack[]>({
    queryKey: ['audiusTrending'],
    queryFn: async () => {
      return getTrendingAudiusTracks();
    },
  });
}

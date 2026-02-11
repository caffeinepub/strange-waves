import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface PlaylistView {
    id: string;
    title: string;
    owner: Principal;
    creationTimestamp: bigint;
    trackIds: Array<string>;
    audiusTracks: Array<AudiusTrack>;
}
export interface NFTRecordWithParams {
    imageBlob?: ExternalBlob;
    metadata: NFTMetadata;
    audioBlob?: ExternalBlob;
    params: NFTParameters;
}
export type Genre = {
    __kind__: "pop";
    pop: null;
} | {
    __kind__: "other";
    other: string;
} | {
    __kind__: "jazz";
    jazz: null;
} | {
    __kind__: "rock";
    rock: null;
} | {
    __kind__: "hipHop";
    hipHop: null;
} | {
    __kind__: "electronic";
    electronic: null;
} | {
    __kind__: "classical";
    classical: null;
};
export interface AudioFile {
    id: string;
    title: string;
    creator: string;
    duration: bigint;
    owner?: Principal;
    blob: ExternalBlob;
    size: bigint;
    uploadTimestamp: bigint;
    coverImage?: ExternalBlob;
    genre: Genre;
    isPublic: boolean;
}
export interface NFTRecord {
    imageBlob?: ExternalBlob;
    metadata: NFTMetadata;
    audioBlob?: ExternalBlob;
}
export interface MintNFTRequest {
    title: string;
    imageBlob?: ExternalBlob;
    description: string;
    audioBlob?: ExternalBlob;
    fileType: FileType;
    originalContentId?: string;
    artist: string;
}
export type MintNFTResponse = {
    __kind__: "ok";
    ok: bigint;
} | {
    __kind__: "invalidInput";
    invalidInput: string;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
};
export interface AudiusTrack {
    id: string;
    title: string;
    artworkUrl: string;
    streamUrl: string;
    artist: string;
}
export interface MintNFTWithParamsRequest {
    title: string;
    imageBlob?: ExternalBlob;
    description: string;
    audioBlob?: ExternalBlob;
    fileType: FileType;
    originalContentId?: string;
    artist: string;
    params: NFTParameters;
}
export interface NFTMetadata {
    title: string;
    owner: Principal;
    description: string;
    fileType: FileType;
    originalContentId: string;
    mintTimestamp: bigint;
    artist: string;
}
export interface RevenueSplit {
    address: Principal;
    percentage: bigint;
}
export interface NFTParameters {
    stableCoin: StableCoin;
    revenueSplits: Array<RevenueSplit>;
    price: bigint;
    royaltyPercentage: bigint;
}
export interface UserProfile {
    bio?: string;
    name: string;
    email?: string;
}
export enum FileType {
    audio = "audio",
    combined = "combined",
    image = "image"
}
export enum StableCoin {
    tusd = "tusd",
    usdc = "usdc",
    usde = "usde",
    usdp = "usdp",
    rlusd = "rlusd"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    addAudiusTrackToPlaylist(playlistId: string, track: AudiusTrack): Promise<void>;
    addTrackToPlaylist(playlistId: string, trackId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createPlaylist(id: string, title: string): Promise<PlaylistView>;
    deleteAudioFile(id: string): Promise<void>;
    deletePlaylist(id: string): Promise<void>;
    getAllAudioFiles(): Promise<Array<AudioFile>>;
    getAllNFTRecords(): Promise<Array<NFTRecord>>;
    getAllNFTRecordsWithParams(): Promise<Array<NFTRecordWithParams>>;
    getAllPlaylists(): Promise<Array<PlaylistView>>;
    getAudioFile(id: string): Promise<AudioFile | null>;
    getCallerAudioFiles(): Promise<Array<AudioFile>>;
    getCallerNFTRecordsWithParams(): Promise<Array<NFTRecordWithParams>>;
    getCallerPlaylists(): Promise<Array<PlaylistView>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCanisterId(): Promise<Principal>;
    getNFTRecord(nftId: bigint): Promise<NFTRecord | null>;
    getNFTRecordWithParams(nftId: bigint): Promise<NFTRecordWithParams | null>;
    getPlaylist(id: string): Promise<PlaylistView | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    mintNFT(request: MintNFTRequest): Promise<MintNFTResponse>;
    mintNFTwithParams(request: MintNFTWithParamsRequest): Promise<MintNFTResponse>;
    removeAudiusTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;
    removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updatePlaylistTitle(id: string, newTitle: string): Promise<void>;
    uploadAudioFile(file: AudioFile): Promise<string>;
}

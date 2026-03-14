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
export interface AlbumView {
    id: string;
    theme: string;
    listenerTier: AlbumTier;
    creationTimestamp: bigint;
    name: string;
    description: string;
    collectorTier: AlbumTier;
    trackIds: Array<string>;
    investorTier: AlbumTier;
}
export interface NFTRecordWithParams {
    imageBlob?: ExternalBlob;
    metadata: NFTMetadata;
    audioBlob?: ExternalBlob;
    params: NFTParameters;
}
export interface NFTRecordWithParamsView {
    tokenId: bigint;
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
    albumId?: string;
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
export type NFTTransferResult = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "notFound";
    notFound: null;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
} | {
    __kind__: "alreadyListed";
    alreadyListed: null;
};
export type BuyNFTResult = {
    __kind__: "ok";
    ok: null;
} | {
    __kind__: "notListed";
    notListed: null;
} | {
    __kind__: "unauthorized";
    unauthorized: null;
} | {
    __kind__: "notFound";
    notFound: null;
} | {
    __kind__: "cannotBuyOwn";
    cannotBuyOwn: null;
} | {
    __kind__: "insufficientFunds";
    insufficientFunds: null;
};
export interface NFTListing {
    tokenId: bigint;
    seller: Principal;
    priceE8s: bigint;
    listedAt: bigint;
    title: string;
    description: string;
    fileType: { audio: null } | { image: null } | { combined: null };
}
export interface AudiusTrack {
    id: string;
    title: string;
    artworkUrl: string;
    streamUrl: string;
    artist: string;
}
export interface AlbumTier {
    name: string;
    description: string;
    supply: bigint;
    price: bigint;
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
export interface AlbumInput {
    id: string;
    theme: string;
    listenerTier: AlbumTier;
    name: string;
    description: string;
    collectorTier: AlbumTier;
    investorTier: AlbumTier;
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
    addTrackToAlbum(albumId: string, trackId: string): Promise<void>;
    addTrackToPlaylist(playlistId: string, trackId: string): Promise<void>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    createAlbum(input: AlbumInput): Promise<AlbumView>;
    createPlaylist(id: string, title: string): Promise<PlaylistView>;
    deleteAlbum(id: string): Promise<void>;
    deleteAudioFile(id: string): Promise<void>;
    deletePlaylist(id: string): Promise<void>;
    getAlbum(id: string): Promise<AlbumView | null>;
    getAllAudioFiles(): Promise<Array<AudioFile>>;
    getAllNFTRecords(): Promise<Array<NFTRecord>>;
    getAllNFTRecordsWithParams(): Promise<Array<NFTRecordWithParamsView>>;
    getAllPlaylists(): Promise<Array<PlaylistView>>;
    getAudioFile(id: string): Promise<AudioFile | null>;
    getAudioFilesByAlbum(albumId: string): Promise<Array<AudioFile>>;
    getCallerAudioFiles(): Promise<Array<AudioFile>>;
    getCallerNFTRecordsWithParams(): Promise<Array<NFTRecordWithParamsView>>;
    getCallerPlaylists(): Promise<Array<PlaylistView>>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getCanisterId(): Promise<Principal>;
    getNFTRecord(nftId: bigint): Promise<NFTRecord | null>;
    getNFTRecordWithParams(nftId: bigint): Promise<NFTRecordWithParamsView | null>;
    getPlaylist(id: string): Promise<PlaylistView | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    isCallerAdmin(): Promise<boolean>;
    listAlbums(): Promise<Array<AlbumView>>;
    mintNFT(request: MintNFTRequest): Promise<MintNFTResponse>;
    mintNFTwithParams(request: MintNFTWithParamsRequest): Promise<MintNFTResponse>;
    removeAudiusTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;
    removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    updateAlbum(id: string, input: AlbumInput): Promise<AlbumView>;
    updatePlaylistTitle(id: string, newTitle: string): Promise<void>;
    uploadAudioFile(file: AudioFile): Promise<string>;
    uploadTrackWithAlbum(file: AudioFile, albumId: string | null): Promise<string>;
    getListings(): Promise<Array<NFTListing>>;
    listNFTForSale(tokenId: bigint, priceE8s: bigint): Promise<NFTTransferResult>;
    delistNFT(tokenId: bigint): Promise<NFTTransferResult>;
    buyNFT(tokenId: bigint): Promise<BuyNFTResult>;
    ownerOf(tokenId: bigint): Promise<Principal | null>;
    transferNFT(tokenId: bigint, to: Principal): Promise<NFTTransferResult>;
}

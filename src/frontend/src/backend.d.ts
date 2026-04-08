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
export interface NFTRecordWithParamsView {
    tokenId: bigint;
    imageBlob?: ExternalBlob;
    metadata: NFTMetadata;
    audioBlob?: ExternalBlob;
    attachments: Array<NFTAttachmentRecord>;
    params: NFTParameters;
}
export interface Account {
    owner: Principal;
    subaccount?: Uint8Array;
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
export interface NFTAttachmentRecord {
    blob: ExternalBlob;
    name: string;
    mimeType: string;
    isPrivate: boolean;
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
export type GenericValue = {
    __kind__: "Nat64Content";
    Nat64Content: bigint;
} | {
    __kind__: "Nat32Content";
    Nat32Content: number;
} | {
    __kind__: "BoolContent";
    BoolContent: boolean;
} | {
    __kind__: "Nat8Content";
    Nat8Content: number;
} | {
    __kind__: "Int64Content";
    Int64Content: bigint;
} | {
    __kind__: "IntContent";
    IntContent: bigint;
} | {
    __kind__: "NatContent";
    NatContent: bigint;
} | {
    __kind__: "Nat16Content";
    Nat16Content: number;
} | {
    __kind__: "Int32Content";
    Int32Content: number;
} | {
    __kind__: "Int8Content";
    Int8Content: number;
} | {
    __kind__: "FloatContent";
    FloatContent: number;
} | {
    __kind__: "Int16Content";
    Int16Content: number;
} | {
    __kind__: "BlobContent";
    BlobContent: Uint8Array;
} | {
    __kind__: "NestedContent";
    NestedContent: Array<[string, GenericValue]>;
} | {
    __kind__: "Principal";
    Principal: Principal;
} | {
    __kind__: "TextContent";
    TextContent: string;
};
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
export interface AudiusTrack {
    id: string;
    title: string;
    artworkUrl: string;
    streamUrl: string;
    artist: string;
}
export type TransferResult = {
    __kind__: "Ok";
    Ok: bigint;
} | {
    __kind__: "Err";
    Err: TransferError;
};
export interface AlbumTier {
    name: string;
    description: string;
    supply: bigint;
    price: bigint;
}
export type Dip721TokenMetadataResult = {
    __kind__: "Ok";
    Ok: TokenMetadata;
} | {
    __kind__: "Err";
    Err: string;
};
export interface MintNFTWithParamsRequest {
    title: string;
    imageBlob?: ExternalBlob;
    description: string;
    audioBlob?: ExternalBlob;
    fileType: FileType;
    originalContentId?: string;
    artist: string;
    attachments: Array<NFTAttachmentRecord>;
    params: NFTParameters;
}
export interface TokenMetadata {
    transferred_at?: bigint;
    transferred_by?: Principal;
    owner?: Principal;
    operator?: Principal;
    approved_at?: bigint;
    approved_by?: Principal;
    properties: Array<[string, GenericValue]>;
    is_burned: boolean;
    token_identifier: bigint;
    burned_at?: bigint;
    burned_by?: Principal;
    minted_at: bigint;
    minted_by: Principal;
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
export type Value = {
    __kind__: "Int";
    Int: bigint;
} | {
    __kind__: "Map";
    Map: Array<[string, Value]>;
} | {
    __kind__: "Nat";
    Nat: bigint;
} | {
    __kind__: "Blob";
    Blob: Uint8Array;
} | {
    __kind__: "Text";
    Text: string;
} | {
    __kind__: "Array";
    Array: Array<Value>;
};
export interface PlaylistView {
    id: string;
    title: string;
    owner: Principal;
    creationTimestamp: bigint;
    trackIds: Array<string>;
    audiusTracks: Array<AudiusTrack>;
}
export interface SupportedStandard {
    url: string;
    name: string;
}
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
export interface TransferArg {
    to: Account;
    token_id: bigint;
    memo?: Uint8Array;
    from_subaccount?: Uint8Array;
    created_at_time?: bigint;
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
export interface NFTListing {
    title: string;
    tokenId: bigint;
    listedAt: bigint;
    description: string;
    fileType: FileType;
    seller: Principal;
    priceE8s: bigint;
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
export interface Dip721CollectionMetadata {
    logo?: string;
    name?: string;
    totalSupply: bigint;
    created_at: bigint;
    upgraded_at: bigint;
    symbol?: string;
}
export interface NFTParameters {
    stableCoin: StableCoin;
    revenueSplits: Array<RevenueSplit>;
    price: bigint;
    royaltyPercentage: bigint;
}
export type TransferError = {
    __kind__: "GenericError";
    GenericError: {
        message: string;
        error_code: bigint;
    };
} | {
    __kind__: "Duplicate";
    Duplicate: {
        duplicate_of: bigint;
    };
} | {
    __kind__: "NonExistingTokenId";
    NonExistingTokenId: null;
} | {
    __kind__: "Unauthorized";
    Unauthorized: null;
} | {
    __kind__: "CreatedInFuture";
    CreatedInFuture: {
        ledger_time: bigint;
    };
} | {
    __kind__: "InvalidRecipient";
    InvalidRecipient: null;
} | {
    __kind__: "GenericBatchError";
    GenericBatchError: {
        message: string;
        error_code: bigint;
    };
} | {
    __kind__: "TooOld";
    TooOld: null;
};
export interface UserProfile {
    bio?: string;
    name: string;
    email?: string;
}
export enum BuyNFTResponse {
    ok = "ok",
    cannotBuyOwn = "cannotBuyOwn",
    notListed = "notListed",
    notFound = "notFound",
    unauthorized = "unauthorized"
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
export enum TransferNFTResponse {
    ok = "ok",
    alreadyListed = "alreadyListed",
    notFound = "notFound",
    unauthorized = "unauthorized"
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
    /**
     * / Buy a listed NFT — transfers ownership to buyer
     */
    buyNFT(tokenId: bigint): Promise<BuyNFTResponse>;
    createAlbum(input: AlbumInput): Promise<AlbumView>;
    createPlaylist(id: string, title: string): Promise<PlaylistView>;
    deleteAlbum(id: string): Promise<void>;
    deleteAudioFile(id: string): Promise<void>;
    deletePlaylist(id: string): Promise<void>;
    /**
     * / Remove an NFT listing from the marketplace
     */
    delistNFT(tokenId: bigint): Promise<TransferNFTResponse>;
    dip721_metadata(): Promise<Dip721CollectionMetadata>;
    dip721_name(): Promise<string>;
    dip721_owner_token_identifiers(user: Principal): Promise<Array<bigint>>;
    dip721_symbol(): Promise<string>;
    dip721_token_metadata(tokenId: bigint): Promise<Dip721TokenMetadataResult>;
    dip721_total_supply(): Promise<bigint>;
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
    /**
     * / Get all active marketplace listings
     */
    getListings(): Promise<Array<NFTListing>>;
    getNFTRecord(nftId: bigint): Promise<NFTRecord | null>;
    getNFTRecordWithParams(nftId: bigint): Promise<NFTRecordWithParamsView | null>;
    getPlaylist(id: string): Promise<PlaylistView | null>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    icrc7_balance_of(accounts: Array<Account>): Promise<Array<bigint>>;
    icrc7_collection_metadata(): Promise<Array<[string, Value]>>;
    icrc7_name(): Promise<string>;
    icrc7_owner_of(token_ids: Array<bigint>): Promise<Array<Account | null>>;
    icrc7_symbol(): Promise<string>;
    icrc7_tokens_of(account: Account, prev: bigint | null, take: bigint | null): Promise<Array<bigint>>;
    icrc7_total_supply(): Promise<bigint>;
    icrc7_transfer(args: Array<TransferArg>): Promise<Array<TransferResult | null>>;
    isCallerAdmin(): Promise<boolean>;
    listAlbums(): Promise<Array<AlbumView>>;
    /**
     * / List an NFT for sale on the marketplace
     */
    listNFTForSale(tokenId: bigint, priceE8s: bigint): Promise<ListNFTResponse>;
    mintNFT(request: MintNFTRequest): Promise<MintNFTResponse>;
    mintNFTwithParams(request: MintNFTWithParamsRequest): Promise<MintNFTResponse>;
    /**
     * / Returns the current owner of an NFT (checks ownership map first)
     */
    ownerOf(tokenId: bigint): Promise<Principal | null>;
    removeAudiusTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;
    removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    /**
     * / Returns all NFT standards this canister implements.
     * / Wallets use this first to know how to interact with the collection.
     */
    supportedStandards(): Promise<Array<SupportedStandard>>;
    /**
     * / Transfer an NFT to another principal (DIP-721 transferFrom)
     */
    transferNFT(tokenId: bigint, to: Principal): Promise<TransferNFTResponse>;
    updateAlbum(id: string, input: AlbumInput): Promise<AlbumView>;
    updatePlaylistTitle(id: string, newTitle: string): Promise<void>;
    updateTrackCoverImage(trackId: string, newCoverImage: ExternalBlob): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    uploadAudioFile(file: AudioFile): Promise<string>;
    uploadTrackWithAlbum(file: AudioFile, albumId: string | null): Promise<string>;
}

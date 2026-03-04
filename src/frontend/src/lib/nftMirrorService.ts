/**
 * NFT Mirror Service Module
 *
 * This module implements synchronization between ICP and Lukso ecosystems for NFT metadata updates.
 * It ensures that NFTs minted on the Internet Computer can be represented as LSP7/LSP8-compatible
 * mirrored assets on Lukso, with bidirectional metadata synchronization.
 *
 * The service monitors changes on both chains and propagates updates to maintain consistency.
 *
 * @module nftMirrorService
 */

import type {
  BridgeConfig,
  DIP721Metadata,
  LSP8Metadata,
} from "./icpBridgeAdapter";
import type { ProfileLink } from "./luksoProfileSync";

/**
 * Mirror status for an NFT
 */
export type MirrorStatus =
  | "pending" // Mirror creation initiated but not confirmed
  | "active" // Mirror is active and synced
  | "syncing" // Metadata update in progress
  | "out_of_sync" // Metadata differs between chains
  | "failed" // Mirror creation or sync failed
  | "paused"; // Sync temporarily paused

/**
 * NFT Mirror record tracking the relationship between ICP and Lukso NFTs
 */
export interface NFTMirror {
  id: string; // Unique mirror ID
  icpCanisterId: string;
  icpTokenId: string;
  luksoContractAddress: string;
  luksoTokenId: string;
  status: MirrorStatus;
  createdAt: number;
  lastSyncedAt: number;
  syncDirection: "icp_to_lukso" | "lukso_to_icp" | "bidirectional";
  metadata: {
    icpMetadataHash?: string;
    luksoMetadataHash?: string;
  };
  owner: {
    icpPrincipal?: string;
    luksoAddress?: string;
  };
  syncHistory: SyncEvent[];
}

/**
 * Sync event record
 */
export interface SyncEvent {
  timestamp: number;
  eventType: "created" | "updated" | "transferred" | "burned" | "sync_failed";
  sourceChain: "icp" | "lukso";
  details: string;
  transactionHash?: string;
  error?: string;
}

/**
 * Sync configuration
 */
export interface SyncConfig {
  autoSync: boolean;
  syncInterval?: number; // Milliseconds between sync checks
  retryAttempts?: number;
  retryDelay?: number;
  bridgeConfig: BridgeConfig;
}

/**
 * Sync result
 */
export interface SyncResult {
  success: boolean;
  mirrorId: string;
  syncedAt: number;
  changes: string[];
  error?: string;
}

/**
 * In-memory storage for NFT mirrors (in production, this would be stored on-chain)
 */
const nftMirrors = new Map<string, NFTMirror>();

/**
 * Active sync intervals for automatic synchronization
 */
const syncIntervals = new Map<string, NodeJS.Timeout>();

/**
 * Creates a new NFT mirror linking an ICP NFT to a Lukso NFT
 *
 * This function initiates the mirroring process, creating a record that tracks
 * the relationship between an NFT on ICP and its mirrored representation on Lukso.
 *
 * @param icpCanisterId - The DIP-721 canister ID on ICP
 * @param icpTokenId - The token ID on ICP
 * @param luksoContractAddress - The LSP8 contract address on Lukso
 * @param luksoTokenId - The token ID on Lukso (may be generated)
 * @param profileLink - Optional profile link for owner verification
 * @param config - Sync configuration
 * @returns Promise resolving to the created NFT mirror
 *
 * @example
 * ```typescript
 * const mirror = await createNFTMirror(
 *   'rrkah-fqaaa-aaaaa-aaaaq-cai',
 *   '1',
 *   '0x1234...',
 *   '1',
 *   profileLink,
 *   config
 * );
 * console.log(`Mirror created with ID: ${mirror.id}`);
 * ```
 */
export async function createNFTMirror(
  icpCanisterId: string,
  icpTokenId: string,
  luksoContractAddress: string,
  luksoTokenId: string,
  profileLink: ProfileLink | null,
  config: SyncConfig,
): Promise<NFTMirror> {
  console.log(
    `[NFT Mirror] Creating mirror for ICP token ${icpTokenId} -> Lukso token ${luksoTokenId}`,
  );

  const mirrorId = `${icpCanisterId}-${icpTokenId}-${luksoContractAddress}-${luksoTokenId}`;
  const now = Date.now();

  const mirror: NFTMirror = {
    id: mirrorId,
    icpCanisterId,
    icpTokenId,
    luksoContractAddress,
    luksoTokenId,
    status: "pending",
    createdAt: now,
    lastSyncedAt: now,
    syncDirection: "bidirectional",
    metadata: {},
    owner: {
      icpPrincipal: profileLink?.icpPrincipal,
      luksoAddress: profileLink?.luksoAddress,
    },
    syncHistory: [
      {
        timestamp: now,
        eventType: "created",
        sourceChain: "icp",
        details: "Mirror created",
      },
    ],
  };

  // Store the mirror
  nftMirrors.set(mirrorId, mirror);

  // Perform initial sync
  try {
    await syncNFTMetadata(mirrorId, config);
    mirror.status = "active";
  } catch (error) {
    mirror.status = "failed";
    mirror.syncHistory.push({
      timestamp: Date.now(),
      eventType: "sync_failed",
      sourceChain: "icp",
      details: "Initial sync failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }

  // Set up automatic sync if enabled
  if (config.autoSync && config.syncInterval) {
    startAutoSync(mirrorId, config);
  }

  console.log(
    `[NFT Mirror] Mirror created: ${mirrorId} (status: ${mirror.status})`,
  );

  return mirror;
}

/**
 * Synchronizes NFT metadata between ICP and Lukso
 *
 * This function compares metadata on both chains and updates the target chain
 * if differences are detected.
 *
 * @param mirrorId - The NFT mirror ID
 * @param config - Sync configuration
 * @returns Promise resolving to sync result
 *
 * @example
 * ```typescript
 * const result = await syncNFTMetadata(mirrorId, config);
 * if (result.success) {
 *   console.log('Metadata synced:', result.changes);
 * }
 * ```
 */
export async function syncNFTMetadata(
  mirrorId: string,
  _config: SyncConfig,
): Promise<SyncResult> {
  const mirror = nftMirrors.get(mirrorId);

  if (!mirror) {
    return {
      success: false,
      mirrorId,
      syncedAt: Date.now(),
      changes: [],
      error: "Mirror not found",
    };
  }

  console.log(`[NFT Mirror] Syncing metadata for mirror ${mirrorId}`);

  mirror.status = "syncing";
  const changes: string[] = [];

  try {
    // TODO: Implement actual metadata comparison and sync
    // 1. Fetch metadata from ICP canister
    // 2. Fetch metadata from Lukso contract
    // 3. Compare metadata hashes
    // 4. If different, update the target chain based on syncDirection

    // Stub implementation
    console.log("[NFT Mirror] Metadata sync (stub implementation)");

    // Update sync timestamp
    mirror.lastSyncedAt = Date.now();
    mirror.status = "active";

    // Add sync event
    mirror.syncHistory.push({
      timestamp: Date.now(),
      eventType: "updated",
      sourceChain: "icp",
      details: "Metadata synced (stub)",
    });

    return {
      success: true,
      mirrorId,
      syncedAt: mirror.lastSyncedAt,
      changes,
    };
  } catch (error) {
    mirror.status = "failed";
    mirror.syncHistory.push({
      timestamp: Date.now(),
      eventType: "sync_failed",
      sourceChain: "icp",
      details: "Sync failed",
      error: error instanceof Error ? error.message : "Unknown error",
    });

    return {
      success: false,
      mirrorId,
      syncedAt: Date.now(),
      changes,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Starts automatic synchronization for an NFT mirror
 *
 * @param mirrorId - The NFT mirror ID
 * @param config - Sync configuration
 */
export function startAutoSync(mirrorId: string, config: SyncConfig): void {
  // Clear existing interval if any
  stopAutoSync(mirrorId);

  if (!config.syncInterval) {
    console.warn(
      "[NFT Mirror] Cannot start auto-sync: syncInterval not configured",
    );
    return;
  }

  console.log(
    `[NFT Mirror] Starting auto-sync for ${mirrorId} (interval: ${config.syncInterval}ms)`,
  );

  const interval = setInterval(async () => {
    await syncNFTMetadata(mirrorId, config);
  }, config.syncInterval);

  syncIntervals.set(mirrorId, interval);
}

/**
 * Stops automatic synchronization for an NFT mirror
 *
 * @param mirrorId - The NFT mirror ID
 */
export function stopAutoSync(mirrorId: string): void {
  const interval = syncIntervals.get(mirrorId);
  if (interval) {
    clearInterval(interval);
    syncIntervals.delete(mirrorId);
    console.log(`[NFT Mirror] Stopped auto-sync for ${mirrorId}`);
  }
}

/**
 * Retrieves an NFT mirror by ID
 *
 * @param mirrorId - The NFT mirror ID
 * @returns The NFT mirror if found, null otherwise
 */
export function getNFTMirror(mirrorId: string): NFTMirror | null {
  return nftMirrors.get(mirrorId) || null;
}

/**
 * Lists all NFT mirrors
 *
 * @param filter - Optional filter criteria
 * @returns Array of NFT mirrors
 */
export function listNFTMirrors(filter?: {
  status?: MirrorStatus;
  icpCanisterId?: string;
  luksoContractAddress?: string;
}): NFTMirror[] {
  let mirrors = Array.from(nftMirrors.values());

  if (filter) {
    if (filter.status) {
      mirrors = mirrors.filter((m) => m.status === filter.status);
    }
    if (filter.icpCanisterId) {
      mirrors = mirrors.filter((m) => m.icpCanisterId === filter.icpCanisterId);
    }
    if (filter.luksoContractAddress) {
      mirrors = mirrors.filter(
        (m) => m.luksoContractAddress === filter.luksoContractAddress,
      );
    }
  }

  return mirrors;
}

/**
 * Deletes an NFT mirror
 *
 * This stops synchronization and removes the mirror record.
 *
 * @param mirrorId - The NFT mirror ID
 * @returns True if deleted, false if not found
 */
export function deleteNFTMirror(mirrorId: string): boolean {
  stopAutoSync(mirrorId);
  return nftMirrors.delete(mirrorId);
}

/**
 * Handles NFT transfer events and updates mirror ownership
 *
 * This function should be called when an NFT is transferred on either chain
 * to update the mirror's owner information.
 *
 * @param mirrorId - The NFT mirror ID
 * @param newOwner - New owner information
 * @param sourceChain - Chain where the transfer occurred
 * @returns Promise resolving to updated mirror
 */
export async function handleNFTTransfer(
  mirrorId: string,
  newOwner: { icpPrincipal?: string; luksoAddress?: string },
  sourceChain: "icp" | "lukso",
): Promise<NFTMirror | null> {
  const mirror = nftMirrors.get(mirrorId);

  if (!mirror) {
    console.error(`[NFT Mirror] Mirror not found: ${mirrorId}`);
    return null;
  }

  console.log(
    `[NFT Mirror] Handling transfer for ${mirrorId} on ${sourceChain}`,
  );

  // Update owner information
  if (sourceChain === "icp" && newOwner.icpPrincipal) {
    mirror.owner.icpPrincipal = newOwner.icpPrincipal;
  } else if (sourceChain === "lukso" && newOwner.luksoAddress) {
    mirror.owner.luksoAddress = newOwner.luksoAddress;
  }

  // Add transfer event
  mirror.syncHistory.push({
    timestamp: Date.now(),
    eventType: "transferred",
    sourceChain,
    details: "NFT transferred to new owner",
  });

  // TODO: Propagate transfer to the other chain if bidirectional sync is enabled

  return mirror;
}

/**
 * Computes a hash of NFT metadata for comparison
 *
 * @param metadata - The metadata object to hash
 * @returns Hash string
 */
export function computeMetadataHash(
  metadata: DIP721Metadata | LSP8Metadata,
): string {
  // TODO: Implement actual cryptographic hash
  // This would use a library like crypto-js or @noble/hashes

  const metadataString = JSON.stringify(metadata);

  // Stub: Simple string hash (not cryptographically secure)
  let hash = 0;
  for (let i = 0; i < metadataString.length; i++) {
    const char = metadataString.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  return hash.toString(16);
}

/**
 * Validates mirror configuration
 *
 * @param mirror - The NFT mirror to validate
 * @returns Validation result with any errors
 */
export function validateNFTMirror(mirror: NFTMirror): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!mirror.icpCanisterId || mirror.icpCanisterId.trim() === "") {
    errors.push("icpCanisterId is required");
  }

  if (!mirror.icpTokenId || mirror.icpTokenId.trim() === "") {
    errors.push("icpTokenId is required");
  }

  if (
    !mirror.luksoContractAddress ||
    mirror.luksoContractAddress.trim() === ""
  ) {
    errors.push("luksoContractAddress is required");
  }

  if (!mirror.luksoTokenId || mirror.luksoTokenId.trim() === "") {
    errors.push("luksoTokenId is required");
  }

  if (!/^0x[a-fA-F0-9]{40}$/.test(mirror.luksoContractAddress)) {
    errors.push("luksoContractAddress must be a valid Ethereum address");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Gets sync statistics for monitoring
 *
 * @returns Sync statistics
 */
export function getSyncStatistics(): {
  totalMirrors: number;
  activeSync: number;
  pendingSync: number;
  failedSync: number;
  outOfSync: number;
} {
  const mirrors = Array.from(nftMirrors.values());

  return {
    totalMirrors: mirrors.length,
    activeSync: mirrors.filter((m) => m.status === "active").length,
    pendingSync: mirrors.filter((m) => m.status === "pending").length,
    failedSync: mirrors.filter((m) => m.status === "failed").length,
    outOfSync: mirrors.filter((m) => m.status === "out_of_sync").length,
  };
}

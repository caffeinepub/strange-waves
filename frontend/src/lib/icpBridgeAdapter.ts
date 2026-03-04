/**
 * ICP Bridge Adapter Module
 * 
 * This module handles NFT and metadata export from DIP-721 canisters on the Internet Computer,
 * formatting the data into Lukso LSP7/LSP8 compatibility schema. It provides utilities for
 * converting ICP NFT standards to Lukso Universal Profile standards.
 * 
 * DIP-721 is the Internet Computer's NFT standard, similar to ERC-721.
 * LSP7 (Digital Asset) and LSP8 (Identifiable Digital Asset) are Lukso's token standards.
 * 
 * @module icpBridgeAdapter
 */

/**
 * DIP-721 NFT Metadata structure from ICP canister
 */
export interface DIP721Metadata {
  tokenId: bigint;
  owner: string; // Principal as string
  properties: Array<[string, string]>; // Key-value pairs
  minted_at: bigint;
  minted_by: string;
  transferred_at?: bigint;
  transferred_by?: string;
  approved_at?: bigint;
  approved_by?: string;
  burned_at?: bigint;
  burned_by?: string;
  operator?: string;
}

/**
 * DIP-721 Token Metadata (extended properties)
 */
export interface DIP721TokenMetadata {
  name?: string;
  description?: string;
  image?: string; // URL or data URI
  external_url?: string;
  attributes?: Array<{
    trait_type: string;
    value: string | number;
  }>;
}

/**
 * LSP7 Digital Asset Metadata Schema
 * Compatible with Lukso's fungible token standard
 */
export interface LSP7Metadata {
  LSP4Metadata: {
    name: string;
    description: string;
    links: Array<{ title: string; url: string }>;
    icon: Array<{
      width: number;
      height: number;
      url: string;
      verification?: {
        method: string;
        data: string;
      };
    }>;
    images: Array<Array<{
      width: number;
      height: number;
      url: string;
      verification?: {
        method: string;
        data: string;
      };
    }>>;
    assets: Array<{
      url: string;
      fileType: string;
      verification?: {
        method: string;
        data: string;
      };
    }>;
  };
  totalSupply: string;
  decimals: number;
}

/**
 * LSP8 Identifiable Digital Asset Metadata Schema
 * Compatible with Lukso's NFT standard (similar to ERC-721)
 */
export interface LSP8Metadata {
  LSP4Metadata: {
    name: string;
    description: string;
    links: Array<{ title: string; url: string }>;
    icon: Array<{
      width: number;
      height: number;
      url: string;
      verification?: {
        method: string;
        data: string;
      };
    }>;
    images: Array<Array<{
      width: number;
      height: number;
      url: string;
      verification?: {
        method: string;
        data: string;
      };
    }>>;
    assets: Array<{
      url: string;
      fileType: string;
      verification?: {
        method: string;
        data: string;
      };
    }>;
    attributes?: Array<{
      key: string;
      value: string;
      type: string;
    }>;
  };
  tokenId: string;
  tokenIdFormat: number; // 0 = Number, 1 = String, 2 = Address, etc.
}

/**
 * Bridge configuration for ICP to Lukso conversion
 */
export interface BridgeConfig {
  icpCanisterId: string;
  luksoNetworkId: string; // 'mainnet' | 'testnet'
  ipfsGateway?: string; // For hosting metadata
  verificationMethod?: 'keccak256' | 'sha256';
}

/**
 * Result of NFT export operation
 */
export interface ExportResult {
  success: boolean;
  lsp8Metadata?: LSP8Metadata;
  lsp7Metadata?: LSP7Metadata;
  error?: string;
  transactionHash?: string;
}

/**
 * Fetches NFT metadata from a DIP-721 canister via HTTP outcall
 * 
 * This function queries the ICP canister to retrieve NFT metadata.
 * In production, this would use the IC HTTP outcall feature or direct actor calls.
 * 
 * @param canisterId - The DIP-721 canister ID on ICP
 * @param tokenId - The token ID to fetch
 * @returns Promise resolving to DIP-721 metadata
 * 
 * @example
 * ```typescript
 * const metadata = await fetchDIP721Metadata('rrkah-fqaaa-aaaaa-aaaaq-cai', 1n);
 * console.log(`NFT Owner: ${metadata.owner}`);
 * ```
 */
export async function fetchDIP721Metadata(
  canisterId: string,
  tokenId: bigint
): Promise<DIP721Metadata> {
  // TODO: Implement actual HTTP outcall to ICP canister
  // This would use the IC agent to call the DIP-721 canister's metadata query
  
  console.log(`[ICP Bridge] Fetching DIP-721 metadata for token ${tokenId} from ${canisterId}`);
  
  // Stub implementation - replace with actual canister call
  throw new Error('fetchDIP721Metadata: Not yet implemented. Requires IC agent integration.');
  
  // Future implementation would look like:
  // const agent = await HttpAgent.create({ host: 'https://ic0.app' });
  // const actor = Actor.createActor(dip721Interface, { agent, canisterId });
  // return await actor.tokenMetadata(tokenId);
}

/**
 * Converts DIP-721 metadata to LSP8 (NFT) format
 * 
 * This function transforms ICP's DIP-721 NFT metadata into Lukso's LSP8 schema,
 * ensuring compatibility with Universal Profiles and Lukso ecosystem tools.
 * 
 * @param dip721Metadata - The DIP-721 metadata from ICP
 * @param tokenMetadata - Extended token metadata (name, description, image, etc.)
 * @param config - Bridge configuration
 * @returns LSP8-compatible metadata object
 * 
 * @example
 * ```typescript
 * const lsp8 = convertToLSP8(dip721Data, tokenData, config);
 * console.log(`LSP8 Token: ${lsp8.LSP4Metadata.name}`);
 * ```
 */
export function convertToLSP8(
  dip721Metadata: DIP721Metadata,
  tokenMetadata: DIP721TokenMetadata,
  config: BridgeConfig
): LSP8Metadata {
  console.log(`[ICP Bridge] Converting DIP-721 token ${dip721Metadata.tokenId} to LSP8 format`);
  
  // Extract attributes from DIP-721 properties
  const attributes = dip721Metadata.properties.map(([key, value]) => ({
    key,
    value,
    type: typeof value === 'number' ? 'number' : 'string',
  }));
  
  // Add metadata attributes if present
  if (tokenMetadata.attributes) {
    tokenMetadata.attributes.forEach(attr => {
      attributes.push({
        key: attr.trait_type,
        value: String(attr.value), // Convert to string to match LSP8Metadata type
        type: typeof attr.value === 'number' ? 'number' : 'string',
      });
    });
  }
  
  // Construct LSP8 metadata following LSP4 Digital Asset Metadata standard
  const lsp8Metadata: LSP8Metadata = {
    LSP4Metadata: {
      name: tokenMetadata.name || `ICP NFT #${dip721Metadata.tokenId}`,
      description: tokenMetadata.description || 'NFT bridged from Internet Computer',
      links: tokenMetadata.external_url 
        ? [{ title: 'Original on ICP', url: tokenMetadata.external_url }]
        : [],
      icon: [],
      images: tokenMetadata.image 
        ? [[{
            width: 512,
            height: 512,
            url: tokenMetadata.image,
            verification: config.verificationMethod ? {
              method: config.verificationMethod,
              data: '0x', // TODO: Compute actual hash
            } : undefined,
          }]]
        : [],
      assets: tokenMetadata.image 
        ? [{
            url: tokenMetadata.image,
            fileType: 'image/png', // TODO: Detect actual file type
            verification: config.verificationMethod ? {
              method: config.verificationMethod,
              data: '0x', // TODO: Compute actual hash
            } : undefined,
          }]
        : [],
      attributes,
    },
    tokenId: dip721Metadata.tokenId.toString(),
    tokenIdFormat: 0, // Number format
  };
  
  return lsp8Metadata;
}

/**
 * Converts DIP-721 collection metadata to LSP7 (fungible token) format
 * 
 * This is useful for representing fractional ownership or collection-level tokens.
 * 
 * @param collectionName - Name of the NFT collection
 * @param collectionDescription - Description of the collection
 * @param totalSupply - Total number of tokens in collection
 * @param config - Bridge configuration
 * @returns LSP7-compatible metadata object
 */
export function convertToLSP7(
  collectionName: string,
  collectionDescription: string,
  totalSupply: bigint,
  config: BridgeConfig
): LSP7Metadata {
  console.log(`[ICP Bridge] Converting collection to LSP7 format`);
  
  const lsp7Metadata: LSP7Metadata = {
    LSP4Metadata: {
      name: collectionName,
      description: collectionDescription,
      links: [],
      icon: [],
      images: [],
      assets: [],
    },
    totalSupply: totalSupply.toString(),
    decimals: 0, // NFT collections typically have 0 decimals
  };
  
  return lsp7Metadata;
}

/**
 * Exports NFT metadata to Lukso-compatible format and prepares for minting
 * 
 * This function orchestrates the full export process:
 * 1. Fetches DIP-721 metadata from ICP
 * 2. Converts to LSP8 format
 * 3. Prepares data for Lukso blockchain interaction
 * 
 * @param canisterId - The DIP-721 canister ID
 * @param tokenId - The token ID to export
 * @param config - Bridge configuration
 * @returns Promise resolving to export result
 * 
 * @example
 * ```typescript
 * const result = await exportNFTToLukso('rrkah-fqaaa-aaaaa-aaaaq-cai', 1n, config);
 * if (result.success) {
 *   console.log('NFT exported successfully:', result.lsp8Metadata);
 * }
 * ```
 */
export async function exportNFTToLukso(
  canisterId: string,
  tokenId: bigint,
  config: BridgeConfig
): Promise<ExportResult> {
  try {
    console.log(`[ICP Bridge] Starting NFT export for token ${tokenId}`);
    
    // Step 1: Fetch DIP-721 metadata (stub - needs implementation)
    // const dip721Metadata = await fetchDIP721Metadata(canisterId, tokenId);
    
    // Step 2: Fetch extended token metadata (stub - needs implementation)
    // const tokenMetadata = await fetchTokenMetadata(canisterId, tokenId);
    
    // Step 3: Convert to LSP8 format
    // const lsp8Metadata = convertToLSP8(dip721Metadata, tokenMetadata, config);
    
    // Step 4: Upload metadata to IPFS or decentralized storage (stub)
    // const metadataUri = await uploadToIPFS(lsp8Metadata, config.ipfsGateway);
    
    // Step 5: Prepare for Lukso smart contract interaction (stub)
    // This would involve calling the LSP8 contract's mint function
    
    console.log('[ICP Bridge] Export process initiated (stub implementation)');
    
    return {
      success: false,
      error: 'Full implementation pending. Requires Lukso SDK integration.',
    };
  } catch (error) {
    console.error('[ICP Bridge] Export failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Validates LSP8 metadata against Lukso standards
 * 
 * @param metadata - The LSP8 metadata to validate
 * @returns Validation result with any errors
 */
export function validateLSP8Metadata(metadata: LSP8Metadata): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  if (!metadata.LSP4Metadata.name || metadata.LSP4Metadata.name.trim() === '') {
    errors.push('LSP4Metadata.name is required');
  }
  
  if (!metadata.LSP4Metadata.description || metadata.LSP4Metadata.description.trim() === '') {
    errors.push('LSP4Metadata.description is required');
  }
  
  if (!metadata.tokenId) {
    errors.push('tokenId is required');
  }
  
  if (metadata.tokenIdFormat < 0 || metadata.tokenIdFormat > 2) {
    errors.push('tokenIdFormat must be 0 (Number), 1 (String), or 2 (Address)');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Batch export multiple NFTs from ICP to Lukso format
 * 
 * @param canisterId - The DIP-721 canister ID
 * @param tokenIds - Array of token IDs to export
 * @param config - Bridge configuration
 * @returns Promise resolving to array of export results
 */
export async function batchExportNFTs(
  canisterId: string,
  tokenIds: bigint[],
  config: BridgeConfig
): Promise<ExportResult[]> {
  console.log(`[ICP Bridge] Starting batch export of ${tokenIds.length} NFTs`);
  
  const results: ExportResult[] = [];
  
  for (const tokenId of tokenIds) {
    const result = await exportNFTToLukso(canisterId, tokenId, config);
    results.push(result);
  }
  
  return results;
}


# Strange Waves

## Current State
The backend has a DIP-721 NFT implementation with minting, ownership transfer, and marketplace functions. However, it is missing the standard interface discovery methods that external wallets (OISY, Plug, etc.) query to detect the NFT standard before importing a collection.

## Requested Changes (Diff)

### Add
- `supportedStandards()` query method returning `[{ name: "DIP721"; url: "https://github.com/Psychedelic/DIP721" }]`
- `dip721_name()` query returning the collection name "Strange Waves"
- `dip721_symbol()` query returning the collection symbol "SWNFT"
- `dip721_total_supply()` query returning the current total number of minted NFTs
- `dip721_metadata()` query returning collection-level metadata
- `dip721_owner_token_identifiers(user: Principal)` query returning token IDs owned by a principal (for OISY NFT display)
- `dip721_token_metadata(tokenId: Nat)` query returning per-token metadata in DIP-721 format

### Modify
- `main.mo` — add all DIP-721 interface discovery and metadata methods

### Remove
- Nothing removed

## Implementation Plan
1. Add `SupportedStandard` type and `supportedStandards()` query to backend
2. Add collection-level metadata queries (`dip721_name`, `dip721_symbol`, `dip721_total_supply`, `dip721_metadata`)
3. Add per-token queries (`dip721_token_metadata`, `dip721_owner_token_identifiers`) in DIP-721 format
4. Validate and build

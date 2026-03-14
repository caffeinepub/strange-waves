# Strange Waves

## Current State
The NFT marketplace "List for Sale" feature fails with `this.actor.listNFTForSale is not a function`. The backend Motoko canister has `listNFTForSale`, `delistNFT`, `getListings`, `buyNFT`, `ownerOf`, and `transferNFT` implemented, but these methods are missing from the IDL factory files (`backend.did.js` and `backend.did.d.ts`). This means the ICP actor is created without these methods, so they return "not a function" errors.

Additionally, the `backend.ts` wrapper stubs pass the raw Candid variant result directly (e.g. `{ ok: null }`) but `useQueries.ts` checks `result.__kind__ === "ok"`, so results would be misread even if the call succeeded.

The `ListForSaleDialog` only handles a single `tokenId`. For collections (multiple editions), there's no way to list a set quantity at once.

## Requested Changes (Diff)

### Add
- `NFTListing`, `ListNFTRawResult`, `TransferNFTRawResult`, `BuyNFTRawResult` IDL types in `backend.did.js` (both module-level and inside `idlFactory`)
- `NFTListing` interface + `ListNFTRawResult`/`TransferNFTRawResult`/`BuyNFTRawResult` variant types in `backend.did.d.ts`
- Marketplace methods to `_SERVICE` in `backend.did.d.ts`: `getListings`, `listNFTForSale`, `delistNFT`, `buyNFT`, `ownerOf`, `transferNFT`
- Quantity input to `ListForSaleDialog` (1 to N where N = number of token IDs in the collection group)
- `collectionTokenIds: bigint[]` prop to `ListForSaleDialog` replacing single `tokenId: bigint`

### Modify
- `backend.ts`: Fix marketplace method stubs to map raw Candid variants to `__kind__` format. `getListings` should map `fileType: { audio: null }` to `FileType.audio`. `ownerOf` should convert `[] | [Principal]` to `Principal | null`. Other methods should use `Object.keys(result)[0]` to extract the variant key as `__kind__`.
- `backend.did.js`: Add NFTListing, ListNFTResponse, TransferNFTResponse, BuyNFTResponse IDL type definitions and add service methods to both `idlService` and `idlFactory` return value
- `backend.did.d.ts`: Add types and service methods
- `MusicMints.tsx`: Update `groupNFTsByTitle` to track all token IDs per group (not just the first). Update `listForSaleState` to use `tokenIds: bigint[]`. Pass all collection token IDs to `ListForSaleDialog`.
- `NFTMarketplaceActions.tsx`: `ListForSaleDialog` accepts `collectionTokenIds: bigint[]`. Adds a "Quantity to List" numeric input (min 1, max = collectionTokenIds.length). On submit, loops through first N token IDs and calls `listMutation.mutateAsync` for each.

### Remove
Nothing removed.

## Implementation Plan
1. Fix `backend.did.js`: add NFTListing record, ListNFTResponse/TransferNFTResponse/BuyNFTResponse variants, and the 6 service methods to both `idlService` and `idlFactory`
2. Fix `backend.did.d.ts`: add NFTListing interface, raw result types, and methods to `_SERVICE`
3. Fix `backend.ts`: update the 6 marketplace stubs to properly map Candid variants to `__kind__` objects
4. Fix `NFTMarketplaceActions.tsx`: accept `collectionTokenIds` array + quantity input, loop on submit
5. Fix `MusicMints.tsx`: track all tokenIds per group, pass them to `ListForSaleDialog`

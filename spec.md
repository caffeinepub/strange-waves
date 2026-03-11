# Strange Waves — Step 3: Atomic ICP Ledger Payment for NFT Purchases

## Current State
- Step 1 (on-chain DIP-721 ownership transfer, listing, marketplace logic) is complete.
- Step 2 (typed frontend bindings, marketplace hooks) is complete.
- `buyNFT(tokenId)` in the backend transfers NFT ownership to the caller but does NOT deduct or transfer any ICP payment.
- The frontend `useBuyNFT` hook calls `buyNFT` and shows success without showing price or deducting funds.
- `NFTListing` stores `priceE8s : bigint` already.
- `BuyNFTResult` has variants: ok, notListed, unauthorized, notFound, cannotBuyOwn.

## Requested Changes (Diff)

### Add
- Backend: `BuyNFTResult` new variant `insufficientFunds`.
- Backend: Before transferring NFT ownership in `buyNFT`, make an inter-canister call to the ICP ledger canister (`ryjl3-tyaaa-aaaaa-aaaba-cai`) to transfer `priceE8s` in ICP e8s from the buyer (caller) to the seller (listing.seller). The ICP transfer fee is 10000 e8s. If the ledger transfer fails (e.g. insufficient funds), return `insufficientFunds` and do NOT transfer the NFT.
- Backend: After successful ledger payment, transfer NFT ownership to buyer and remove the listing.
- Frontend: Update `BuyNFTResult` type in `backend.d.ts` to add `insufficientFunds` variant.
- Frontend: In `useBuyNFT` hook, handle `insufficientFunds` with a clear error message.
- Frontend: In the MusicMints marketplace UI, show the ICP price of each listing prominently (convert e8s to ICP). Replace "Claim NFT" button label with "Buy for X ICP". Show a confirmation dialog before purchase that displays price and warns ICP will be deducted from wallet.

### Modify
- Backend: `buyNFT` function upgraded to include ICP ledger transfer before ownership transfer.
- Frontend: `MusicMints.tsx` marketplace view — update buy flow with price display and confirmation.
- Frontend: `useQueries.ts` — update `useBuyNFT` error handling for `insufficientFunds`.

### Remove
- Nothing removed.

## Implementation Plan
1. Regenerate Motoko backend with ICP ledger inter-canister call in `buyNFT` and `insufficientFunds` result variant.
2. Update `backend.d.ts` to add `insufficientFunds` to `BuyNFTResult`.
3. Update `useQueries.ts` `useBuyNFT` to handle the new variant.
4. Update `MusicMints.tsx` marketplace to show ICP price per listing and confirmation dialog before purchase.

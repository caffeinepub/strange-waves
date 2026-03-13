# Strange Waves

## Current State
- Music Mints page shows NFT listings in a basic card grid with title, token ID, owner, price, and a Buy/Claim button
- NFTMintDialog handles minting with attachment support (PDF, image, audio, video)
- No detail popup exists for NFT listings
- No audio preview is available from the marketplace
- All attached files are visible regardless of NFT ownership

## Requested Changes (Diff)

### Add
- NFT Detail Popup (modal) that opens when a buyer clicks any NFT listing card on the Music Mints page
  - Shows: cover art, title, creator, edition info (e.g. "Edition 2 of 5"), NFT type, royalty %, payment token, price, description, ownership status
  - 30-second audio preview: plays the first 30 seconds of the associated track, then stops. Show a progress bar and play/pause toggle
  - Private Attachment section: displays a locked placeholder ("Unlock after purchase") for any file marked as private. If the viewer is the current NFT owner, the file is revealed and downloadable
  - Buy Now / Claim NFT button inside the modal
- Toggle in the NFTMintDialog for each attached file: "Private (owner-only)" checkbox. If checked, that attachment is flagged as private in the NFT metadata

### Modify
- NFT listing cards on Music Mints page: add a "View Details" button / make card clickable to open the new detail modal
- NFT metadata type to include a `privateAttachments` flag per attachment item

### Remove
- Nothing removed

## Implementation Plan
1. Add `isPrivate` boolean field to the attachment object in NFTMintDialog; persist it in the minted NFT metadata
2. Create `NFTDetailModal.tsx` component with:
   - Full metadata display
   - 30-second audio preview with play/pause and progress bar (clamps playback at 30s)
   - Attachment list: private ones show a lock icon + "Own this NFT to unlock" unless `currentUser === nft.owner`
   - Buy/Claim action button
3. Wire NFT listing cards in MusicMints.tsx to open the modal on click
4. Add "Private (owner-only)" checkbox per attachment in NFTMintDialog

# Specification

## Summary
**Goal:** Add a track upload form to the SScc AlbumPage, visible only to the authenticated owner, allowing them to upload audio tracks with a cover image, title, and description.

**Planned changes:**
- Add a track upload form section below the existing track listing on `AlbumPage.tsx`
- Form includes: audio file input, cover image file input, track title text input, and track description textarea
- Show the form only when the authenticated user matches the owner/admin principal
- On submit, upload the audio file, cover image, title, and description to the backend and associate them with the SScc album
- After a successful upload, refresh the track listing on the page without a full reload
- Show a loading indicator and disable the submit button while uploading
- Validate that an audio file and title are present before allowing submission
- Add backend logic in `backend/main.mo` to handle track uploads and storage

**User-visible outcome:** The owner can upload new music tracks (with cover image and description) directly from the SScc AlbumPage, and the new track appears in the listing immediately after a successful upload.

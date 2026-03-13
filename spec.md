# Strange Waves

## Current State
- AudioLibrary shows uploaded tracks in an "All Files" tab grid with play and mint buttons
- AudioUploader form has Title, Creator, and Public toggle — no Genre selector
- Genre type exists in backend (pop, rock, jazz, hipHop, electronic, classical, other) but defaults to "Unknown other" at upload
- No delete button is shown on track cards
- Tracks display in upload order with no way to reorder them
- `deleteAudioFile` backend method and `useDeleteAudioFile` hook already exist

## Requested Changes (Diff)

### Add
- Genre dropdown selector to AudioUploader form (options: Pop, Rock, Jazz, Hip-Hop, Electronic, Classical, Other)
- Genre badge displayed on each track card in AudioLibrary
- Delete button on each track card in AudioLibrary (owner/admin only), with a confirmation dialog before deleting
- Drag-to-sort reordering of tracks in the "All Files" tab (owner/admin only), with sort order persisted in localStorage

### Modify
- AudioUploader: add Genre field between Creator and Public toggle
- AudioLibrary "All Files" tab: add Genre badge, Delete button, and drag handles for reordering (when signed in as admin)
- Track card layout: accommodate new Genre badge and action buttons cleanly

### Remove
- Nothing removed

## Implementation Plan
1. Add genre selector (Select component) to AudioUploader form; wire selected genre to upload mutation
2. In AudioLibrary, import `useDeleteAudioFile` and `useIsCallerAdmin`; show delete button with AlertDialog confirmation on each local file card when admin
3. Display Genre badge on each track card (format the genre variant into readable text)
4. Implement client-side drag-to-sort in the "All Files" tab using mouse/touch drag events; persist order array to localStorage keyed by file IDs; sort displayed list by stored order when available; show drag handles (GripVertical icon) only when admin is signed in

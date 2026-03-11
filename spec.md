# Strange Waves

## Current State
The `AudioPlayer` component is rendered inside `renderPage()` in `App.tsx`, which means it unmounts every time the user navigates to a different page. The selected audio state (`useSelectedAudio`) persists, but the player UI and audio element are torn down on each navigation, stopping playback.

## Requested Changes (Diff)

### Add
- `AudioPlayerContext` — a React context that holds the current track (`CombinedAudio | null`), playback state (playing/paused, currentTime, duration, volume, muted), and control functions (play, pause, seek, setVolume, setTrack)
- `useAudioPlayer` hook that consumes the context
- `PersistentAudioPlayer` component — a fixed bottom bar player that renders outside `renderPage()` so it never unmounts during navigation. Shows track artwork, title, artist, progress bar, play/pause, volume controls.
- `AudioPlayerProvider` wrapping the app at root level, managing the single `<audio>` element

### Modify
- `App.tsx` — wrap app in `AudioPlayerProvider`, move the persistent player bar outside `renderPage()` (placed between `<main>` and `<Footer>`), remove the inline `AudioPlayer` from the home page section (the persistent bar replaces it)
- `AudioLibrary.tsx` and `AlbumPage.tsx` — update track selection to call `setTrack` from context instead of `setSelectedAudio`, so clicking a track anywhere starts the global player
- Any other component that triggers audio playback — wire to the global context

### Remove
- The `selectedAudio` / `setSelectedAudio` usage from `App.tsx` home page section (replaced by context)

## Implementation Plan
1. Create `src/frontend/src/contexts/AudioPlayerContext.tsx` with provider, context, and `useAudioPlayer` hook. The `<audio>` element lives inside the provider so it never unmounts.
2. Create `src/frontend/src/components/PersistentAudioPlayer.tsx` — fixed bottom bar, only visible when a track is loaded.
3. Update `App.tsx` to wrap with `AudioPlayerProvider`, render `<PersistentAudioPlayer>` between `<main>` and `<Footer>`, and remove the inline player from home page.
4. Update `AudioLibrary.tsx` to use `useAudioPlayer().setTrack` when a track is selected.
5. Update `AlbumPage.tsx` similarly.
6. Validate (lint, typecheck, build).

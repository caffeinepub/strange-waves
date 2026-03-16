# Strange Waves

## Current State
The TrackPopupPlayer renders as a fixed panel (bottom-20, inset-x-4, max-w-md) with backdrop, controls, repeat/shuffle, and volume. It opens when a track card is clicked in AudioLibrary. There is no play count tracking, no "Add to Playlist" in the popup, and no share/link feature.

## Requested Changes (Diff)

### Add
- Mobile-responsive popup: ensure fully visible on mobile — adjust bottom offset for browser chrome, cap height with overflow scroll.
- Play count metric: track per-track play counts in localStorage (key: sw_play_counts). Increment on play. Show headphones+count badge on track cards and in the popup.
- Add to Playlist button: in the popup and on track cards. Opens a dropdown listing playlists; tapping one adds the track via useAddTrackToPlaylist.
- Share button: in the popup. Copies `<origin>?track=<id>` to clipboard, shows "Link copied!" toast. On app mount, check ?track= param and auto-load that track.

### Modify
- TrackPopupPlayer: add play count, Add to Playlist, and Share button.
- AudioLibrary track cards: show play count badge, add Add to Playlist icon button.
- AudioPlayerContext: call incrementPlay when audio starts playing.

### Remove
- Nothing.

## Implementation Plan
1. usePlayCounts hook — localStorage read/write helpers.
2. Wire incrementPlay in AudioPlayerContext on play event.
3. Add play count display to TrackPopupPlayer.
4. Add Share button (copy URL + toast).
5. Add to Playlist button in popup (popover with playlist list).
6. Add play count badge + Add to Playlist button to track cards.
7. Fix mobile positioning: bottom-24 on mobile, max-h-[85vh] overflow-y-auto.
8. Auto-load track from ?track= URL param on mount.

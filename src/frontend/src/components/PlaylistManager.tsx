import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronUp,
  Clock,
  Code,
  Copy,
  Edit,
  Link,
  ListMusic,
  Loader2,
  MoreVertical,
  Music,
  Plus,
  Radio,
  Share2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { AudioFile, PlaylistView } from "../backend";
import { useActorReady } from "../hooks/useActorReady";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type CombinedAudio,
  useActionQueueProcessor,
  useAddAudiusTrackToPlaylist,
  useAddTrackToPlaylist,
  useAudioFiles,
  useCallerPlaylists,
  useCreatePlaylist,
  useDeletePlaylist,
  useRemoveAudiusTrackFromPlaylist,
  useRemoveTrackFromPlaylist,
  useRenamePlaylist,
  useSearchAudiusTracks,
} from "../hooks/useQueries";

interface PlaylistManagerProps {
  onSelectAudio: (audio: CombinedAudio) => void;
  onClose?: () => void;
}

export function PlaylistManager({
  onSelectAudio,
  onClose,
}: PlaylistManagerProps) {
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistView | null>(
    null,
  );
  const [isAddTrackDialogOpen, setIsAddTrackDialogOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>("");
  const [audiusSearchQuery, setAudiusSearchQuery] = useState("");
  const [addTrackTab, setAddTrackTab] = useState<"local" | "audius">("local");
  const [embedCodeDialogOpen, setEmbedCodeDialogOpen] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(
    new Set(),
  );
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamePlaylistId, setRenamePlaylistId] = useState<string>("");
  const [renameValue, setRenameValue] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePlaylistId, setDeletePlaylistId] = useState<string>("");
  const [sortDialogOpen, setSortDialogOpen] = useState(false);
  const [sortPlaylist, setSortPlaylist] = useState<PlaylistView | null>(null);
  const [sortOrder, setSortOrder] = useState<string[]>([]);

  const { isActorReady, isActorInitializing } = useActorReady();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: playlists = [], isLoading: isLoadingPlaylists } =
    useCallerPlaylists();
  const { data: audioFiles = [], isLoading: isLoadingAudioFiles } =
    useAudioFiles();
  // Only search when on the audius tab and there's a query; pass empty string otherwise
  const audiusQuery = addTrackTab === "audius" ? audiusSearchQuery : "";
  const { data: audiusResults = [], isLoading: isLoadingAudius } =
    useSearchAudiusTracks(audiusQuery);
  const createPlaylistMutation = useCreatePlaylist();
  const addTrackMutation = useAddTrackToPlaylist();
  const addAudiusTrackMutation = useAddAudiusTrackToPlaylist();
  const removeTrackMutation = useRemoveTrackFromPlaylist();
  const removeAudiusTrackMutation = useRemoveAudiusTrackFromPlaylist();
  const deletePlaylistMutation = useDeletePlaylist();
  const renamePlaylistMutation = useRenamePlaylist();

  // Process queued actions when actor becomes ready
  useActionQueueProcessor();

  const togglePlaylistExpanded = (playlistId: string) => {
    setExpandedPlaylists((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(playlistId)) {
        newSet.delete(playlistId);
      } else {
        newSet.add(playlistId);
      }
      return newSet;
    });
  };

  // Check if current user is the owner of a playlist
  const isPlaylistOwner = (playlist: PlaylistView) => {
    if (!isAuthenticated || !identity) return false;
    const currentPrincipal = identity.getPrincipal().toString();
    return playlist.owner.toString() === currentPrincipal;
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    if (!isActorReady) {
      toast.error(
        "System is initializing. Please wait a moment and try again.",
      );
      return;
    }

    const id = `playlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await createPlaylistMutation.mutateAsync({ id, title: newPlaylistName });
    setNewPlaylistName("");
    setIsCreateDialogOpen(false);
  };

  const handleAddLocalTrack = async () => {
    if (!selectedPlaylist || !selectedTrackId) return;

    if (!isActorReady) {
      toast.error(
        "System is initializing. Please wait a moment and try again.",
      );
      return;
    }

    await addTrackMutation.mutateAsync({
      playlistId: selectedPlaylist.id,
      trackId: selectedTrackId,
    });
    setSelectedTrackId("");
    setIsAddTrackDialogOpen(false);
  };

  const handleAddAudiusTrack = async (audiusTrack: any) => {
    if (!selectedPlaylist) return;

    if (!isActorReady) {
      toast.error(
        "System is initializing. Please wait a moment and try again.",
      );
      return;
    }

    // Convert Audius API track to backend AudiusTrack format
    const artworkUrl =
      typeof audiusTrack.artwork === "string"
        ? audiusTrack.artwork
        : audiusTrack.artwork?.["150x150"] ||
          audiusTrack.artwork?.["480x480"] ||
          "";

    const backendTrack = {
      id: audiusTrack.id,
      title: audiusTrack.title,
      artist: audiusTrack.user.name,
      artworkUrl: artworkUrl,
      streamUrl: `https://discoveryprovider.audius.co/v1/tracks/${audiusTrack.id}/stream`,
    };

    await addAudiusTrackMutation.mutateAsync({
      playlistId: selectedPlaylist.id,
      track: backendTrack,
    });
    setIsAddTrackDialogOpen(false);
    setAudiusSearchQuery("");
  };

  const handleRemoveTrack = async (playlistId: string, trackId: string) => {
    if (!isActorReady) {
      toast.error(
        "System is initializing. Please wait a moment and try again.",
      );
      return;
    }
    await removeTrackMutation.mutateAsync({ playlistId, trackId });
  };

  const handleRemoveAudiusTrack = async (
    playlistId: string,
    trackId: string,
  ) => {
    if (!isActorReady) {
      toast.error(
        "System is initializing. Please wait a moment and try again.",
      );
      return;
    }
    await removeAudiusTrackMutation.mutateAsync({ playlistId, trackId });
  };

  const handleDeletePlaylist = async () => {
    if (!deletePlaylistId) return;

    if (!isActorReady) {
      toast.error(
        "System is initializing. Please wait a moment and try again.",
      );
      return;
    }
    await deletePlaylistMutation.mutateAsync(deletePlaylistId);
    setDeleteDialogOpen(false);
    setDeletePlaylistId("");
  };

  const handleGenerateEmbedCode = (playlistId: string) => {
    const canisterId = window.location.hostname.split(".")[0];
    const code = `<iframe src="https://${canisterId}.ic0.app/playlist/${playlistId}" width="100%" height="400" frameborder="0"></iframe>`;
    setEmbedCode(code);
    setEmbedCodeDialogOpen(true);
  };

  const handleRenamePlaylist = async () => {
    if (!renamePlaylistId || !renameValue.trim()) return;

    if (!isActorReady) {
      toast.error(
        "System is initializing. Please wait a moment and try again.",
      );
      return;
    }

    await renamePlaylistMutation.mutateAsync({
      playlistId: renamePlaylistId,
      newTitle: renameValue,
    });
    setRenameDialogOpen(false);
    setRenamePlaylistId("");
    setRenameValue("");
  };

  const openRenameDialog = (playlist: PlaylistView) => {
    setRenamePlaylistId(playlist.id);
    setRenameValue(playlist.title);
    setRenameDialogOpen(true);
  };

  const openDeleteDialog = (playlistId: string) => {
    setDeletePlaylistId(playlistId);
    setDeleteDialogOpen(true);
  };

  const copyEmbedCode = () => {
    navigator.clipboard.writeText(embedCode);
    toast.success("Embed code copied to clipboard");
  };

  const handleSharePlaylist = (playlistId: string) => {
    const url = `https://strange-waves-wvn.caffeine.xyz/?playlist=${playlistId}`;
    navigator.clipboard.writeText(url);
    toast.success("Share link copied!");
  };

  const openSortDialog = (playlist: PlaylistView) => {
    const storageKey = `playlist-sort-${playlist.id}`;
    const saved = localStorage.getItem(storageKey);
    const allIds = [
      ...playlist.trackIds.map((id) => ({ type: "local" as const, id })),
      ...playlist.audiusTracks.map((t) => ({
        type: "audius" as const,
        id: t.id,
      })),
    ];
    if (saved) {
      try {
        const savedOrder = JSON.parse(saved) as string[];
        const orderedIds = savedOrder
          .map((id) => allIds.find((item) => item.id === id))
          .filter(Boolean) as typeof allIds;
        const remaining = allIds.filter(
          (item) => !savedOrder.includes(item.id),
        );
        setSortOrder([
          ...orderedIds.map((i) => i.id),
          ...remaining.map((i) => i.id),
        ]);
      } catch {
        setSortOrder(allIds.map((i) => i.id));
      }
    } else {
      setSortOrder(allIds.map((i) => i.id));
    }
    setSortPlaylist(playlist);
    setSortDialogOpen(true);
  };

  const moveSortItem = (index: number, direction: "up" | "down") => {
    setSortOrder((prev) => {
      const next = [...prev];
      const swapIdx = direction === "up" ? index - 1 : index + 1;
      if (swapIdx < 0 || swapIdx >= next.length) return prev;
      [next[index], next[swapIdx]] = [next[swapIdx], next[index]];
      return next;
    });
  };

  const saveSortOrder = () => {
    if (!sortPlaylist) return;
    localStorage.setItem(
      `playlist-sort-${sortPlaylist.id}`,
      JSON.stringify(sortOrder),
    );
    toast.success("Track order saved!");
    setSortDialogOpen(false);
  };

  const _getSortedTracks = (playlist: PlaylistView) => {
    const storageKey = `playlist-sort-${playlist.id}`;
    const saved = localStorage.getItem(storageKey);
    const allIds = [
      ...playlist.trackIds.map((id) => ({ type: "local" as const, id })),
      ...playlist.audiusTracks.map((t) => ({
        type: "audius" as const,
        id: t.id,
      })),
    ];
    if (!saved) return allIds;
    try {
      const savedOrder = JSON.parse(saved) as string[];
      const ordered = savedOrder
        .map((id) => allIds.find((item) => item.id === id))
        .filter(Boolean) as typeof allIds;
      const remaining = allIds.filter((item) => !savedOrder.includes(item.id));
      return [...ordered, ...remaining];
    } catch {
      return allIds;
    }
  };

  const getAudioFileById = (id: string): AudioFile | undefined => {
    return audioFiles.find((file) => file.id === id);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const renderPlaylistTrack = (
    trackId: string,
    playlistId: string,
    canEdit: boolean,
  ) => {
    const audioFile = getAudioFileById(trackId);

    if (!audioFile) {
      return (
        <div
          key={trackId}
          className="flex items-center gap-4 p-4 text-muted-foreground"
        >
          <Music className="h-12 w-12 opacity-50" />
          <div className="flex-1">
            <p className="text-sm">Track not found (ID: {trackId})</p>
          </div>
        </div>
      );
    }

    const combined: CombinedAudio = { source: "local", data: audioFile };

    return (
      <div
        key={trackId}
        className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
      >
        <button
          type="button"
          onClick={() => onSelectAudio(combined)}
          className="flex flex-1 items-center gap-4 text-left"
        >
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
            <Music className="h-6 w-6 text-primary-foreground" />
          </div>

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold leading-none">{audioFile.title}</h3>
              <Badge variant="secondary" className="text-xs">
                <Upload className="mr-1 h-3 w-3" />
                Local
              </Badge>
            </div>
            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatDuration(Number(audioFile.duration))}
              </span>
              <span>{formatDate(audioFile.uploadTimestamp)}</span>
            </div>
          </div>
        </button>

        {canEdit && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8"
                  disabled={!isActorReady}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Track</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove "{audioFile.title}" from
                    this playlist?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleRemoveTrack(playlistId, trackId)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    );
  };

  const renderAudiusPlaylistTrack = (
    track: any,
    playlistId: string,
    canEdit: boolean,
  ) => {
    const combined: CombinedAudio = {
      source: "audius",
      data: {
        id: track.id,
        title: track.title,
        user: { name: track.artist },
        duration: 0,
        artwork: track.artworkUrl,
      } as any,
    };

    return (
      <div
        key={track.id}
        className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
      >
        <button
          type="button"
          onClick={() => onSelectAudio(combined)}
          className="flex flex-1 items-center gap-4 text-left"
        >
          {track.artworkUrl ? (
            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg">
              <img
                src={track.artworkUrl}
                alt={track.title}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
              <Radio className="h-6 w-6 text-primary-foreground" />
            </div>
          )}

          <div className="flex-1 space-y-1">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold leading-none">{track.title}</h3>
              <Badge variant="outline" className="text-xs">
                <Radio className="mr-1 h-3 w-3" />
                Audius
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground">{track.artist}</p>
          </div>
        </button>

        {canEdit && (
          <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8"
                  disabled={!isActorReady}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Remove Track</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to remove "{track.title}" from this
                    playlist?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() =>
                      handleRemoveAudiusTrack(playlistId, track.id)
                    }
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Remove
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
    );
  };

  const showActorWarning =
    !isActorReady && !isActorInitializing && isAuthenticated;

  if (isLoadingPlaylists) {
    return (
      <div className="space-y-3 p-6">
        {[...Array(3)].map((_, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: static skeleton list, index is safe
          <Skeleton key={i} className="h-24 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative h-[500px]">
      {onClose && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-2 top-2 z-10 h-8 w-8 rounded-full"
          aria-label="Close playlist manager"
        >
          <X className="h-4 w-4" />
        </Button>
      )}

      {isAuthenticated && (
        <div className="border-b p-4 space-y-3">
          {isActorInitializing && (
            <Alert>
              <Loader2 className="h-4 w-4 animate-spin" />
              <AlertDescription>
                Initializing system... Please wait a moment.
              </AlertDescription>
            </Alert>
          )}

          {showActorWarning && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                System not ready. Please try again in a moment.
              </AlertDescription>
            </Alert>
          )}

          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button className="w-full gap-2" disabled={!isActorReady}>
                {isActorReady ? (
                  <>
                    <Plus className="h-4 w-4" />
                    Create New Playlist
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-4 w-4" />
                    {isActorInitializing ? "Initializing..." : "Not Ready"}
                  </>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Playlist</DialogTitle>
                <DialogDescription>
                  Give your playlist a name to get started.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="playlist-name">Playlist Name</Label>
                  <Input
                    id="playlist-name"
                    placeholder="My Awesome Playlist"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && handleCreatePlaylist()
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreateDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={
                    !newPlaylistName.trim() || createPlaylistMutation.isPending
                  }
                >
                  {createPlaylistMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Create Playlist
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      <ScrollArea className="h-[calc(100%-80px)]">
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center px-6">
            <ListMusic className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Playlists Yet</h3>
            <p className="text-sm text-muted-foreground">
              {isAuthenticated
                ? "Create your first playlist to organize your music"
                : "Sign in to create and manage playlists"}
            </p>
          </div>
        ) : (
          <div className="divide-y">
            {playlists.map((playlist) => {
              const canEdit = isPlaylistOwner(playlist);
              const isExpanded = expandedPlaylists.has(playlist.id);
              const totalTracks =
                playlist.trackIds.length + playlist.audiusTracks.length;

              return (
                <div key={playlist.id} className="group">
                  <div className="flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                    <button
                      type="button"
                      onClick={() => togglePlaylistExpanded(playlist.id)}
                      className="flex flex-1 items-center gap-3 text-left min-w-0"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
                        <ListMusic className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-sm truncate">
                            {playlist.title}
                          </h3>
                          {isExpanded ? (
                            <ChevronUp className="h-3 w-3 text-muted-foreground shrink-0" />
                          ) : (
                            <ChevronDown className="h-3 w-3 text-muted-foreground shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {totalTracks} {totalTracks === 1 ? "track" : "tracks"}
                        </p>
                      </div>
                    </button>

                    <div className="flex items-center gap-1 shrink-0">
                      {canEdit && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedPlaylist(playlist);
                                setIsAddTrackDialogOpen(true);
                              }}
                              disabled={!isActorReady}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Track
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openRenameDialog(playlist)}
                              disabled={!isActorReady}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => openSortDialog(playlist)}
                            >
                              <ArrowUp className="mr-2 h-4 w-4" />
                              Sort Tracks
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSharePlaylist(playlist.id)}
                            >
                              <Share2 className="mr-2 h-4 w-4" />
                              Share Link
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() =>
                                handleGenerateEmbedCode(playlist.id)
                              }
                            >
                              <Code className="mr-2 h-4 w-4" />
                              Embed Code
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => openDeleteDialog(playlist.id)}
                              className="text-destructive focus:text-destructive"
                              disabled={!isActorReady}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete Playlist
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t bg-muted/20">
                      {totalTracks === 0 ? (
                        <div className="flex flex-col items-center justify-center py-8 text-center px-6">
                          <Music className="h-8 w-8 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            No tracks in this playlist
                          </p>
                          {canEdit && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-3"
                              onClick={() => {
                                setSelectedPlaylist(playlist);
                                setIsAddTrackDialogOpen(true);
                              }}
                              disabled={!isActorReady}
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add Track
                            </Button>
                          )}
                        </div>
                      ) : (
                        <div className="divide-y">
                          {playlist.trackIds.map((trackId) =>
                            renderPlaylistTrack(trackId, playlist.id, canEdit),
                          )}
                          {playlist.audiusTracks.map((track) =>
                            renderAudiusPlaylistTrack(
                              track,
                              playlist.id,
                              canEdit,
                            ),
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>

      {/* Add Track Dialog */}
      <Dialog
        open={isAddTrackDialogOpen}
        onOpenChange={setIsAddTrackDialogOpen}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Add Track to Playlist</DialogTitle>
            <DialogDescription>
              Choose a track from your local library or search Audius.
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={addTrackTab}
            onValueChange={(v) => setAddTrackTab(v as "local" | "audius")}
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local">Local Library</TabsTrigger>
              <TabsTrigger value="audius">Audius</TabsTrigger>
            </TabsList>

            <TabsContent value="local" className="space-y-4 mt-4">
              {isLoadingAudioFiles ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : audioFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Music className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No local audio files found
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label>Select Track</Label>
                  <Select
                    value={selectedTrackId}
                    onValueChange={setSelectedTrackId}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a track..." />
                    </SelectTrigger>
                    <SelectContent>
                      {audioFiles.map((file) => (
                        <SelectItem key={file.id} value={file.id}>
                          {file.title} — {file.creator}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddTrackDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleAddLocalTrack}
                  disabled={
                    !selectedTrackId ||
                    addTrackMutation.isPending ||
                    !isActorReady
                  }
                >
                  {addTrackMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Add Track
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="audius" className="space-y-4 mt-4">
              <div className="relative">
                <Input
                  placeholder="Search Audius tracks..."
                  value={audiusSearchQuery}
                  onChange={(e) => setAudiusSearchQuery(e.target.value)}
                />
              </div>

              {isLoadingAudius ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : audiusSearchQuery.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Radio className="h-8 w-8 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Search for Audius tracks above
                  </p>
                </div>
              ) : audiusResults.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    No results found
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[240px]">
                  <div className="space-y-2">
                    {audiusResults.map((track) => {
                      const artworkUrl =
                        typeof track.artwork === "string"
                          ? track.artwork
                          : track.artwork?.["150x150"] ||
                            track.artwork?.["480x480"] ||
                            "";

                      return (
                        <button
                          key={track.id}
                          type="button"
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors text-left"
                          onClick={() => handleAddAudiusTrack(track)}
                        >
                          {artworkUrl ? (
                            <img
                              src={artworkUrl}
                              alt={track.title}
                              className="h-10 w-10 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-gradient-to-br from-primary/20 to-accent/20">
                              <Radio className="h-5 w-5 text-primary" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {track.title}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {track.user.name}
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="shrink-0"
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </button>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Playlist</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-playlist">New Name</Label>
              <Input
                id="rename-playlist"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenamePlaylist()}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRenameDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenamePlaylist}
              disabled={!renameValue.trim() || renamePlaylistMutation.isPending}
            >
              {renamePlaylistMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Rename
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Playlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this playlist? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlaylist}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletePlaylistMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Embed Code Dialog */}
      <Dialog open={embedCodeDialogOpen} onOpenChange={setEmbedCodeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Embed Playlist</DialogTitle>
            <DialogDescription>
              Copy this code to embed the playlist on your website.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Textarea
              value={embedCode}
              readOnly
              className="font-mono text-xs"
              rows={4}
            />
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setEmbedCodeDialogOpen(false)}
            >
              Close
            </Button>
            <Button onClick={copyEmbedCode} className="gap-2">
              <Copy className="h-4 w-4" />
              Copy Code
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Sort Tracks Dialog */}
      <Dialog open={sortDialogOpen} onOpenChange={setSortDialogOpen}>
        <DialogContent className="max-w-md" data-ocid="playlist.sort.dialog">
          <DialogHeader>
            <DialogTitle>Sort Tracks</DialogTitle>
            <DialogDescription>
              Drag or use the arrows to reorder tracks in &quot;
              {sortPlaylist?.title}&quot;.
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-80 overflow-y-auto space-y-1 py-2">
            {sortPlaylist &&
              sortOrder.map((trackId, idx) => {
                const localFile = audioFiles.find((f) => f.id === trackId);
                const audiusTrack = sortPlaylist.audiusTracks.find(
                  (t) => t.id === trackId,
                );
                const title = localFile?.title ?? audiusTrack?.title ?? trackId;
                const isAudius = !!audiusTrack;
                return (
                  <div
                    key={trackId}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <span className="flex-1 text-sm truncate">
                      {isAudius && (
                        <Radio className="inline mr-1 h-3 w-3 opacity-60" />
                      )}
                      {title}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveSortItem(idx, "up")}
                        disabled={idx === 0}
                        data-ocid="playlist.sort.button"
                      >
                        <ArrowUp className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => moveSortItem(idx, "down")}
                        disabled={idx === sortOrder.length - 1}
                        data-ocid="playlist.sort.button"
                      >
                        <ArrowDown className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            {sortPlaylist && sortOrder.length === 0 && (
              <p
                className="text-sm text-muted-foreground text-center py-4"
                data-ocid="playlist.sort.empty_state"
              >
                No tracks to sort.
              </p>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSortDialogOpen(false)}
              data-ocid="playlist.sort.cancel_button"
            >
              Cancel
            </Button>
            <Button
              onClick={saveSortOrder}
              data-ocid="playlist.sort.save_button"
            >
              Save Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

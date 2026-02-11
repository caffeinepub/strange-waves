import { useState } from 'react';
import { ListMusic, Plus, Music, Trash2, Clock, Upload, Code, Copy, AlertCircle, Loader2, X, ChevronDown, ChevronUp, MoreVertical, Edit, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  useCallerPlaylists,
  useCreatePlaylist,
  useAddTrackToPlaylist,
  useAddAudiusTrackToPlaylist,
  useRemoveTrackFromPlaylist,
  useRemoveAudiusTrackFromPlaylist,
  useDeletePlaylist,
  useRenamePlaylist,
  useAudioFiles,
  useSearchAudiusTracks,
  useActionQueueProcessor,
  type CombinedAudio,
} from '../hooks/useQueries';
import { useActorReady } from '../hooks/useActorReady';
import type { PlaylistView, AudioFile } from '../backend';
import { toast } from 'sonner';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface PlaylistManagerProps {
  onSelectAudio: (audio: CombinedAudio) => void;
  onClose?: () => void;
}

export function PlaylistManager({ onSelectAudio, onClose }: PlaylistManagerProps) {
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistView | null>(null);
  const [isAddTrackDialogOpen, setIsAddTrackDialogOpen] = useState(false);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('');
  const [audiusSearchQuery, setAudiusSearchQuery] = useState('');
  const [addTrackTab, setAddTrackTab] = useState<'local' | 'audius'>('local');
  const [embedCodeDialogOpen, setEmbedCodeDialogOpen] = useState(false);
  const [embedCode, setEmbedCode] = useState('');
  const [expandedPlaylists, setExpandedPlaylists] = useState<Set<string>>(new Set());
  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [renamePlaylistId, setRenamePlaylistId] = useState<string>('');
  const [renameValue, setRenameValue] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletePlaylistId, setDeletePlaylistId] = useState<string>('');

  const { isActorReady, isActorInitializing } = useActorReady();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  
  const { data: playlists = [], isLoading: isLoadingPlaylists } = useCallerPlaylists();
  const { data: audioFiles = [], isLoading: isLoadingAudioFiles } = useAudioFiles();
  const { data: audiusResults = [], isLoading: isLoadingAudius } = useSearchAudiusTracks(
    audiusSearchQuery,
    addTrackTab === 'audius' && audiusSearchQuery.length > 0
  );
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
    setExpandedPlaylists(prev => {
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
      toast.error('System is initializing. Please wait a moment and try again.');
      return;
    }

    const id = `playlist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    await createPlaylistMutation.mutateAsync({ id, title: newPlaylistName });
    setNewPlaylistName('');
    setIsCreateDialogOpen(false);
  };

  const handleAddLocalTrack = async () => {
    if (!selectedPlaylist || !selectedTrackId) return;

    if (!isActorReady) {
      toast.error('System is initializing. Please wait a moment and try again.');
      return;
    }

    await addTrackMutation.mutateAsync({
      playlistId: selectedPlaylist.id,
      trackId: selectedTrackId,
    });
    setSelectedTrackId('');
    setIsAddTrackDialogOpen(false);
  };

  const handleAddAudiusTrack = async (audiusTrack: any) => {
    if (!selectedPlaylist) return;

    if (!isActorReady) {
      toast.error('System is initializing. Please wait a moment and try again.');
      return;
    }

    // Convert Audius API track to backend AudiusTrack format
    const artworkUrl = typeof audiusTrack.artwork === 'string' 
      ? audiusTrack.artwork 
      : audiusTrack.artwork?.['150x150'] || audiusTrack.artwork?.['480x480'] || '';

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
    setAudiusSearchQuery('');
  };

  const handleRemoveTrack = async (playlistId: string, trackId: string) => {
    if (!isActorReady) {
      toast.error('System is initializing. Please wait a moment and try again.');
      return;
    }
    await removeTrackMutation.mutateAsync({ playlistId, trackId });
  };

  const handleRemoveAudiusTrack = async (playlistId: string, trackId: string) => {
    if (!isActorReady) {
      toast.error('System is initializing. Please wait a moment and try again.');
      return;
    }
    await removeAudiusTrackMutation.mutateAsync({ playlistId, trackId });
  };

  const handleDeletePlaylist = async () => {
    if (!deletePlaylistId) return;
    
    if (!isActorReady) {
      toast.error('System is initializing. Please wait a moment and try again.');
      return;
    }
    await deletePlaylistMutation.mutateAsync(deletePlaylistId);
    setDeleteDialogOpen(false);
    setDeletePlaylistId('');
  };

  const handleGenerateEmbedCode = (playlistId: string) => {
    const canisterId = window.location.hostname.split('.')[0];
    const code = `<iframe src="https://${canisterId}.ic0.app/playlist/${playlistId}" width="100%" height="400" frameborder="0"></iframe>`;
    setEmbedCode(code);
    setEmbedCodeDialogOpen(true);
  };

  const handleRenamePlaylist = async () => {
    if (!renamePlaylistId || !renameValue.trim()) return;

    if (!isActorReady) {
      toast.error('System is initializing. Please wait a moment and try again.');
      return;
    }

    await renamePlaylistMutation.mutateAsync({
      playlistId: renamePlaylistId,
      newTitle: renameValue,
    });
    setRenameDialogOpen(false);
    setRenamePlaylistId('');
    setRenameValue('');
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
    toast.success('Embed code copied to clipboard');
  };

  const getAudioFileById = (id: string): AudioFile | undefined => {
    return audioFiles.find((file) => file.id === id);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderPlaylistTrack = (trackId: string, playlistId: string, canEdit: boolean) => {
    const audioFile = getAudioFileById(trackId);
    
    if (!audioFile) {
      return (
        <div key={trackId} className="flex items-center gap-4 p-4 text-muted-foreground">
          <Music className="h-12 w-12 opacity-50" />
          <div className="flex-1">
            <p className="text-sm">Track not found (ID: {trackId})</p>
          </div>
        </div>
      );
    }

    const combined: CombinedAudio = { source: 'local', data: audioFile };

    return (
      <div
        key={trackId}
        className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
      >
        <button
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
                    Are you sure you want to remove "{audioFile.title}" from this playlist?
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

  const renderAudiusPlaylistTrack = (track: any, playlistId: string, canEdit: boolean) => {
    const combined: CombinedAudio = { 
      source: 'audius', 
      data: {
        id: track.id,
        title: track.title,
        user: { name: track.artist },
        duration: 0,
        artwork: track.artworkUrl,
      } as any
    };

    return (
      <div
        key={track.id}
        className="group flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
      >
        <button
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
                    Are you sure you want to remove "{track.title}" from this playlist?
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => handleRemoveAudiusTrack(playlistId, track.id)}
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

  const showActorWarning = !isActorReady && !isActorInitializing && isAuthenticated;

  if (isLoadingPlaylists) {
    return (
      <div className="space-y-3 p-6">
        {[...Array(3)].map((_, i) => (
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

          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
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
                    {isActorInitializing ? 'Initializing...' : 'Not Ready'}
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
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleCreatePlaylist();
                      }
                    }}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleCreatePlaylist}
                  disabled={!newPlaylistName.trim() || createPlaylistMutation.isPending || !isActorReady}
                >
                  {createPlaylistMutation.isPending ? 'Creating...' : 'Create Playlist'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      )}

      {/* Embed Code Dialog */}
      <Dialog open={embedCodeDialogOpen} onOpenChange={setEmbedCodeDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Playlist Embed Code</DialogTitle>
            <DialogDescription>
              Copy this code to embed the playlist on your website or app.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Embed Code</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={copyEmbedCode}
                  className="gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copy
                </Button>
              </div>
              <Textarea
                value={embedCode}
                readOnly
                className="font-mono text-sm"
                rows={8}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setEmbedCodeDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rename Dialog */}
      <Dialog open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Playlist</DialogTitle>
            <DialogDescription>
              Enter a new name for your playlist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="rename-input">Playlist Name</Label>
              <Input
                id="rename-input"
                placeholder="Enter new name"
                value={renameValue}
                onChange={(e) => setRenameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleRenamePlaylist();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setRenameDialogOpen(false);
                setRenamePlaylistId('');
                setRenameValue('');
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleRenamePlaylist}
              disabled={!renameValue.trim() || renamePlaylistMutation.isPending || !isActorReady}
            >
              {renamePlaylistMutation.isPending ? 'Renaming...' : 'Rename'}
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
              Are you sure you want to delete this playlist? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setDeletePlaylistId('');
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeletePlaylist}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Playlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Track Dialog with Tabs */}
      <Dialog open={isAddTrackDialogOpen} onOpenChange={(open) => {
        setIsAddTrackDialogOpen(open);
        if (!open) {
          setSelectedPlaylist(null);
          setSelectedTrackId('');
          setAudiusSearchQuery('');
          setAddTrackTab('local');
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Track to Playlist</DialogTitle>
            <DialogDescription>
              Select a track from your library or search Audius to add to "{selectedPlaylist?.title}".
            </DialogDescription>
          </DialogHeader>
          <Tabs value={addTrackTab} onValueChange={(v) => setAddTrackTab(v as 'local' | 'audius')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="local">Local Files</TabsTrigger>
              <TabsTrigger value="audius">Audius</TabsTrigger>
            </TabsList>
            <TabsContent value="local" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="track-select">Select Track</Label>
                <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
                  <SelectTrigger id="track-select">
                    <SelectValue placeholder="Choose a track" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoadingAudioFiles ? (
                      <div className="p-2 text-sm text-muted-foreground">Loading tracks...</div>
                    ) : audioFiles.length === 0 ? (
                      <div className="p-2 text-sm text-muted-foreground">No tracks available</div>
                    ) : (
                      audioFiles
                        .filter((file) => !selectedPlaylist?.trackIds.includes(file.id))
                        .map((file) => (
                          <SelectItem key={file.id} value={file.id}>
                            {file.title}
                          </SelectItem>
                        ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button
                  onClick={handleAddLocalTrack}
                  disabled={!selectedTrackId || addTrackMutation.isPending || !isActorReady}
                >
                  {addTrackMutation.isPending ? 'Adding...' : 'Add Track'}
                </Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="audius" className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="audius-search">Search Audius</Label>
                <Input
                  id="audius-search"
                  placeholder="Search for tracks..."
                  value={audiusSearchQuery}
                  onChange={(e) => setAudiusSearchQuery(e.target.value)}
                />
              </div>
              <ScrollArea className="h-[300px]">
                {isLoadingAudius ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : audiusSearchQuery.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Radio className="h-12 w-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Search for tracks on Audius</p>
                  </div>
                ) : audiusResults.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p className="text-sm">No results found</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {audiusResults.map((track) => {
                      const artworkUrl = typeof track.artwork === 'string' 
                        ? track.artwork 
                        : track.artwork?.['150x150'] || '';
                      
                      return (
                        <div
                          key={track.id}
                          className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
                          onClick={() => handleAddAudiusTrack(track)}
                        >
                          {artworkUrl ? (
                            <img src={artworkUrl} alt={track.title} className="h-12 w-12 rounded" />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded bg-gradient-to-br from-primary to-accent">
                              <Radio className="h-6 w-6 text-primary-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm line-clamp-1">{track.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1">{track.user.name}</p>
                          </div>
                          <Plus className="h-5 w-5 text-muted-foreground" />
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Playlists List */}
      <ScrollArea className={isAuthenticated ? "h-[calc(100%-73px)]" : "h-full"}>
        {playlists.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <ListMusic className="h-16 w-16 text-muted-foreground/50" />
            <p className="mt-4 text-lg font-medium text-muted-foreground">
              No playlists yet
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {isAuthenticated 
                ? 'Create your first playlist to organize your tracks'
                : 'Playlists will appear here once created'}
            </p>
          </div>
        ) : (
          <div className="space-y-4 p-4">
            {playlists.map((playlist) => {
              const isExpanded = expandedPlaylists.has(playlist.id);
              const canEdit = isPlaylistOwner(playlist);
              const totalTracks = playlist.trackIds.length + playlist.audiusTracks.length;
              
              return (
                <div
                  key={playlist.id}
                  className="rounded-lg border bg-card text-card-foreground shadow-sm"
                >
                  <div className="flex items-center justify-between border-b p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                        <ListMusic className="h-5 w-5 text-primary-foreground" />
                      </div>
                      <div>
                        <h3 className="font-semibold">{playlist.title}</h3>
                        <p className="text-xs text-muted-foreground">
                          {totalTracks} track{totalTracks !== 1 ? 's' : ''} • Created {formatDate(playlist.creationTimestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-2"
                          onClick={() => {
                            setSelectedPlaylist(playlist);
                            setIsAddTrackDialogOpen(true);
                          }}
                          disabled={!isActorReady}
                        >
                          <Plus className="h-4 w-4" />
                          Add Track
                        </Button>
                      )}

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                          <DropdownMenuItem
                            onClick={() => handleGenerateEmbedCode(playlist.id)}
                          >
                            <Code className="mr-2 h-4 w-4" />
                            Embed Code
                          </DropdownMenuItem>

                          {canEdit && (
                            <>
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                onClick={() => openRenameDialog(playlist)}
                                disabled={!isActorReady}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Rename
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(playlist.id)}
                                disabled={!isActorReady}
                                className="text-destructive focus:text-destructive"
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                  
                  {totalTracks > 0 && (
                    <div className="border-b">
                      <Button
                        variant="ghost"
                        className="w-full justify-between rounded-none py-3 hover:bg-muted/50"
                        onClick={() => togglePlaylistExpanded(playlist.id)}
                      >
                        <span className="text-sm font-medium">
                          {isExpanded ? 'Hide' : 'Show'} Track List
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  )}

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${
                      isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    {totalTracks > 0 ? (
                      <div className="divide-y divide-border">
                        {playlist.trackIds.map((trackId) => 
                          renderPlaylistTrack(trackId, playlist.id, canEdit)
                        )}
                        {playlist.audiusTracks.map((track) => 
                          renderAudiusPlaylistTrack(track, playlist.id, canEdit)
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center py-8 text-center">
                        <Music className="h-12 w-12 text-muted-foreground/50" />
                        <p className="mt-2 text-sm text-muted-foreground">
                          No tracks in this playlist yet
                        </p>
                      </div>
                    )}
                  </div>

                  {totalTracks === 0 && (
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <Music className="h-12 w-12 text-muted-foreground/50" />
                      <p className="mt-2 text-sm text-muted-foreground">
                        No tracks in this playlist yet
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}

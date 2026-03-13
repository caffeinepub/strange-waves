import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  GripVertical,
  Loader2,
  Music,
  Search,
  Sparkles,
  Trash2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { AudioFile, Genre } from "../backend";
import type { FileType } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  type CombinedAudio,
  useAudioFiles,
  useDeleteAudioFile,
  useIsCallerAdmin,
  useMintNFTWithParams,
  useSearchAudiusTracks,
} from "../hooks/useQueries";
import { MintSuccessBanner } from "./NFTMarketplaceActions";
import { NFTMintDialog } from "./NFTMintDialog";
import { PlaylistManager } from "./PlaylistManager";

const TRACK_ORDER_KEY = "sw_track_order";

function formatGenre(genre: Genre | undefined): string {
  if (!genre) return "Other";
  switch (genre.__kind__) {
    case "pop":
      return "Pop";
    case "rock":
      return "Rock";
    case "jazz":
      return "Jazz";
    case "hipHop":
      return "Hip-Hop";
    case "electronic":
      return "Electronic";
    case "classical":
      return "Classical";
    case "other":
      return (genre as { __kind__: "other"; other: string }).other || "Other";
    default:
      return "Other";
  }
}

interface AudioLibraryProps {
  onSelectAudio: (audio: CombinedAudio) => void;
  selectedAudioId?: string;
}

export function AudioLibrary({
  onSelectAudio,
  selectedAudioId,
}: AudioLibraryProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("playlists");
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { data: localFiles = [], isLoading: isLoadingLocal } = useAudioFiles();
  const { data: isAdmin = false } = useIsCallerAdmin();
  const deleteMutation = useDeleteAudioFile();

  // Drag-to-sort state
  const [localOrder, setLocalOrder] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(TRACK_ORDER_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });
  const dragItemRef = useRef<string | null>(null);
  const dragOverItemRef = useRef<string | null>(null);

  // Sync localOrder when files load
  useEffect(() => {
    if (localFiles.length === 0) return;
    setLocalOrder((prev) => {
      const existingIds = new Set(localFiles.map((f) => f.id));
      // Filter out removed files
      const filtered = prev.filter((id) => existingIds.has(id));
      // Add new files to the end
      const inOrder = new Set(filtered);
      const newIds = localFiles
        .map((f) => f.id)
        .filter((id) => !inOrder.has(id));
      const merged = [...filtered, ...newIds];
      localStorage.setItem(TRACK_ORDER_KEY, JSON.stringify(merged));
      return merged;
    });
  }, [localFiles]);

  const sortedLocalFiles = [...localFiles].sort((a, b) => {
    const ai = localOrder.indexOf(a.id);
    const bi = localOrder.indexOf(b.id);
    if (ai === -1 && bi === -1) return 0;
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });

  const handleDragStart = (id: string) => {
    dragItemRef.current = id;
  };

  const handleDragOver = (e: React.DragEvent, id: string) => {
    e.preventDefault();
    dragOverItemRef.current = id;
  };

  const handleDrop = () => {
    const from = dragItemRef.current;
    const to = dragOverItemRef.current;
    if (!from || !to || from === to) return;
    setLocalOrder((prev) => {
      const order = prev.length > 0 ? [...prev] : localFiles.map((f) => f.id);
      const fromIdx = order.indexOf(from);
      const toIdx = order.indexOf(to);
      if (fromIdx === -1 || toIdx === -1) return prev;
      const updated = [...order];
      updated.splice(fromIdx, 1);
      updated.splice(toIdx, 0, from);
      localStorage.setItem(TRACK_ORDER_KEY, JSON.stringify(updated));
      return updated;
    });
    dragItemRef.current = null;
    dragOverItemRef.current = null;
  };

  // Delete confirmation state
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const handleConfirmDelete = async () => {
    if (!deleteTargetId) return;
    await deleteMutation.mutateAsync(deleteTargetId);
    setDeleteTargetId(null);
  };

  // Only pass the query when on the audius tab and there's a search term; otherwise pass empty string
  const audiusQuery = activeTab === "audius" ? searchQuery : "";
  const { data: audiusResults = [], isLoading: isLoadingAudius } =
    useSearchAudiusTracks(audiusQuery);

  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [selectedFileForMint, setSelectedFileForMint] =
    useState<AudioFile | null>(null);
  const mintMutation = useMintNFTWithParams();
  const [mintSuccessTokenId, setMintSuccessTokenId] = useState<bigint | null>(
    null,
  );

  const handleMintClick = (file: AudioFile) => {
    setSelectedFileForMint(file);
    setMintDialogOpen(true);
  };

  const handleMint = async (data: {
    title: string;
    description: string;
    artist: string;
    fileType: FileType;
    price: number;
    stableCoin: any;
    royaltyPercentage: number;
    revenueSplits: any[];
    editionCount?: number;
  }) => {
    if (!selectedFileForMint) return;

    const tokenId = await mintMutation.mutateAsync({
      audioFile: selectedFileForMint,
      ...data,
    });

    if (tokenId !== undefined) setMintSuccessTokenId(tokenId);
    setMintDialogOpen(false);
    setSelectedFileForMint(null);
  };

  const renderLocalFiles = () => {
    if (isLoadingLocal) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (localFiles.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center py-12 text-center"
          data-ocid="tracks.empty_state"
        >
          <Music className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Audio Files</h3>
          <p className="text-sm text-muted-foreground">
            Upload your first audio file to get started
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedLocalFiles.map((file, idx) => (
          <Card
            key={file.id}
            draggable={isAdmin}
            onDragStart={() => handleDragStart(file.id)}
            onDragOver={(e) => handleDragOver(e, file.id)}
            onDrop={handleDrop}
            data-ocid={`tracks.item.${idx + 1}`}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedAudioId === file.id ? "ring-2 ring-primary" : ""
            } ${isAdmin ? "relative" : ""}`}
            onClick={() => onSelectAudio({ source: "local", data: file })}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Drag handle — admin only */}
                {isAdmin && (
                  <div
                    className="flex shrink-0 cursor-grab items-center self-center text-muted-foreground active:cursor-grabbing"
                    onKeyDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                    data-ocid={`tracks.drag_handle.${idx + 1}`}
                  >
                    <GripVertical className="h-4 w-4" />
                  </div>
                )}

                {file.coverImage ? (
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                    <img
                      src={file.coverImage.getDirectURL()}
                      alt={file.title}
                      className="h-full w-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                    <Music className="h-6 w-6 text-primary-foreground" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-1">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {file.title}
                    </h3>
                    <div className="flex shrink-0 items-center gap-1">
                      {isAuthenticated && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0"
                          data-ocid={`tracks.open_modal_button.${idx + 1}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMintClick(file);
                          }}
                        >
                          <Sparkles className="h-4 w-4 text-primary" />
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                          data-ocid={`tracks.delete_button.${idx + 1}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteTargetId(file.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground line-clamp-1">
                    {file.creator}
                  </p>

                  <div className="flex flex-wrap items-center gap-1 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {Math.floor(Number(file.duration) / 60)}:
                      {(Number(file.duration) % 60).toString().padStart(2, "0")}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Local
                    </Badge>
                    {file.genre && (
                      <Badge
                        variant="outline"
                        className="text-xs border-primary/40 text-primary"
                      >
                        {formatGenre(file.genre)}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderAudiusResults = () => {
    if (isLoadingAudius) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      );
    }

    if (searchQuery.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Search Audius</h3>
          <p className="text-sm text-muted-foreground">
            Enter a search term to discover tracks from Audius
          </p>
        </div>
      );
    }

    if (audiusResults.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Search className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No Results</h3>
          <p className="text-sm text-muted-foreground">
            Try a different search term
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {audiusResults.map((track) => {
          const artworkUrl =
            typeof track.artwork === "string"
              ? track.artwork
              : track.artwork?.["150x150"] ||
                track.artwork?.["480x480"] ||
                track.artwork?.["1000x1000"] ||
                "";

          return (
            <Card
              key={track.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedAudioId === track.id ? "ring-2 ring-primary" : ""
              }`}
              onClick={() => onSelectAudio({ source: "audius", data: track })}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  {artworkUrl ? (
                    <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={artworkUrl}
                        alt={track.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                      <Music className="h-6 w-6 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm line-clamp-1">
                      {track.title}
                    </h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">
                      {track.user.name}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {Math.floor(track.duration / 60)}:
                        {(track.duration % 60).toString().padStart(2, "0")}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Audius
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <Card className="w-full">
        <CardContent className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="playlists" data-ocid="library.playlists.tab">
                Playlists
              </TabsTrigger>
              <TabsTrigger value="local" data-ocid="library.local.tab">
                All Files
              </TabsTrigger>
              <TabsTrigger value="audius" data-ocid="library.audius.tab">
                Audius
              </TabsTrigger>
            </TabsList>

            <TabsContent value="playlists" className="space-y-4">
              <PlaylistManager onSelectAudio={onSelectAudio} />
            </TabsContent>

            <TabsContent value="local" className="space-y-4">
              <ScrollArea className="h-[500px]">
                {renderLocalFiles()}
              </ScrollArea>
            </TabsContent>

            <TabsContent value="audius" className="space-y-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search Audius tracks..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-ocid="audius.search_input"
                />
              </div>
              <ScrollArea className="h-[450px]">
                {renderAudiusResults()}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        open={!!deleteTargetId}
        onOpenChange={(open) => {
          if (!open) setDeleteTargetId(null);
        }}
      >
        <AlertDialogContent data-ocid="tracks.delete.dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Track</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this track? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="tracks.delete.cancel_button">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              data-ocid="tracks.delete.confirm_button"
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleConfirmDelete}
            >
              {deleteMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {mintSuccessTokenId !== null && (
        <MintSuccessBanner
          tokenId={mintSuccessTokenId}
          onDismiss={() => setMintSuccessTokenId(null)}
        />
      )}

      {selectedFileForMint && (
        <NFTMintDialog
          open={mintDialogOpen}
          onOpenChange={setMintDialogOpen}
          audioFile={selectedFileForMint}
          onMint={handleMint}
          isLoading={mintMutation.isPending}
        />
      )}
    </>
  );
}

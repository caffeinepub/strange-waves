import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Search, Music, Sparkles, Loader2 } from 'lucide-react';
import { useAudioFiles, useSearchAudiusTracks, useMintNFTWithParams, type CombinedAudio } from '../hooks/useQueries';
import type { AudioFile } from '../backend';
import { FileType } from '../backend';
import { PlaylistManager } from './PlaylistManager';
import { NFTMintDialog } from './NFTMintDialog';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

interface AudioLibraryProps {
  onSelectAudio: (audio: CombinedAudio) => void;
  selectedAudioId?: string;
}

export function AudioLibrary({ onSelectAudio, selectedAudioId }: AudioLibraryProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('playlists');
  const { identity } = useInternetIdentity();
  
  const { data: localFiles = [], isLoading: isLoadingLocal } = useAudioFiles();
  const { data: audiusResults = [], isLoading: isLoadingAudius } = useSearchAudiusTracks(
    searchQuery,
    activeTab === 'audius' && searchQuery.length > 0
  );

  const [mintDialogOpen, setMintDialogOpen] = useState(false);
  const [selectedFileForMint, setSelectedFileForMint] = useState<AudioFile | null>(null);
  const mintMutation = useMintNFTWithParams();

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
  }) => {
    if (!selectedFileForMint) return;

    await mintMutation.mutateAsync({
      audioFile: selectedFileForMint,
      ...data,
    });

    setMintDialogOpen(false);
    setSelectedFileForMint(null);
  };

  const isOwner = (file: AudioFile) => {
    if (!identity || !file.owner) return false;
    return file.owner.toString() === identity.getPrincipal().toString();
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
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
        {localFiles.map((file) => (
          <Card
            key={file.id}
            className={`cursor-pointer transition-all hover:shadow-lg ${
              selectedAudioId === file.id ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => onSelectAudio({ source: 'local', data: file })}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
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
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-sm line-clamp-1">{file.title}</h3>
                    {identity && isOwner(file) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-8 w-8 p-0 shrink-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleMintClick(file);
                        }}
                      >
                        <Sparkles className="h-4 w-4 text-primary" />
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-1">{file.creator}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary" className="text-xs">
                      {Math.floor(Number(file.duration) / 60)}:{(Number(file.duration) % 60).toString().padStart(2, '0')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">Local</Badge>
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
          // Handle artwork which can be an object with different sizes
          const artworkUrl = typeof track.artwork === 'string' 
            ? track.artwork 
            : track.artwork?.['150x150'] || track.artwork?.['480x480'] || track.artwork?.['1000x1000'] || '';

          return (
            <Card
              key={track.id}
              className={`cursor-pointer transition-all hover:shadow-lg ${
                selectedAudioId === track.id ? 'ring-2 ring-primary' : ''
              }`}
              onClick={() => onSelectAudio({ source: 'audius', data: track })}
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
                    <h3 className="font-semibold text-sm line-clamp-1">{track.title}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1">{track.user.name}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary" className="text-xs">
                        {Math.floor(track.duration / 60)}:{(track.duration % 60).toString().padStart(2, '0')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">Audius</Badge>
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
              <TabsTrigger value="playlists">Playlists</TabsTrigger>
              <TabsTrigger value="local">All Files</TabsTrigger>
              <TabsTrigger value="audius">Audius</TabsTrigger>
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
                />
              </div>
              <ScrollArea className="h-[450px]">
                {renderAudiusResults()}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

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

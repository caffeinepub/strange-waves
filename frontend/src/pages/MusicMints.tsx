import { useState } from 'react';
import { useAllNFTRecordsWithParams } from '../hooks/useQueries';
import { FileType, type NFTRecordWithParams, StableCoin } from '../backend';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Music, Image as ImageIcon, Package, Play, Pause, Calendar, User, DollarSign, TrendingUp, Users, ChevronDown, ChevronUp, X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { WalletDisplay } from '../components/WalletDisplay';
import { useInternetIdentity } from '../hooks/useInternetIdentity';

export function MusicMints() {
  const [selectedNFT, setSelectedNFT] = useState<{ record: NFTRecordWithParams; index: number } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isEditExpanded, setIsEditExpanded] = useState(false);

  const { data: nftRecords, isLoading } = useAllNFTRecordsWithParams();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  // Filter NFTs by type
  const audioOnlyNFTs = nftRecords?.filter((record) => record.metadata.fileType === FileType.audio) || [];
  const albumArtOnlyNFTs = nftRecords?.filter((record) => record.metadata.fileType === FileType.image) || [];
  const combinedNFTs = nftRecords?.filter((record) => record.metadata.fileType === FileType.combined) || [];

  const handlePlayPause = async (nftRecord: NFTRecordWithParams) => {
    if (!nftRecord.audioBlob) return;

    if (audioElement && isPlaying) {
      audioElement.pause();
      setIsPlaying(false);
      setAudioElement(null);
    } else {
      const audio = new Audio(nftRecord.audioBlob.getDirectURL());
      audio.play();
      setIsPlaying(true);
      setAudioElement(audio);
      
      audio.onended = () => {
        setIsPlaying(false);
        setAudioElement(null);
      };
    }
  };

  const handleCloseDialog = () => {
    if (audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      setAudioElement(null);
    }
    setSelectedNFT(null);
  };

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1000000);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  const formatPrice = (price: bigint, stableCoin: StableCoin) => {
    const priceNum = Number(price) / 100;
    const coinSymbol = getStableCoinSymbol(stableCoin);
    return `${priceNum.toFixed(2)} ${coinSymbol}`;
  };

  const getStableCoinSymbol = (coin: StableCoin) => {
    const symbols: Record<StableCoin, string> = {
      usdc: 'USDC',
      tusd: 'TUSD',
      rlusd: 'RLUSD',
      usde: 'USDE',
      usdp: 'USDP',
    };
    return symbols[coin] || 'USD';
  };

  const NFTCard = ({ record, index }: { record: NFTRecordWithParams; index: number }) => {
    const getIcon = () => {
      switch (record.metadata.fileType) {
        case FileType.audio:
          return <Music className="h-6 w-6" />;
        case FileType.image:
          return <ImageIcon className="h-6 w-6" />;
        case FileType.combined:
          return <Package className="h-6 w-6" />;
      }
    };

    const getTypeLabel = () => {
      switch (record.metadata.fileType) {
        case FileType.audio:
          return 'Audio Only';
        case FileType.image:
          return 'Album Art Only';
        case FileType.combined:
          return 'Combined Package';
      }
    };

    return (
      <Card 
        className="group cursor-pointer transition-all hover:shadow-lg hover:scale-[1.02]"
        onClick={() => setSelectedNFT({ record, index })}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-primary/10 p-2 text-primary">
                {getIcon()}
              </div>
              <Badge variant="secondary">{getTypeLabel()}</Badge>
            </div>
            <Badge variant="outline" className="flex items-center gap-1">
              <DollarSign className="h-3 w-3" />
              {formatPrice(record.params.price, record.params.stableCoin)}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {record.imageBlob && (
            <div className="mb-4 overflow-hidden rounded-lg">
              <img
                src={record.imageBlob.getDirectURL()}
                alt={record.metadata.title}
                className="h-48 w-full object-cover transition-transform group-hover:scale-105"
              />
            </div>
          )}
          {!record.imageBlob && record.audioBlob && (
            <div className="mb-4 flex h-48 items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-accent/20">
              <Music className="h-16 w-16 text-primary" />
            </div>
          )}
          <div className="space-y-2">
            <h3 className="font-semibold text-lg line-clamp-1">{record.metadata.title}</h3>
            <p className="text-sm text-muted-foreground line-clamp-1">
              <User className="inline h-3 w-3 mr-1" />
              {record.metadata.artist}
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {record.metadata.description}
            </p>
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                {formatDate(record.metadata.mintTimestamp)}
              </div>
              <Badge variant="outline" className="text-xs">
                <TrendingUp className="h-3 w-3 mr-1" />
                {Number(record.params.royaltyPercentage)}%
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const NFTGrid = ({ nfts }: { nfts: NFTRecordWithParams[] }) => {
    if (nfts.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <div className="rounded-full bg-muted p-6 mb-4">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No NFTs Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            No NFTs have been minted in this category yet. Start creating your collection!
          </p>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nfts.map((record, index) => (
          <NFTCard key={index} record={record} index={index} />
        ))}
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-48 w-full mb-4" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Music Mints</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore the NFT collection minted on Strange Waves. Each NFT is fully compatible with ICP wallets and ready for on-chain ownership and transfer.
        </p>
      </div>

      {/* NFT Categories */}
      <Tabs defaultValue="all" className="w-full mb-12">
        <TabsList className="grid w-full grid-cols-4 mb-8">
          <TabsTrigger value="all">
            All NFTs ({nftRecords?.length || 0})
          </TabsTrigger>
          <TabsTrigger value="audio">
            <Music className="h-4 w-4 mr-2" />
            Audio Only ({audioOnlyNFTs.length})
          </TabsTrigger>
          <TabsTrigger value="image">
            <ImageIcon className="h-4 w-4 mr-2" />
            Album Art ({albumArtOnlyNFTs.length})
          </TabsTrigger>
          <TabsTrigger value="combined">
            <Package className="h-4 w-4 mr-2" />
            Combined ({combinedNFTs.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          {isLoading ? <LoadingSkeleton /> : <NFTGrid nfts={nftRecords || []} />}
        </TabsContent>

        <TabsContent value="audio">
          {isLoading ? <LoadingSkeleton /> : <NFTGrid nfts={audioOnlyNFTs} />}
        </TabsContent>

        <TabsContent value="image">
          {isLoading ? <LoadingSkeleton /> : <NFTGrid nfts={albumArtOnlyNFTs} />}
        </TabsContent>

        <TabsContent value="combined">
          {isLoading ? <LoadingSkeleton /> : <NFTGrid nfts={combinedNFTs} />}
        </TabsContent>
      </Tabs>

      {/* Edit/Wallet Section - Collapsible at bottom */}
      {isAuthenticated && (
        <section className="mb-12">
          <div className="space-y-4">
            {/* Collapsible Toggle Button */}
            <Button
              onClick={() => setIsEditExpanded(!isEditExpanded)}
              variant="outline"
              className="w-full flex items-center justify-between py-6 text-lg font-semibold"
            >
              <span>Wallet & Asset Management</span>
              {isEditExpanded ? (
                <ChevronUp className="h-5 w-5" />
              ) : (
                <ChevronDown className="h-5 w-5" />
              )}
            </Button>

            {/* Collapsible Content with Animation */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isEditExpanded
                  ? 'max-h-[3000px] opacity-100'
                  : 'max-h-0 opacity-0'
              }`}
            >
              <div className="relative">
                {/* Close Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 z-10"
                  onClick={() => setIsEditExpanded(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
                <WalletDisplay />
              </div>
            </div>
          </div>
        </section>
      )}

      {/* NFT Detail Dialog */}
      {selectedNFT && (
        <Dialog open={!!selectedNFT} onOpenChange={handleCloseDialog}>
          <DialogContent className="max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {selectedNFT.record.metadata.fileType === FileType.audio && <Music className="h-5 w-5" />}
                {selectedNFT.record.metadata.fileType === FileType.image && <ImageIcon className="h-5 w-5" />}
                {selectedNFT.record.metadata.fileType === FileType.combined && <Package className="h-5 w-5" />}
                {selectedNFT.record.metadata.title}
              </DialogTitle>
              <DialogDescription>
                NFT #{selectedNFT.index} • {formatPrice(selectedNFT.record.params.price, selectedNFT.record.params.stableCoin)}
              </DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 pr-4">
                {/* Image Display */}
                {selectedNFT.record.imageBlob && (
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={selectedNFT.record.imageBlob.getDirectURL()}
                      alt={selectedNFT.record.metadata.title}
                      className="w-full h-auto max-h-96 object-contain bg-muted"
                    />
                  </div>
                )}

                {/* Audio Player */}
                {selectedNFT.record.audioBlob && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">Audio Playback</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-4">
                        <Button
                          size="lg"
                          variant="default"
                          onClick={() => handlePlayPause(selectedNFT.record)}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="h-5 w-5 mr-2" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="h-5 w-5 mr-2" />
                              Play
                            </>
                          )}
                        </Button>
                        <div className="flex-1">
                          <p className="text-sm text-muted-foreground">
                            Click to {isPlaying ? 'pause' : 'play'} the audio track
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Metadata */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">NFT Metadata</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label className="text-sm font-semibold">Artist</Label>
                      <p className="text-sm text-muted-foreground">{selectedNFT.record.metadata.artist}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Description</Label>
                      <p className="text-sm text-muted-foreground">{selectedNFT.record.metadata.description}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Type</Label>
                      <div className="mt-1">
                        <Badge>
                          {selectedNFT.record.metadata.fileType === FileType.audio && 'Audio Only'}
                          {selectedNFT.record.metadata.fileType === FileType.image && 'Album Art Only'}
                          {selectedNFT.record.metadata.fileType === FileType.combined && 'Combined Package'}
                        </Badge>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Minted On</Label>
                      <p className="text-sm text-muted-foreground">
                        {formatDate(selectedNFT.record.metadata.mintTimestamp)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Owner</Label>
                      <p className="text-xs text-muted-foreground font-mono break-all">
                        {selectedNFT.record.metadata.owner.toString()}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Separator />

                {/* Pricing & Royalty Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing & Royalties
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-sm font-semibold">Price</Label>
                        <p className="text-lg font-bold text-primary">
                          {formatPrice(selectedNFT.record.params.price, selectedNFT.record.params.stableCoin)}
                        </p>
                      </div>
                      <div>
                        <Label className="text-sm font-semibold">Royalty</Label>
                        <p className="text-lg font-bold text-primary">
                          {Number(selectedNFT.record.params.royaltyPercentage)}%
                        </p>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-semibold">Payment Method</Label>
                      <p className="text-sm text-muted-foreground">
                        ICRC-1 / ck{getStableCoinSymbol(selectedNFT.record.params.stableCoin)}
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Revenue Splits */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-5 w-5" />
                      Revenue Splits
                    </CardTitle>
                    <CardDescription>
                      {selectedNFT.record.params.revenueSplits.length} recipient(s)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {selectedNFT.record.params.revenueSplits.map((split, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-mono text-muted-foreground truncate">
                              {split.address.toString()}
                            </p>
                          </div>
                          <Badge variant="secondary" className="ml-3">
                            {Number(split.percentage)}%
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Chain Fusion Info */}
                <Card className="border-primary/50 bg-primary/5">
                  <CardHeader>
                    <CardTitle className="text-base">Chain Fusion Ready</CardTitle>
                    <CardDescription>
                      This NFT is architected for future interoperability
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Built with ICP DIP-721 standard and Chain Fusion architecture, this NFT is ready 
                      for future chain-key interoperability with external blockchains including Ethereum, 
                      Solana, and more. Fully compatible with ICP wallets for on-chain ownership and transfer.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function Label({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className}>{children}</div>;
}

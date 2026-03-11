import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Principal } from "@icp-sdk/core/principal";
import {
  AlertCircle,
  Calendar,
  ChevronDown,
  ChevronUp,
  DollarSign,
  Image as ImageIcon,
  Loader2,
  Music,
  Package,
  Pause,
  Play,
  ShoppingBag,
  Store,
  Tag,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useState } from "react";
import {
  FileType,
  type NFTRecordWithParams,
  type StableCoin,
} from "../backend";

// NFTListing - mirrors backend type for new DIP-721 marketplace
interface NFTListing {
  tokenId: bigint;
  seller: Principal;
  priceE8s: bigint;
  listedAt: bigint;
  title: string;
  description: string;
  fileType: { audio: null } | { image: null } | { combined: null };
}
import {
  DelistButton,
  ListForSaleDialog,
  ListingBadge,
} from "../components/NFTMarketplaceActions";
import { WalletDisplay } from "../components/WalletDisplay";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useAllNFTRecordsWithParams,
  useBuyNFT,
  useCallerNFTRecordsWithParams,
  useGetListings,
} from "../hooks/useQueries";

export function MusicMints() {
  const [selectedNFT, setSelectedNFT] = useState<{
    record: NFTRecordWithParams;
    index: number;
  } | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(
    null,
  );
  const [isEditExpanded, setIsEditExpanded] = useState(false);
  const [listForSaleState, setListForSaleState] = useState<{
    tokenId: bigint;
    title: string;
  } | null>(null);

  const [confirmPurchase, setConfirmPurchase] = useState<{
    tokenId: bigint;
    title: string;
    priceE8s: bigint;
  } | null>(null);

  const { data: nftRecords, isLoading } = useAllNFTRecordsWithParams();
  const { data: myNFTs = [], isLoading: isLoadingMyNFTs } =
    useCallerNFTRecordsWithParams();
  const { data: listings = [], isLoading: isLoadingListings } =
    useGetListings();
  const buyMutation = useBuyNFT();
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();
  const myPrincipal = identity?.getPrincipal().toString();

  // Filter NFTs by type
  const audioOnlyNFTs =
    nftRecords?.filter((r) => r.metadata.fileType === FileType.audio) || [];
  const albumArtOnlyNFTs =
    nftRecords?.filter((r) => r.metadata.fileType === FileType.image) || [];
  const combinedNFTs =
    nftRecords?.filter((r) => r.metadata.fileType === FileType.combined) || [];

  // Build a set of listed tokenIds for quick lookup
  const listedTokenIds = new Set(listings.map((l) => l.tokenId.toString()));

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
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatPrice = (price: bigint, stableCoin: StableCoin) => {
    const priceNum = Number(price) / 100;
    const symbols: Record<string, string> = {
      usdc: "USDC",
      tusd: "TUSD",
      rlusd: "RLUSD",
      usde: "USDE",
      usdp: "USDP",
    };
    return `${priceNum.toFixed(2)} ${symbols[stableCoin] || "USD"}`;
  };

  const getFileTypeLabel = (fileType: FileType) => {
    if (fileType === FileType.audio) return "Audio";
    if (fileType === FileType.image) return "Album Art";
    return "Combined";
  };

  const getFileTypeIcon = (fileType: FileType) => {
    if (fileType === FileType.audio) return <Music className="h-3.5 w-3.5" />;
    if (fileType === FileType.image)
      return <ImageIcon className="h-3.5 w-3.5" />;
    return <Package className="h-3.5 w-3.5" />;
  };

  // ===== NFT CARD =====
  const NFTCard = ({
    record,
    index,
  }: { record: NFTRecordWithParams; index: number }) => {
    const tokenId = BigInt(index);
    const isListed = listedTokenIds.has(tokenId.toString());

    return (
      <Card
        key={index}
        data-ocid={`nft.item.${index + 1}`}
        className="overflow-hidden hover:shadow-lg transition-all cursor-pointer group border-border/60"
        onClick={() => setSelectedNFT({ record, index })}
      >
        {record.imageBlob ? (
          <div className="relative overflow-hidden aspect-square bg-muted">
            <img
              src={record.imageBlob.getDirectURL()}
              alt={record.metadata.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
            {isListed && (
              <div className="absolute top-2 right-2">
                <ListingBadge
                  priceE8s={
                    listings.find((l) => l.tokenId === tokenId)?.priceE8s ?? 0n
                  }
                />
              </div>
            )}
          </div>
        ) : (
          <div className="relative aspect-square bg-gradient-to-br from-primary/20 via-accent/20 to-muted flex items-center justify-center">
            <div className="p-6 rounded-full bg-primary/10">
              {getFileTypeIcon(record.metadata.fileType)}
            </div>
            {isListed && (
              <div className="absolute top-2 right-2">
                <ListingBadge
                  priceE8s={
                    listings.find((l) => l.tokenId === tokenId)?.priceE8s ?? 0n
                  }
                />
              </div>
            )}
          </div>
        )}
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm font-semibold line-clamp-1">
              {record.metadata.title}
            </CardTitle>
            <Badge
              variant="secondary"
              className="text-xs shrink-0 flex items-center gap-1"
            >
              {getFileTypeIcon(record.metadata.fileType)}
              {getFileTypeLabel(record.metadata.fileType)}
            </Badge>
          </div>
          <CardDescription className="text-xs flex items-center gap-1">
            <User className="h-3 w-3" />
            {record.metadata.artist}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-2">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {record.metadata.description}
          </p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {formatDate(record.metadata.mintTimestamp)}
            </span>
            <Badge variant="outline" className="text-xs">
              <TrendingUp className="h-3 w-3 mr-1" />
              {Number(record.params.royaltyPercentage)}%
            </Badge>
          </div>
          <p className="text-xs font-medium text-primary">
            {formatPrice(record.params.price, record.params.stableCoin)}
          </p>
          <p className="text-xs font-mono text-muted-foreground">
            Token #{index}
          </p>
        </CardContent>
      </Card>
    );
  };

  // ===== MY NFT CARD (with list/delist actions) =====
  const MyNFTCard = ({
    record,
    index,
  }: { record: NFTRecordWithParams; index: number }) => {
    const tokenId = BigInt(index);
    const isListed = listedTokenIds.has(tokenId.toString());

    return (
      <Card
        data-ocid={`nft.my.item.${index + 1}`}
        className="overflow-hidden border-border/60"
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {record.imageBlob ? (
              <div className="h-16 w-16 shrink-0 rounded-lg overflow-hidden">
                <img
                  src={record.imageBlob.getDirectURL()}
                  alt={record.metadata.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="h-16 w-16 shrink-0 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                {getFileTypeIcon(record.metadata.fileType)}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h4 className="font-semibold text-sm line-clamp-1">
                  {record.metadata.title}
                </h4>
                {isListed && (
                  <ListingBadge
                    priceE8s={
                      listings.find((l) => l.tokenId === tokenId)?.priceE8s ??
                      0n
                    }
                  />
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {record.metadata.artist}
              </p>
              <p className="text-xs font-mono text-muted-foreground mt-1">
                Token #{index}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {getFileTypeLabel(record.metadata.fileType)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border/60">
            {isListed ? (
              <DelistButton
                tokenId={tokenId}
                nftTitle={record.metadata.title}
              />
            ) : (
              <Button
                data-ocid={`nft.my.list_for_sale.button.${index + 1}`}
                size="sm"
                variant="outline"
                className="border-primary/40 text-primary hover:bg-primary/10"
                onClick={() =>
                  setListForSaleState({ tokenId, title: record.metadata.title })
                }
              >
                <Tag className="h-3.5 w-3.5 mr-1.5" />
                List for Sale
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // ===== MARKETPLACE LISTING CARD =====
  const ListingCard = ({
    listing,
    cardIndex,
  }: { listing: NFTListing; cardIndex: number }) => {
    const isMyListing =
      myPrincipal && listing.seller.toString() === myPrincipal;
    const priceIcp = (Number(listing.priceE8s) / 1e8).toFixed(4);

    const getListingFileIcon = () => {
      if ("audio" in listing.fileType)
        return <Music className="h-10 w-10 text-primary/60" />;
      if ("image" in listing.fileType)
        return <ImageIcon className="h-10 w-10 text-primary/60" />;
      return <Package className="h-10 w-10 text-primary/60" />;
    };

    const getListingTypeLabel = () => {
      if ("audio" in listing.fileType) return "Audio";
      if ("image" in listing.fileType) return "Album Art";
      return "Combined";
    };

    return (
      <Card
        data-ocid={`marketplace.item.${cardIndex + 1}`}
        className="overflow-hidden border-border/60 hover:shadow-md transition-shadow"
      >
        <div className="aspect-square bg-gradient-to-br from-primary/10 via-accent/10 to-muted flex items-center justify-center relative">
          {getListingFileIcon()}
          <div className="absolute top-2 right-2">
            <ListingBadge priceE8s={listing.priceE8s} />
          </div>
          {isMyListing && (
            <div className="absolute top-2 left-2">
              <Badge variant="outline" className="text-xs">
                Your Listing
              </Badge>
            </div>
          )}
        </div>
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-sm line-clamp-1">
              {listing.title}
            </CardTitle>
            <Badge variant="secondary" className="text-xs shrink-0">
              {getListingTypeLabel()}
            </Badge>
          </div>
          <CardDescription className="text-xs">
            <span className="font-mono">
              {listing.seller.toString().slice(0, 12)}…
            </span>
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0 space-y-3">
          <p className="text-xs text-muted-foreground line-clamp-2">
            {listing.description}
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-extrabold text-primary tracking-tight">
                {priceIcp}{" "}
                <span className="text-sm font-semibold text-primary/70">
                  ICP
                </span>
              </p>
              <p className="text-xs text-muted-foreground">
                Token #{listing.tokenId.toString()}
              </p>
            </div>
            {isMyListing ? (
              <DelistButton
                tokenId={listing.tokenId}
                nftTitle={listing.title}
              />
            ) : isAuthenticated ? (
              <Button
                data-ocid={`marketplace.buy.button.${cardIndex + 1}`}
                size="sm"
                disabled={buyMutation.isPending}
                onClick={() =>
                  setConfirmPurchase({
                    tokenId: listing.tokenId,
                    title: listing.title,
                    priceE8s: listing.priceE8s,
                  })
                }
                className="bg-primary hover:bg-primary/90"
              >
                {buyMutation.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <>
                    <ShoppingBag className="h-3.5 w-3.5 mr-1.5" />
                    Buy for {priceIcp} ICP
                  </>
                )}
              </Button>
            ) : (
              <Button size="sm" variant="outline" disabled>
                Sign in to claim
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const NFTGrid = ({ nfts }: { nfts: NFTRecordWithParams[] }) => {
    if (nfts.length === 0) {
      return (
        <div
          className="flex flex-col items-center justify-center py-12 text-center"
          data-ocid="nft.empty_state"
        >
          <div className="rounded-full bg-muted p-6 mb-4">
            <Package className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No NFTs Yet</h3>
          <p className="text-sm text-muted-foreground max-w-md">
            No NFTs have been minted in this category yet. Start creating your
            collection!
          </p>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {nfts.map((record, index) => (
          <NFTCard
            key={`${record.metadata.title}-${record.metadata.mintTimestamp}`}
            record={record}
            index={index}
          />
        ))}
      </div>
    );
  };

  const LoadingSkeleton = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <Card key={i}>
          <Skeleton className="aspect-square" />
          <CardHeader>
            <Skeleton className="h-5 w-32" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const tabCount = isAuthenticated ? 6 : 5;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold tracking-tight mb-4">Music Mints</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Explore and collect NFTs from Strange Waves. Each NFT is fully
          on-chain with permanent ICP ownership transfer.
        </p>
      </div>

      {/* Payment integration notice */}
      <Alert className="mb-8 border-border/40 bg-muted/30 max-w-3xl mx-auto">
        <AlertCircle className="h-4 w-4 text-muted-foreground" />
        <AlertDescription className="text-sm text-muted-foreground">
          NFT purchases are on-chain transactions. ICP will be deducted from
          your wallet upon purchase.
        </AlertDescription>
      </Alert>

      {/* NFT Tabs */}
      <Tabs defaultValue="marketplace" className="w-full mb-12">
        <ScrollArea className="w-full">
          <TabsList
            className={`inline-flex w-auto min-w-full mb-8 grid-cols-${tabCount}`}
          >
            <TabsTrigger
              data-ocid="music_mints.marketplace.tab"
              value="marketplace"
              className="flex items-center gap-1.5"
            >
              <Store className="h-3.5 w-3.5" />
              Marketplace ({listings.length})
            </TabsTrigger>
            <TabsTrigger data-ocid="music_mints.all.tab" value="all">
              All NFTs ({nftRecords?.length || 0})
            </TabsTrigger>
            <TabsTrigger data-ocid="music_mints.audio.tab" value="audio">
              <Music className="h-4 w-4 mr-1.5" />
              Audio ({audioOnlyNFTs.length})
            </TabsTrigger>
            <TabsTrigger data-ocid="music_mints.image.tab" value="image">
              <ImageIcon className="h-4 w-4 mr-1.5" />
              Art ({albumArtOnlyNFTs.length})
            </TabsTrigger>
            <TabsTrigger data-ocid="music_mints.combined.tab" value="combined">
              <Package className="h-4 w-4 mr-1.5" />
              Combined ({combinedNFTs.length})
            </TabsTrigger>
            {isAuthenticated && (
              <TabsTrigger
                value="my-mints"
                data-ocid="music_mints.my_mints.tab"
              >
                <User className="h-4 w-4 mr-1.5" />
                My NFTs ({myNFTs.length})
              </TabsTrigger>
            )}
          </TabsList>
        </ScrollArea>

        {/* MARKETPLACE TAB */}
        <TabsContent value="marketplace">
          {isLoadingListings ? (
            <LoadingSkeleton />
          ) : listings.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="marketplace.empty_state"
            >
              <div className="rounded-full bg-muted p-8 mb-4">
                <Store className="h-14 w-14 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No Listings Yet</h3>
              <p className="text-sm text-muted-foreground max-w-md">
                No NFTs are listed for sale right now. Mint and list your first
                NFT to get the marketplace started!
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map((listing, i) => (
                <ListingCard
                  key={listing.tokenId.toString()}
                  listing={listing}
                  cardIndex={i}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="all">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <NFTGrid nfts={nftRecords || []} />
          )}
        </TabsContent>

        <TabsContent value="audio">
          {isLoading ? <LoadingSkeleton /> : <NFTGrid nfts={audioOnlyNFTs} />}
        </TabsContent>

        <TabsContent value="image">
          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <NFTGrid nfts={albumArtOnlyNFTs} />
          )}
        </TabsContent>

        <TabsContent value="combined">
          {isLoading ? <LoadingSkeleton /> : <NFTGrid nfts={combinedNFTs} />}
        </TabsContent>

        {isAuthenticated && (
          <TabsContent value="my-mints">
            {isLoadingMyNFTs ? (
              <LoadingSkeleton />
            ) : myNFTs.length === 0 ? (
              <div
                className="text-center py-16 text-muted-foreground"
                data-ocid="music_mints.my_mints.empty_state"
              >
                <User className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p className="text-xl font-semibold mb-2">No NFTs yet</p>
                <p className="text-sm">
                  NFTs you mint or receive will appear here.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {myNFTs.map((record, index) => (
                  <MyNFTCard
                    key={`${record.metadata.title}-${record.metadata.mintTimestamp}`}
                    record={record}
                    index={index}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        )}
      </Tabs>

      {/* Wallet / Edit Section */}
      {isAuthenticated && (
        <section className="mb-12">
          <div className="space-y-4">
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
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isEditExpanded
                  ? "max-h-[3000px] opacity-100"
                  : "max-h-0 opacity-0"
              }`}
            >
              <div className="relative">
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
          <DialogContent
            data-ocid="nft.detail.dialog"
            className="max-w-3xl max-h-[90vh]"
          >
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getFileTypeIcon(selectedNFT.record.metadata.fileType)}
                {selectedNFT.record.metadata.title}
              </DialogTitle>
              <DialogDescription>
                NFT #{selectedNFT.index} &bull;{" "}
                {formatPrice(
                  selectedNFT.record.params.price,
                  selectedNFT.record.params.stableCoin,
                )}
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh]">
              <div className="space-y-6 pr-4">
                {selectedNFT.record.imageBlob && (
                  <div className="overflow-hidden rounded-lg">
                    <img
                      src={selectedNFT.record.imageBlob.getDirectURL()}
                      alt={selectedNFT.record.metadata.title}
                      className="w-full object-contain max-h-80"
                    />
                  </div>
                )}
                {selectedNFT.record.audioBlob && (
                  <div className="flex items-center gap-3">
                    <Button
                      data-ocid="nft.detail.play_button"
                      variant="outline"
                      size="icon"
                      onClick={() => handlePlayPause(selectedNFT.record)}
                      className="h-10 w-10 shrink-0"
                    >
                      {isPlaying ? (
                        <Pause className="h-5 w-5" />
                      ) : (
                        <Play className="h-5 w-5" />
                      )}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {isPlaying ? "Now Playing" : "Preview Audio"}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Artist</p>
                    <p className="font-medium">
                      {selectedNFT.record.metadata.artist}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Type</p>
                    <p className="font-medium">
                      {getFileTypeLabel(selectedNFT.record.metadata.fileType)}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      Royalty
                    </p>
                    <p className="font-medium">
                      {Number(selectedNFT.record.params.royaltyPercentage)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">
                      Token ID
                    </p>
                    <p className="font-mono font-medium">
                      #{selectedNFT.index}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs mb-1">Minted</p>
                    <p className="font-medium">
                      {formatDate(selectedNFT.record.metadata.mintTimestamp)}
                    </p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-muted-foreground text-xs mb-1">
                      Description
                    </p>
                    <p className="text-sm">
                      {selectedNFT.record.metadata.description}
                    </p>
                  </div>
                </div>
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}

      {/* List for Sale Dialog */}
      {listForSaleState && (
        <ListForSaleDialog
          open={!!listForSaleState}
          onOpenChange={(open) => !open && setListForSaleState(null)}
          tokenId={listForSaleState.tokenId}
          nftTitle={listForSaleState.title}
        />
      )}

      {/* Purchase Confirmation Dialog */}
      <Dialog
        open={!!confirmPurchase}
        onOpenChange={(open) => !open && setConfirmPurchase(null)}
      >
        <DialogContent
          data-ocid="marketplace.confirm_purchase.dialog"
          className="sm:max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-primary" />
              Confirm Purchase
            </DialogTitle>
            <DialogDescription>
              You are about to purchase this NFT with on-chain ICP transfer.
            </DialogDescription>
          </DialogHeader>
          {confirmPurchase && (
            <div className="space-y-4 py-2">
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">NFT</p>
                <p className="font-semibold">{confirmPurchase.title}</p>
              </div>
              <div className="rounded-lg border border-border/60 bg-muted/30 p-4 space-y-2">
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="text-3xl font-extrabold text-primary tracking-tight">
                  {(Number(confirmPurchase.priceE8s) / 1e8).toFixed(4)}{" "}
                  <span className="text-base font-semibold text-primary/70">
                    ICP
                  </span>
                </p>
              </div>
              <Alert className="border-destructive/30 bg-destructive/5">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <AlertDescription className="text-sm text-destructive/80">
                  This will deduct ICP from your wallet. This action cannot be
                  undone.
                </AlertDescription>
              </Alert>
            </div>
          )}
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              data-ocid="marketplace.confirm_purchase.cancel_button"
              variant="outline"
              onClick={() => setConfirmPurchase(null)}
              disabled={buyMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              data-ocid="marketplace.confirm_purchase.confirm_button"
              onClick={() => {
                if (confirmPurchase) {
                  buyMutation.mutate(confirmPurchase.tokenId, {
                    onSettled: () => setConfirmPurchase(null),
                  });
                }
              }}
              disabled={buyMutation.isPending}
              className="bg-primary hover:bg-primary/90"
            >
              {buyMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <ShoppingBag className="h-4 w-4 mr-2" />
              )}
              {buyMutation.isPending ? "Processing..." : "Confirm Purchase"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

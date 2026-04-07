import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Image as ImageIcon,
  Lock,
  Maximize2,
  Music,
  Package,
  ShoppingBag,
  TrendingUp,
  User,
  Video,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import type {
  NFTAttachmentRecord,
  NFTRecordWithParamsView as NFTRecordWithParams,
  StableCoin,
} from "../backend";
import { FileType } from "../backend";
import { useCanisterId } from "../hooks/useQueries";
import { RichTextRenderer } from "./RichTextRenderer";

interface NFTDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nft: NFTRecordWithParams;
  tokenId: bigint;
  /** Current user's principal string (undefined if not signed in) */
  currentUserPrincipal?: string;
  /** If this NFT is listed for sale */
  listing?: { priceE8s: bigint };
  isAuthenticated: boolean;
  /** Called when user clicks Buy / Claim */
  onRequestBuy?: (tokenId: bigint, title: string, priceE8s: bigint) => void;
}

// ──────────────────────────────────────────────────────────────────────────────
// Lightbox overlay for image fullscreen
// ──────────────────────────────────────────────────────────────────────────────
function ImageLightbox({
  src,
  alt,
  onClose,
}: { src: string; alt: string; onClose: () => void }) {
  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: click-to-close pattern
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
        aria-label="Close lightbox"
      >
        <X className="h-5 w-5" />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-[90vw] max-h-[90vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      />
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
// Main modal
// ──────────────────────────────────────────────────────────────────────────────
export function NFTDetailModal({
  open,
  onOpenChange,
  nft,
  tokenId,
  currentUserPrincipal,
  listing,
  isAuthenticated,
  onRequestBuy,
}: NFTDetailModalProps) {
  const { data: canisterId = "" } = useCanisterId();
  const [copiedCanisterId, setCopiedCanisterId] = useState(false);
  const [lightbox, setLightbox] = useState<{ src: string; alt: string } | null>(
    null,
  );

  const copyCanisterId = () => {
    if (!canisterId) return;
    navigator.clipboard.writeText(canisterId);
    setCopiedCanisterId(true);
    setTimeout(() => setCopiedCanisterId(false), 2000);
  };

  const imageUrl = nft.imageBlob?.getDirectURL();

  const isOwner =
    currentUserPrincipal &&
    nft.metadata.owner.toString() === currentUserPrincipal;

  // Reset lightbox when dialog closes
  useEffect(() => {
    if (!open) {
      setLightbox(null);
    }
  }, [open]);

  const getFileTypeLabel = (fileType: FileType) => {
    if (fileType === FileType.audio) return "Audio NFT";
    if (fileType === FileType.image) return "Album Art";
    return "Audio + Art";
  };

  const getFileTypeIcon = (fileType: FileType) => {
    if (fileType === FileType.audio) return <Music className="h-3.5 w-3.5" />;
    if (fileType === FileType.image)
      return <ImageIcon className="h-3.5 w-3.5" />;
    return <Package className="h-3.5 w-3.5" />;
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

  const formatDate = (timestamp: bigint) => {
    const date = new Date(Number(timestamp) / 1_000_000);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const truncatePrincipal = (principal: string) =>
    `${principal.slice(0, 10)}\u2026${principal.slice(-6)}`;

  const priceIcp = listing
    ? `${(Number(listing.priceE8s) / 1e8).toFixed(4)} ICP`
    : null;

  return (
    <>
      {/* Lightbox */}
      {lightbox && (
        <ImageLightbox
          src={lightbox.src}
          alt={lightbox.alt}
          onClose={() => setLightbox(null)}
        />
      )}

      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          data-ocid="nft_detail.modal"
          className="max-w-2xl max-h-[92vh] p-0 overflow-hidden bg-card border-border/60 shadow-2xl"
        >
          <ScrollArea className="max-h-[92vh]">
            <div className="flex flex-col">
              {/* Cover Art Hero */}
              <div className="relative w-full bg-gradient-to-br from-primary/20 via-accent/10 to-background">
                {imageUrl ? (
                  <div
                    className="relative group cursor-pointer"
                    onClick={() =>
                      setLightbox({ src: imageUrl, alt: nft.metadata.title })
                    }
                    onKeyDown={() => {}}
                  >
                    <img
                      src={imageUrl}
                      alt={nft.metadata.title}
                      className="w-full max-h-72 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-background/80 backdrop-blur-sm p-3">
                        <Maximize2 className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-48 flex items-center justify-center">
                    <div className="rounded-full bg-primary/10 p-10">
                      <Music className="h-16 w-16 text-primary/60" />
                    </div>
                  </div>
                )}
                <button
                  data-ocid="nft_detail.close_button"
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="absolute top-3 right-3 rounded-full bg-background/80 backdrop-blur-sm p-1.5 text-foreground/70 hover:text-foreground transition-colors border border-border/40"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Title + Badges */}
                <DialogHeader className="space-y-2 text-left">
                  <div className="flex items-start gap-3 justify-between">
                    <DialogTitle className="text-2xl font-bold leading-tight tracking-tight">
                      {nft.metadata.title}
                    </DialogTitle>
                    <Badge
                      variant="secondary"
                      className="shrink-0 flex items-center gap-1 text-xs mt-1"
                    >
                      {getFileTypeIcon(nft.metadata.fileType)}
                      {getFileTypeLabel(nft.metadata.fileType)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1 text-sm text-muted-foreground">
                      <User className="h-3.5 w-3.5" />
                      <span className="font-mono text-xs">
                        {truncatePrincipal(nft.metadata.owner.toString())}
                      </span>
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-xs text-muted-foreground">
                      Token #{tokenId.toString()}
                    </span>
                    <span className="text-muted-foreground/40">•</span>
                    <span className="text-xs text-muted-foreground">
                      {formatDate(nft.metadata.mintTimestamp)}
                    </span>
                  </div>
                  {canisterId && (
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">
                        Canister:
                      </span>
                      <span className="font-mono text-xs text-muted-foreground">
                        {canisterId.length > 20
                          ? `${canisterId.slice(0, 12)}\u2026${canisterId.slice(-8)}`
                          : canisterId}
                      </span>
                      <button
                        type="button"
                        onClick={copyCanisterId}
                        className="inline-flex items-center justify-center h-5 w-5 rounded hover:bg-muted transition-colors"
                        title="Copy Canister ID"
                        data-ocid="nft.canister_id.button"
                      >
                        {copiedCanisterId ? (
                          <Check className="h-3 w-3 text-green-500" />
                        ) : (
                          <Copy className="h-3 w-3 text-muted-foreground" />
                        )}
                      </button>
                    </div>
                  )}
                </DialogHeader>

                <Separator />

                {/* Metadata Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Artist</p>
                    <p className="font-semibold">{nft.metadata.artist}</p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Royalty</p>
                    <p className="font-semibold flex items-center gap-1">
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      {Number(nft.params.royaltyPercentage)}%
                    </p>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold text-primary">
                      {priceIcp ??
                        formatPrice(nft.params.price, nft.params.stableCoin)}
                    </p>
                  </div>
                </div>

                {/* Description */}
                {nft.metadata.description && (
                  <div className="space-y-1.5">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Description
                    </p>
                    <RichTextRenderer value={nft.metadata.description} />
                  </div>
                )}

                {/* NFT Content & Attachments — horizontal scroll cards */}
                {nft.attachments &&
                  nft.attachments.length > 0 &&
                  (() => {
                    const visibleAtts = nft.attachments.filter(
                      (att) => !att.mimeType.startsWith("audio"),
                    );
                    if (visibleAtts.length === 0) return null;
                    return (
                      <>
                        <Separator />
                        <div className="space-y-3">
                          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                            Attachments ({visibleAtts.length})
                          </p>
                          <div className="flex overflow-x-auto gap-3 pb-2 scroll-smooth snap-x scrollbar-thin">
                            {visibleAtts.map(
                              (att: NFTAttachmentRecord, i: number) => {
                                const canView = !att.isPrivate || isOwner;
                                const url = att.blob.getDirectURL();
                                const isImage =
                                  att.mimeType.startsWith("image");
                                const isVideo =
                                  att.mimeType.startsWith("video");
                                const isPdf =
                                  att.mimeType === "application/pdf" ||
                                  att.name.toLowerCase().endsWith(".pdf");
                                return (
                                  <div
                                    // biome-ignore lint/suspicious/noArrayIndexKey: stable attachment index
                                    key={i}
                                    className="snap-center shrink-0 w-44 rounded-xl border border-border/60 bg-muted/30 overflow-hidden flex flex-col"
                                  >
                                    {!canView ? (
                                      <div className="flex-1 flex flex-col items-center justify-center gap-2 p-4 min-h-[120px]">
                                        <Lock className="h-6 w-6 text-amber-500" />
                                        <span className="text-xs text-center text-muted-foreground">
                                          Own this NFT to unlock
                                        </span>
                                      </div>
                                    ) : isImage ? (
                                      <button
                                        type="button"
                                        onClick={() =>
                                          setLightbox({
                                            src: url,
                                            alt: att.name,
                                          })
                                        }
                                        className="relative group flex-1 min-h-[120px]"
                                      >
                                        <img
                                          src={url}
                                          alt={att.name}
                                          className="w-full h-32 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                                          <Maximize2 className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                      </button>
                                    ) : isVideo ? (
                                      <div className="relative flex-1 min-h-[120px]">
                                        {/* biome-ignore lint/a11y/useMediaCaption: user-uploaded attachment */}
                                        <video
                                          src={url}
                                          className="w-full h-32 object-cover"
                                        />
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const v =
                                              document.createElement("video");
                                            v.src = url;
                                            v.requestFullscreen?.();
                                          }}
                                          className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-colors"
                                        >
                                          <Video className="h-8 w-8 text-white" />
                                        </button>
                                      </div>
                                    ) : isPdf ? (
                                      <a
                                        href={url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex-1 flex flex-col items-center justify-center gap-2 p-4 min-h-[120px] hover:bg-muted/60 transition-colors"
                                      >
                                        <FileText className="h-10 w-10 text-primary/60" />
                                        <span className="text-xs text-center text-muted-foreground line-clamp-2">
                                          {att.name}
                                        </span>
                                      </a>
                                    ) : (
                                      <a
                                        href={url}
                                        download={att.name}
                                        className="flex-1 flex flex-col items-center justify-center gap-2 p-4 min-h-[120px] hover:bg-muted/60 transition-colors"
                                      >
                                        <Download className="h-8 w-8 text-primary/60" />
                                        <span className="text-xs text-center text-muted-foreground line-clamp-2">
                                          {att.name}
                                        </span>
                                      </a>
                                    )}
                                    <div className="px-2 py-1.5 border-t border-border/40">
                                      <p
                                        className="text-xs text-muted-foreground truncate"
                                        title={att.name}
                                      >
                                        {att.name}
                                      </p>
                                    </div>
                                  </div>
                                );
                              },
                            )}
                          </div>
                          {visibleAtts.length > 1 && (
                            <div className="flex justify-center gap-1.5 pt-1">
                              {visibleAtts.map((att: NFTAttachmentRecord) => (
                                <div
                                  key={att.name}
                                  className="h-1.5 w-1.5 rounded-full bg-border"
                                />
                              ))}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}

                {/* Buy / Claim Action */}
                {listing && !isOwner && (
                  <div className="pt-2">
                    <Separator className="mb-4" />
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground">
                          Listed price
                        </p>
                        <p className="text-2xl font-extrabold text-primary tracking-tight">
                          {(Number(listing.priceE8s) / 1e8).toFixed(4)}{" "}
                          <span className="text-sm font-semibold text-primary/70">
                            ICP
                          </span>
                        </p>
                      </div>
                      {isAuthenticated ? (
                        <Button
                          data-ocid="nft_detail.buy_button"
                          className="bg-primary hover:bg-primary/90 px-6"
                          onClick={() =>
                            onRequestBuy?.(
                              tokenId,
                              nft.metadata.title,
                              listing.priceE8s,
                            )
                          }
                        >
                          <ShoppingBag className="h-4 w-4 mr-2" />
                          Buy Now
                        </Button>
                      ) : (
                        <Button variant="outline" disabled>
                          Sign in to buy
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                {isOwner && (
                  <div className="pt-2 text-center">
                    <Badge variant="secondary" className="text-sm px-4 py-1.5">
                      You own this NFT
                    </Badge>
                  </div>
                )}
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}

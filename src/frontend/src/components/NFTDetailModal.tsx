import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import {
  Check,
  Copy,
  Image as ImageIcon,
  Lock,
  Music,
  Package,
  Pause,
  Play,
  ShoppingBag,
  TrendingUp,
  User,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import type {
  NFTRecordWithParamsView as NFTRecordWithParams,
  StableCoin,
} from "../backend";
import { FileType } from "../backend";

export interface NFTAttachment {
  name: string;
  type: string;
  isPrivate: boolean;
  url?: string;
}

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
  /** Optional attachments (from mint dialog, stored locally) */
  attachments?: NFTAttachment[];
}

const PREVIEW_DURATION = 30; // seconds

export function NFTDetailModal({
  open,
  onOpenChange,
  nft,
  tokenId,
  currentUserPrincipal,
  listing,
  isAuthenticated,
  onRequestBuy,
  attachments = [],
}: NFTDetailModalProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [canisterId, setCanisterId] = useState("");
  const [copiedCanisterId, setCopiedCanisterId] = useState(false);

  useEffect(() => {
    setCanisterId(localStorage.getItem("liveCanisterId") || "");
  }, []);

  const copyCanisterId = () => {
    if (!canisterId) return;
    navigator.clipboard.writeText(canisterId);
    setCopiedCanisterId(true);
    setTimeout(() => setCopiedCanisterId(false), 2000);
  };

  const audioUrl = nft.audioBlob?.getDirectURL();
  const imageUrl = nft.imageBlob?.getDirectURL();

  const isOwner =
    currentUserPrincipal &&
    nft.metadata.owner.toString() === currentUserPrincipal;

  // Reset player when dialog opens/closes
  useEffect(() => {
    if (!open) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlaying(false);
      setPreviewTime(0);
      setAudioReady(false);
      setAudioError(false);
    }
  }, [open]);

  const handleTimeUpdate = useCallback(() => {
    const el = audioRef.current;
    if (!el) return;
    const clamped = Math.min(el.currentTime, PREVIEW_DURATION);
    setPreviewTime(clamped);
    if (el.currentTime >= PREVIEW_DURATION) {
      el.pause();
      el.currentTime = 0;
      setPreviewTime(0);
      setIsPlaying(false);
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    const el = audioRef.current;
    if (!el || !audioUrl) return;
    if (isPlaying) {
      el.pause();
      setIsPlaying(false);
    } else {
      el.currentTime = 0;
      el.play()
        .then(() => setIsPlaying(true))
        .catch(() => setAudioError(true));
    }
  }, [isPlaying, audioUrl]);

  const progressPct = (previewTime / PREVIEW_DURATION) * 100;
  const remainingSeconds = Math.max(
    0,
    PREVIEW_DURATION - Math.floor(previewTime),
  );

  // Helpers
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
    `${principal.slice(0, 10)}…${principal.slice(-6)}`;

  const priceIcp = listing
    ? `${(Number(listing.priceE8s) / 1e8).toFixed(4)} ICP`
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="nft_detail.modal"
        className="max-w-2xl max-h-[92vh] p-0 overflow-hidden bg-card border-border/60 shadow-2xl"
      >
        {/* Hidden audio element */}
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl}
            preload="metadata"
            onCanPlay={() => setAudioReady(true)}
            onTimeUpdate={handleTimeUpdate}
            onEnded={() => {
              setIsPlaying(false);
              setPreviewTime(0);
            }}
            onError={() => setAudioError(true)}
          >
            {/* biome-ignore lint/a11y/useMediaCaption: short preview clips have no captions */}
            <track kind="captions" />
          </audio>
        )}

        <ScrollArea className="max-h-[92vh]">
          <div className="flex flex-col">
            {/* Cover Art Hero */}
            <div className="relative w-full bg-gradient-to-br from-primary/20 via-accent/10 to-background">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={nft.metadata.title}
                  className="w-full max-h-72 object-cover"
                />
              ) : (
                <div className="w-full h-48 flex items-center justify-center">
                  <div className="rounded-full bg-primary/10 p-10">
                    <Music className="h-16 w-16 text-primary/60" />
                  </div>
                </div>
              )}
              {/* Close button overlay */}
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
                        ? `${canisterId.slice(0, 12)}…${canisterId.slice(-8)}`
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

              {/* 30-Second Preview Player */}
              {audioUrl && (
                <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-xs font-semibold text-primary/80 uppercase tracking-wider">
                    30s Preview
                  </p>
                  <div className="flex items-center gap-4">
                    <button
                      data-ocid="nft_detail.preview_button"
                      type="button"
                      onClick={handleTogglePlay}
                      disabled={!audioReady && !audioError}
                      className="flex items-center justify-center h-10 w-10 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 shrink-0"
                    >
                      {isPlaying ? (
                        <Pause className="h-4 w-4" />
                      ) : (
                        <Play className="h-4 w-4 translate-x-0.5" />
                      )}
                    </button>
                    <div className="flex-1 space-y-1.5">
                      {/* Waveform-style progress bar */}
                      <div className="relative h-2 w-full rounded-full bg-primary/15 overflow-hidden">
                        <div
                          className="absolute inset-y-0 left-0 rounded-full bg-primary transition-all duration-100"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>
                          {isPlaying
                            ? `${Math.floor(previewTime)}s`
                            : "Click play"}
                        </span>
                        <span className="text-primary/70">
                          {isPlaying
                            ? `${remainingSeconds}s remaining`
                            : "30s preview"}
                        </span>
                      </div>
                    </div>
                  </div>
                  {audioError && (
                    <p className="text-xs text-destructive">
                      Unable to load audio preview.
                    </p>
                  )}
                </div>
              )}

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
                  <p className="text-sm leading-relaxed text-foreground/80">
                    {nft.metadata.description}
                  </p>
                </div>
              )}

              {/* Attachments */}
              {attachments.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Attachments ({attachments.length})
                    </p>
                    <ul className="space-y-2">
                      {attachments.map((att, i) => {
                        const canView = !att.isPrivate || isOwner;
                        return (
                          <li
                            // biome-ignore lint/suspicious/noArrayIndexKey: stable attachment index
                            key={i}
                            className={`rounded-lg border px-4 py-3 flex items-center gap-3 ${
                              canView
                                ? "border-border/60 bg-muted/30"
                                : "border-amber-500/30 bg-amber-500/5"
                            }`}
                          >
                            {canView ? (
                              <>
                                <span className="flex-1 text-sm truncate">
                                  {att.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs shrink-0"
                                >
                                  {att.type || "file"}
                                </Badge>
                                {att.url && (
                                  <a
                                    href={att.url}
                                    download={att.name}
                                    className="text-xs text-primary hover:underline shrink-0"
                                  >
                                    Download
                                  </a>
                                )}
                              </>
                            ) : (
                              <>
                                <Lock className="h-4 w-4 text-amber-500 shrink-0" />
                                <span className="flex-1 text-sm text-muted-foreground">
                                  Own this NFT to unlock
                                </span>
                                <Badge
                                  variant="outline"
                                  className="text-xs text-amber-500 border-amber-500/40 shrink-0"
                                >
                                  Owner-only
                                </Badge>
                              </>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </>
              )}

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
  );
}

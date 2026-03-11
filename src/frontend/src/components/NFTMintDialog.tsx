import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import {
  Crown,
  DollarSign,
  Image as ImageIcon,
  Layers,
  Loader2,
  Music,
  Package,
  Paperclip,
  Plus,
  RefreshCw,
  Sparkles,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import type { AudioFile, RevenueSplit, StableCoin } from "../backend";
import { FileType } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

type EditionType = "1of1" | "collection";
type PaymentMethod = "icp" | StableCoin;

interface NFTMintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audioFile: AudioFile;
  onMint: (data: {
    title: string;
    description: string;
    artist: string;
    fileType: FileType;
    price: number;
    stableCoin: StableCoin;
    royaltyPercentage: number;
    revenueSplits: RevenueSplit[];
  }) => Promise<void>;
  isLoading: boolean;
}

const PAYMENT_OPTIONS = [
  {
    value: "icp",
    label: "ICP (Internet Computer)",
    symbol: "ICP",
    isICP: true,
  },
  { value: "usdc", label: "USDC (USD Coin)", symbol: "USDC", isICP: false },
  { value: "tusd", label: "TUSD (TrueUSD)", symbol: "TUSD", isICP: false },
  {
    value: "rlusd",
    label: "RLUSD (Ripple USD)",
    symbol: "RLUSD",
    isICP: false,
  },
  { value: "usde", label: "USDE (Ethena USDe)", symbol: "USDE", isICP: false },
  { value: "usdp", label: "USDP (Pax Dollar)", symbol: "USDP", isICP: false },
];

async function fetchICPPriceUSD(): Promise<number | null> {
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd",
    );
    const data = await res.json();
    return data?.["internet-computer"]?.usd ?? null;
  } catch {
    return null;
  }
}

export function NFTMintDialog({
  open,
  onOpenChange,
  audioFile,
  onMint,
  isLoading,
}: NFTMintDialogProps) {
  const { identity } = useInternetIdentity();
  const [mintType, setMintType] = useState<FileType>(FileType.combined);
  const [editionType, setEditionType] = useState<EditionType>("1of1");
  const [editionCount, setEditionCount] = useState<number>(10);
  const [title, setTitle] = useState(audioFile.title);
  const [artist, setArtist] = useState(audioFile.creator);
  const [description, setDescription] = useState("");
  const [attachments, setAttachments] = useState<File[]>([]);

  // Pricing
  const [usdPrice, setUsdPrice] = useState<string>("10");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | "">("");
  const [icpRate, setIcpRate] = useState<number | null>(null);
  const [isFetchingRate, setIsFetchingRate] = useState(false);

  const [royaltyPercentage, setRoyaltyPercentage] = useState<number>(10);
  const [revenueSplits, setRevenueSplits] = useState<
    Array<{ address: string; percentage: string }>
  >([
    { address: identity?.getPrincipal().toString() || "", percentage: "100" },
  ]);

  const loadICPRate = useCallback(async () => {
    setIsFetchingRate(true);
    const rate = await fetchICPPriceUSD();
    setIcpRate(rate);
    setIsFetchingRate(false);
  }, []);

  // Fetch ICP rate when dialog opens or when ICP is selected
  useEffect(() => {
    if (open) loadICPRate();
  }, [open, loadICPRate]);

  const icpEquivalent =
    icpRate &&
    usdPrice &&
    !Number.isNaN(Number(usdPrice)) &&
    Number(usdPrice) > 0
      ? (Number(usdPrice) / icpRate).toFixed(4)
      : null;

  const handleMint = async () => {
    if (!title.trim() || !artist.trim() || !description.trim()) return;
    if (!paymentMethod) return;

    const priceNum = Number.parseFloat(usdPrice);
    if (Number.isNaN(priceNum) || priceNum <= 0) return;

    const totalPercentage = revenueSplits.reduce((sum, split) => {
      const pct = Number.parseFloat(split.percentage);
      return sum + (Number.isNaN(pct) ? 0 : pct);
    }, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) return;

    const revenueSplitsFormatted: RevenueSplit[] = revenueSplits
      .filter((split) => split.address.trim() !== "")
      .map((split) => ({
        address: split.address.trim() as any,
        percentage: BigInt(Math.round(Number.parseFloat(split.percentage))),
      }));
    if (revenueSplitsFormatted.length === 0) return;

    // For ICP payments, store the ICP equivalent price; otherwise store USD price
    const effectivePrice =
      paymentMethod === "icp" && icpEquivalent
        ? Number.parseFloat(icpEquivalent)
        : priceNum;

    await onMint({
      title: title.trim(),
      description: description.trim(),
      artist: artist.trim(),
      fileType: mintType,
      price: effectivePrice,
      stableCoin: (paymentMethod === "icp"
        ? "usdc"
        : paymentMethod) as StableCoin,
      royaltyPercentage,
      revenueSplits: revenueSplitsFormatted,
    });
  };

  const addRevenueSplit = () => {
    setRevenueSplits([...revenueSplits, { address: "", percentage: "0" }]);
  };

  const removeRevenueSplit = (index: number) => {
    if (revenueSplits.length > 1) {
      setRevenueSplits(revenueSplits.filter((_, i) => i !== index));
    }
  };

  const updateRevenueSplit = (
    index: number,
    field: "address" | "percentage",
    value: string,
  ) => {
    const updated = [...revenueSplits];
    updated[index][field] = value;
    setRevenueSplits(updated);
  };

  const totalPercentage = revenueSplits.reduce((sum, split) => {
    const pct = Number.parseFloat(split.percentage);
    return sum + (Number.isNaN(pct) ? 0 : pct);
  }, 0);

  const isValidPercentage = Math.abs(totalPercentage - 100) < 0.01;

  const selectedPayment = PAYMENT_OPTIONS.find(
    (o) => o.value === paymentMethod,
  );

  const getMintTypeLabel = (type: FileType) => {
    switch (type) {
      case FileType.audio:
        return "Audio Only";
      case FileType.image:
        return "Album Art Only";
      case FileType.combined:
        return "Audio + Album Art Package";
    }
  };

  const getMintTypeIcon = (type: FileType) => {
    switch (type) {
      case FileType.audio:
        return <Music className="h-5 w-5" />;
      case FileType.image:
        return <ImageIcon className="h-5 w-5" />;
      case FileType.combined:
        return <Package className="h-5 w-5" />;
    }
  };

  const getMintTypeDescription = (type: FileType) => {
    switch (type) {
      case FileType.audio:
        return "Mint an NFT containing only the audio file";
      case FileType.image:
        return "Mint an NFT containing only the album artwork";
      case FileType.combined:
        return "Mint an NFT package with both audio and album art";
    }
  };

  const canMintType = (type: FileType) => {
    if (type === FileType.audio) return true;
    if (type === FileType.image) return !!audioFile.coverImage;
    if (type === FileType.combined) return !!audioFile.coverImage;
    return false;
  };

  const mintButtonLabel = () => {
    if (isLoading) return null;
    if (editionType === "1of1") return "Mint 1 of 1";
    return `Mint Collection (${editionCount})`;
  };

  const canSubmit =
    !isLoading &&
    title.trim() !== "" &&
    artist.trim() !== "" &&
    description.trim() !== "" &&
    paymentMethod !== "" &&
    isValidPercentage &&
    Number.parseFloat(usdPrice) > 0 &&
    revenueSplits.every((s) => s.address.trim() !== "");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Mint NFT with Custom Parameters
          </DialogTitle>
          <DialogDescription>
            Create an NFT with custom pricing, royalties, and revenue splits.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-200px)] pr-4">
          <div className="space-y-6 py-4">
            {/* Preview Section */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  {audioFile.coverImage ? (
                    <div className="h-20 w-20 shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={audioFile.coverImage.getDirectURL()}
                        alt={audioFile.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                      <Music className="h-8 w-8 text-primary-foreground" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{audioFile.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {audioFile.creator}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Duration: {Math.floor(Number(audioFile.duration) / 60)}:
                      {(Number(audioFile.duration) % 60)
                        .toString()
                        .padStart(2, "0")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mint Type Selection */}
            <div className="space-y-3">
              <Label>NFT Type *</Label>
              <RadioGroup
                value={mintType}
                onValueChange={(value) => setMintType(value as FileType)}
              >
                <div className="space-y-3">
                  {[FileType.audio, FileType.image, FileType.combined].map(
                    (type) => {
                      const disabled = !canMintType(type);
                      return (
                        <button
                          key={type}
                          type="button"
                          disabled={disabled}
                          className={`w-full flex items-start space-x-3 rounded-lg border p-4 transition-colors text-left ${
                            mintType === type
                              ? "border-primary bg-primary/5"
                              : "border-border"
                          } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-primary/50"}`}
                          onClick={() => !disabled && setMintType(type)}
                        >
                          <RadioGroupItem
                            value={type}
                            id={type}
                            disabled={disabled}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <Label
                              htmlFor={type}
                              className={`flex items-center gap-2 font-semibold ${disabled ? "cursor-not-allowed" : "cursor-pointer"}`}
                            >
                              {getMintTypeIcon(type)}
                              {getMintTypeLabel(type)}
                            </Label>
                            <p className="text-sm text-muted-foreground mt-1">
                              {getMintTypeDescription(type)}
                            </p>
                            {disabled && type !== FileType.audio && (
                              <p className="text-xs text-destructive mt-1">
                                No album artwork available for this track
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    },
                  )}
                </div>
              </RadioGroup>
            </div>

            {/* Edition Type Selection */}
            <div className="space-y-3">
              <Label>Edition Type *</Label>
              <p className="text-xs text-muted-foreground -mt-1">
                Choose whether this is a unique single edition or a limited
                collection.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  data-ocid="nft.edition_type.1of1.radio"
                  className={`flex items-start gap-3 rounded-lg border p-4 transition-all text-left ${
                    editionType === "1of1"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setEditionType("1of1")}
                  disabled={isLoading}
                >
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      editionType === "1of1"
                        ? "border-primary"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {editionType === "1of1" && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 font-semibold text-sm">
                      <Crown className="h-4 w-4 text-amber-500 shrink-0" />1 of
                      1
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      A unique, single-edition NFT. Only one will ever exist.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  data-ocid="nft.edition_type.collection.radio"
                  className={`flex items-start gap-3 rounded-lg border p-4 transition-all text-left ${
                    editionType === "collection"
                      ? "border-primary bg-primary/5 ring-1 ring-primary/30"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => setEditionType("collection")}
                  disabled={isLoading}
                >
                  <div
                    className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2 ${
                      editionType === "collection"
                        ? "border-primary"
                        : "border-muted-foreground/40"
                    }`}
                  >
                    {editionType === "collection" && (
                      <div className="h-2 w-2 rounded-full bg-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5 font-semibold text-sm">
                      <Layers className="h-4 w-4 text-primary shrink-0" />
                      Collection
                    </span>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      Mint multiple editions of this NFT.
                    </p>
                  </div>
                </button>
              </div>

              {editionType === "collection" && (
                <div className="space-y-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <Label htmlFor="edition-count" className="font-medium">
                    Number of Editions
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    How many copies of this NFT should exist in the collection?
                    (Min 2, Max 10,000)
                  </p>
                  <Input
                    id="edition-count"
                    data-ocid="nft.edition_count.input"
                    type="number"
                    min={2}
                    max={10000}
                    step={1}
                    value={editionCount}
                    onChange={(e) => {
                      const val = Number.parseInt(e.target.value, 10);
                      if (!Number.isNaN(val))
                        setEditionCount(Math.min(10000, Math.max(2, val)));
                    }}
                    placeholder="10"
                    disabled={isLoading}
                    className="max-w-[160px]"
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Metadata Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">NFT Metadata</h3>

              <div className="space-y-2">
                <Label htmlFor="nft-title">NFT Title *</Label>
                <Input
                  id="nft-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter NFT title"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nft-artist">Artist Name *</Label>
                <Input
                  id="nft-artist"
                  value={artist}
                  onChange={(e) => setArtist(e.target.value)}
                  placeholder="Enter artist name"
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="nft-description">Description *</Label>
                <Textarea
                  id="nft-description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your NFT..."
                  rows={3}
                  disabled={isLoading}
                />
              </div>

              <div className="space-y-2">
                <Label>Attachments (Optional)</Label>
                <p className="text-xs text-muted-foreground">
                  Attach PDFs, images, audio, or video files for special NFT
                  customization.
                </p>
                <label
                  className="flex items-center gap-2 cursor-pointer border border-dashed border-muted-foreground/40 rounded-lg px-4 py-3 hover:border-primary/60 transition-colors"
                  data-ocid="nft.attachment.dropzone"
                >
                  <Paperclip className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    Click to attach files (PDF, image, audio, video)
                  </span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*,audio/*,video/*"
                    className="hidden"
                    disabled={isLoading}
                    onChange={(e) => {
                      if (e.target.files) {
                        setAttachments((prev) => [
                          ...prev,
                          ...Array.from(e.target.files!),
                        ]);
                      }
                    }}
                  />
                </label>
                {attachments.length > 0 && (
                  <ul className="space-y-1 mt-2">
                    {attachments.map((file, i) => (
                      <li
                        key={file.name}
                        className="flex items-center justify-between text-sm bg-muted/40 rounded px-3 py-1.5"
                      >
                        <span className="truncate max-w-[260px]">
                          {file.name}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            setAttachments((prev) =>
                              prev.filter((_, idx) => idx !== i),
                            )
                          }
                          className="ml-2 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <Separator />

            {/* Pricing & Payment */}
            <div className="space-y-5">
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing & Payment
              </h3>

              {/* USD Price Input */}
              <div className="space-y-2">
                <Label htmlFor="nft-usd-price">Price (USD) *</Label>
                <div className="relative max-w-[200px]">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium text-sm">
                    $
                  </span>
                  <Input
                    id="nft-usd-price"
                    data-ocid="nft.usd_price.input"
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={usdPrice}
                    onChange={(e) => setUsdPrice(e.target.value)}
                    placeholder="10.00"
                    disabled={isLoading}
                    className="pl-7"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Set your price in USD — it will be converted to the chosen
                  payment token at mint time.
                </p>
              </div>

              {/* ICP Conversion Box — always visible */}
              <div className="rounded-lg border bg-muted/30 p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">ICP Equivalent</span>
                  <button
                    type="button"
                    data-ocid="nft.icp_rate.refresh_button"
                    onClick={loadICPRate}
                    disabled={isFetchingRate}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    title="Refresh ICP rate"
                  >
                    <RefreshCw
                      className={`h-3.5 w-3.5 ${isFetchingRate ? "animate-spin" : ""}`}
                    />
                  </button>
                </div>
                {isFetchingRate ? (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching
                    live rate…
                  </p>
                ) : icpRate ? (
                  <>
                    <p className="text-lg font-semibold">
                      {icpEquivalent ? `${icpEquivalent} ICP` : "—"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      1 ICP ≈ ${icpRate.toFixed(2)} USD (live rate)
                    </p>
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    Rate unavailable — enter price manually if paying in ICP.
                  </p>
                )}
              </div>

              {/* Payment Method Selection — no default */}
              <div className="space-y-3">
                <Label>Payment Method *</Label>
                <p className="text-xs text-muted-foreground -mt-1">
                  Select how buyers will pay for this NFT. No payment method is
                  pre-selected.
                </p>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PAYMENT_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      data-ocid={`nft.payment.${option.value}.radio`}
                      disabled={isLoading}
                      onClick={() =>
                        setPaymentMethod(option.value as PaymentMethod)
                      }
                      className={`flex items-center gap-2 rounded-lg border p-3 text-left text-sm transition-all ${
                        paymentMethod === option.value
                          ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      <div
                        className={`h-3.5 w-3.5 shrink-0 rounded-full border-2 ${
                          paymentMethod === option.value
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/40"
                        }`}
                      />
                      <div className="min-w-0">
                        <p className="font-semibold truncate">
                          {option.symbol}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {option.isICP ? "Native ICP token" : "Stablecoin"}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
                {paymentMethod === "" && (
                  <p className="text-xs text-amber-500">
                    Please select a payment method to continue.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="royalty">
                  Royalty Percentage: {royaltyPercentage}%
                </Label>
                <Slider
                  id="royalty"
                  min={0}
                  max={100}
                  step={1}
                  value={[royaltyPercentage]}
                  onValueChange={(value) => setRoyaltyPercentage(value[0])}
                  disabled={isLoading}
                  className="py-4"
                />
                <p className="text-xs text-muted-foreground">
                  Royalty percentage for secondary sales (0–100%)
                </p>
              </div>
            </div>

            <Separator />

            {/* Revenue Splits */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Revenue Splits</h3>
                  <p className="text-sm text-muted-foreground">
                    Define multiple wallet addresses and their percentage shares
                  </p>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addRevenueSplit}
                  disabled={isLoading}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Split
                </Button>
              </div>

              <div className="space-y-3">
                {revenueSplits.map((split, index) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: revenue splits have no stable id
                  <Card key={`split-${index}`}>
                    <CardContent className="pt-4">
                      <div className="flex gap-3">
                        <div className="flex-1 space-y-2">
                          <Label htmlFor={`address-${index}`}>
                            Wallet Address *
                          </Label>
                          <Input
                            id={`address-${index}`}
                            value={split.address}
                            onChange={(e) =>
                              updateRevenueSplit(
                                index,
                                "address",
                                e.target.value,
                              )
                            }
                            placeholder="Enter principal ID or wallet address"
                            disabled={isLoading}
                          />
                        </div>
                        <div className="w-32 space-y-2">
                          <Label htmlFor={`percentage-${index}`}>
                            Percentage *
                          </Label>
                          <Input
                            id={`percentage-${index}`}
                            type="number"
                            min="0"
                            max="100"
                            step="0.01"
                            value={split.percentage}
                            onChange={(e) =>
                              updateRevenueSplit(
                                index,
                                "percentage",
                                e.target.value,
                              )
                            }
                            placeholder="0"
                            disabled={isLoading}
                          />
                        </div>
                        {revenueSplits.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeRevenueSplit(index)}
                            disabled={isLoading}
                            className="mt-8"
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {!isValidPercentage && (
                <Alert variant="destructive">
                  <AlertDescription>
                    Revenue split percentages must total 100%. Current total:{" "}
                    {totalPercentage.toFixed(2)}%
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Separator />

            {/* Summary */}
            <Card className="border-primary/50 bg-primary/5">
              <CardHeader>
                <CardTitle className="text-base">Minting Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">NFT Type:</span>
                  <span className="font-medium">
                    {getMintTypeLabel(mintType)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Edition:</span>
                  <span className="font-medium flex items-center gap-1.5">
                    {editionType === "1of1" ? (
                      <>
                        <Crown className="h-3.5 w-3.5 text-amber-500" />1 of 1
                      </>
                    ) : (
                      <>
                        <Layers className="h-3.5 w-3.5 text-primary" />
                        {editionCount} copies
                      </>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">USD Price:</span>
                  <span className="font-medium">${usdPrice || "—"}</span>
                </div>
                {paymentMethod === "icp" && icpEquivalent && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      ICP Equivalent:
                    </span>
                    <span className="font-medium">{icpEquivalent} ICP</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payment Method:</span>
                  <span className="font-medium">
                    {selectedPayment ? (
                      selectedPayment.symbol
                    ) : (
                      <span className="text-amber-500">Not selected</span>
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Royalty:</span>
                  <span className="font-medium">{royaltyPercentage}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Revenue Splits:</span>
                  <span className="font-medium">
                    {revenueSplits.length} address(es)
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleMint} disabled={!canSubmit}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Minting...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {mintButtonLabel()}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CheckCircle2, Coins, Loader2, Tag, X } from "lucide-react";
import { useState } from "react";
import { useDelistNFT, useListNFTForSale } from "../hooks/useQueries";

const PAYMENT_METHODS = [
  { value: "ICP", label: "ICP Token" },
  { value: "stablecoin", label: "Stablecoin" },
] as const;

const STABLECOINS = [
  { value: "USDC", label: "USDC" },
  { value: "ckUSDC", label: "ckUSDC" },
  { value: "TUSD", label: "TUSD" },
  { value: "RLUSD", label: "RLUSD" },
  { value: "USDE", label: "USDE" },
  { value: "USDP", label: "USDP" },
] as const;

// ===== LIST FOR SALE DIALOG =====
export function ListForSaleDialog({
  open,
  onOpenChange,
  collectionTokenIds,
  nftTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  collectionTokenIds: bigint[];
  nftTitle: string;
}) {
  const [price, setPrice] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"" | "ICP" | "stablecoin">(
    "",
  );
  const [selectedStablecoin, setSelectedStablecoin] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [listingProgress, setListingProgress] = useState(0);
  const listMutation = useListNFTForSale();

  const resolvedToken =
    paymentMethod === "stablecoin" ? selectedStablecoin : paymentMethod;

  const priceLabel =
    paymentMethod === "stablecoin" && selectedStablecoin
      ? `Price (${selectedStablecoin})`
      : paymentMethod === "ICP"
        ? "Price (ICP)"
        : "Price";

  const pricePlaceholder = paymentMethod === "ICP" ? "0.1000" : "10.00";

  const isValid =
    !!paymentMethod &&
    (paymentMethod === "ICP" || !!selectedStablecoin) &&
    !Number.isNaN(Number.parseFloat(price)) &&
    Number.parseFloat(price) > 0;

  const handleList = async () => {
    if (!isValid) return;
    const priceNum = Number.parseFloat(price);
    const priceE8s = BigInt(Math.round(priceNum * 1e8));
    const toList = collectionTokenIds.slice(0, quantity);
    setListingProgress(0);
    for (let i = 0; i < toList.length; i++) {
      await listMutation.mutateAsync({
        tokenId: toList[i],
        priceE8s,
        paymentToken: resolvedToken || undefined,
      });
      setListingProgress(i + 1);
    }
    onOpenChange(false);
    setPrice("");
    setPaymentMethod("");
    setSelectedStablecoin("");
    setQuantity(1);
    setListingProgress(0);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        data-ocid="nft.list_for_sale.dialog"
        className="sm:max-w-sm"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-primary" />
            List NFT for Sale
          </DialogTitle>
          <DialogDescription>
            Set your asking price for &ldquo;{nftTitle}&rdquo;. Ownership
            transfers on-chain when a buyer claims the NFT.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((method) => (
                <button
                  key={method.value}
                  type="button"
                  data-ocid={`nft.payment_method.${method.value.toLowerCase()}.toggle`}
                  onClick={() => {
                    setPaymentMethod(method.value);
                    if (method.value !== "stablecoin")
                      setSelectedStablecoin("");
                  }}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all ${
                    paymentMethod === method.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                  disabled={listMutation.isPending}
                >
                  <Coins className="h-3.5 w-3.5" />
                  {method.label}
                </button>
              ))}
            </div>
          </div>

          {/* Stablecoin selector */}
          {paymentMethod === "stablecoin" && (
            <div className="space-y-2">
              <Label>Stablecoin</Label>
              <Select
                value={selectedStablecoin}
                onValueChange={setSelectedStablecoin}
                disabled={listMutation.isPending}
              >
                <SelectTrigger data-ocid="nft.stablecoin.select">
                  <SelectValue placeholder="Select stablecoin…" />
                </SelectTrigger>
                <SelectContent>
                  {STABLECOINS.map((coin) => (
                    <SelectItem key={coin.value} value={coin.value}>
                      {coin.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Price */}
          {paymentMethod && (
            <div className="space-y-2">
              <Label htmlFor="list-price">{priceLabel}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                  {resolvedToken || paymentMethod}
                </span>
                <Input
                  id="list-price"
                  data-ocid="nft.list_price.input"
                  type="number"
                  min="0.0001"
                  step="0.0001"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder={pricePlaceholder}
                  className="pl-16"
                  disabled={listMutation.isPending}
                />
              </div>
            </div>
          )}
        </div>

        {/* Quantity */}
        {collectionTokenIds.length > 1 && (
          <div className="space-y-2">
            <Label htmlFor="list-quantity">
              Quantity to List (max {collectionTokenIds.length})
            </Label>
            <Input
              id="list-quantity"
              data-ocid="nft.list_quantity.input"
              type="number"
              min={1}
              max={collectionTokenIds.length}
              value={quantity}
              onChange={(e) =>
                setQuantity(
                  Math.min(
                    collectionTokenIds.length,
                    Math.max(1, Number.parseInt(e.target.value) || 1),
                  ),
                )
              }
              disabled={listMutation.isPending}
            />
          </div>
        )}
        <DialogFooter>
          <Button
            data-ocid="nft.list_for_sale.cancel_button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={listMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            data-ocid="nft.list_for_sale.confirm_button"
            onClick={handleList}
            disabled={!isValid || listMutation.isPending}
          >
            {listMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {quantity > 1
                  ? `Listing ${listingProgress}/${quantity}…`
                  : "Listing…"}
              </>
            ) : (
              <>
                <Tag className="mr-2 h-4 w-4" />
                {quantity > 1 ? `List ${quantity} for Sale` : "List for Sale"}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ===== DELIST BUTTON =====
export function DelistButton({
  tokenId,
  nftTitle,
}: { tokenId: bigint; nftTitle: string }) {
  const delistMutation = useDelistNFT();

  return (
    <Button
      data-ocid="nft.delist.button"
      variant="outline"
      size="sm"
      className="border-destructive/50 text-destructive hover:bg-destructive/10"
      disabled={delistMutation.isPending}
      onClick={() => delistMutation.mutate(tokenId)}
      title={`Remove listing for ${nftTitle}`}
    >
      {delistMutation.isPending ? (
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
      ) : (
        <X className="h-3.5 w-3.5 mr-1.5" />
      )}
      Delist
    </Button>
  );
}

// ===== LISTING STATUS BADGE =====
export function ListingBadge({ priceE8s }: { priceE8s: bigint }) {
  const priceIcp = Number(priceE8s) / 1e8;
  return (
    <Badge className="bg-green-500/15 text-green-600 dark:text-green-400 border-green-500/30 text-xs">
      <Tag className="h-3 w-3 mr-1" />
      {priceIcp.toFixed(4)} ICP
    </Badge>
  );
}

// ===== MINT SUCCESS BANNER =====
export function MintSuccessBanner({
  tokenId,
  onDismiss,
}: {
  tokenId: bigint;
  onDismiss: () => void;
}) {
  return (
    <div
      data-ocid="nft.mint.success_state"
      className="flex items-start gap-3 rounded-xl border border-green-500/30 bg-green-500/10 p-4"
    >
      <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-green-700 dark:text-green-400">
          NFT Minted On-Chain!
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Token ID:{" "}
          <span className="font-mono font-bold text-foreground">
            #{tokenId.toString()}
          </span>
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Your NFT is now recorded on the Internet Computer. Find it in{" "}
          <strong>Music Mints → My Mints</strong> to list it for sale or
          transfer it.
        </p>
      </div>
      <button
        type="button"
        onClick={onDismiss}
        className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Dismiss"
      >
        ✕
      </button>
    </div>
  );
}

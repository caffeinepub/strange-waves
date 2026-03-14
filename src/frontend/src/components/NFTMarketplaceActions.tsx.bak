import { Alert, AlertDescription } from "@/components/ui/alert";
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
import { AlertCircle, CheckCircle2, Loader2, Tag, X } from "lucide-react";
import { useState } from "react";
import { useDelistNFT, useListNFTForSale } from "../hooks/useQueries";

// ===== LIST FOR SALE DIALOG =====
export function ListForSaleDialog({
  open,
  onOpenChange,
  tokenId,
  nftTitle,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tokenId: bigint;
  nftTitle: string;
}) {
  const [priceIcp, setPriceIcp] = useState("");
  const listMutation = useListNFTForSale();

  const handleList = async () => {
    const priceNum = Number.parseFloat(priceIcp);
    if (Number.isNaN(priceNum) || priceNum <= 0) return;
    const priceE8s = BigInt(Math.round(priceNum * 1e8));
    await listMutation.mutateAsync({ tokenId, priceE8s });
    onOpenChange(false);
    setPriceIcp("");
  };

  const isValid =
    !Number.isNaN(Number.parseFloat(priceIcp)) &&
    Number.parseFloat(priceIcp) > 0;

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
            Set a price in ICP for &ldquo;{nftTitle}&rdquo;. Ownership transfers
            on-chain when claimed.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="list-price">Price (ICP)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-medium text-muted-foreground">
                ICP
              </span>
              <Input
                id="list-price"
                data-ocid="nft.list_price.input"
                type="number"
                min="0.0001"
                step="0.0001"
                value={priceIcp}
                onChange={(e) => setPriceIcp(e.target.value)}
                placeholder="1.0000"
                className="pl-12"
                disabled={listMutation.isPending}
              />
            </div>
          </div>

          <Alert className="border-amber-500/40 bg-amber-500/5">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <AlertDescription className="text-xs text-amber-700 dark:text-amber-400">
              Full ICP payment integration is coming soon. Listing transfers
              on-chain ownership permanently when a buyer claims the NFT.
            </AlertDescription>
          </Alert>
        </div>

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
                Listing…
              </>
            ) : (
              <>
                <Tag className="mr-2 h-4 w-4" />
                List for Sale
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

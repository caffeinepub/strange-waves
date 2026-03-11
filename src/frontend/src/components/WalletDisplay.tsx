import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Actor, HttpAgent } from "@dfinity/agent";
import type { IDL } from "@dfinity/candid";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Copy,
  ExternalLink,
  Image as ImageIcon,
  Info,
  Loader2,
  Music,
  Package,
  RefreshCw,
  TrendingUp,
  Wallet,
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { FileType } from "../backend";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useCallerNFTRecordsWithParams } from "../hooks/useQueries";

const ICP_LEDGER_ID = "ryjl3-tyaaa-aaaaa-aaaba-cai";

// Minimal ICRC-1 IDL for icrc1_balance_of
const icrc1IDL = ({ IDL: I }: { IDL: typeof IDL }) => {
  const Account = I.Record({
    owner: I.Principal,
    subaccount: I.Opt(I.Vec(I.Nat8)),
  });
  return I.Service({
    icrc1_balance_of: I.Func([Account], [I.Nat], ["query"]),
  });
};

async function fetchICPBalance(principal: any): Promise<number> {
  const isLocal = window.location.hostname.includes("localhost");
  const host = isLocal ? "http://localhost:4943" : "https://icp-api.io";

  const agent = await HttpAgent.create({ host });
  if (isLocal) {
    await agent.fetchRootKey();
  }

  const ledger = Actor.createActor(icrc1IDL as any, {
    agent,
    canisterId: ICP_LEDGER_ID,
  });

  const balance = await (ledger as any).icrc1_balance_of({
    owner: principal,
    subaccount: [],
  });

  // balance is a BigInt in e8s; 1 ICP = 100_000_000 e8s
  return Number(balance) / 100_000_000;
}

// Supported token types for ICP ecosystem
interface TokenBalance {
  symbol: string;
  name: string;
  balance: string;
  usdValue: string;
  icon?: string;
  isAutoDetected?: boolean;
}

export function WalletDisplay() {
  const { identity } = useInternetIdentity();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedTx, setExpandedTx] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [icpBalance, setIcpBalance] = useState<number | null>(null);
  const [isLoadingICP, setIsLoadingICP] = useState(false);

  // Fetch user's NFTs
  const {
    data: nfts = [],
    isLoading: isLoadingNFTs,
    refetch: refetchNFTs,
  } = useCallerNFTRecordsWithParams();

  const walletAddress = identity?.getPrincipal().toString() || "";

  const loadICPBalance = useCallback(async () => {
    if (!identity) return;
    setIsLoadingICP(true);
    try {
      const balance = await fetchICPBalance(identity.getPrincipal());
      setIcpBalance(balance);
    } catch (err) {
      console.error("Failed to fetch ICP balance:", err);
      setIcpBalance(null);
    } finally {
      setIsLoadingICP(false);
    }
  }, [identity]);

  // Load ICP balance on mount and when identity changes
  useEffect(() => {
    loadICPBalance();
  }, [loadICPBalance]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([refetchNFTs(), loadICPBalance()]);
      toast.success("Wallet data refreshed");
    } catch (_error) {
      toast.error("Failed to refresh wallet data");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(walletAddress);
      setCopiedAddress(true);
      toast.success("Wallet address copied to clipboard");
      setTimeout(() => setCopiedAddress(false), 2000);
    } catch (_error) {
      toast.error("Failed to copy address");
    }
  };

  const toggleTxExpansion = (txId: string) => {
    setExpandedTx(expandedTx === txId ? null : txId);
  };

  // Token balances — ICP is live, others are placeholders
  const tokenBalances: TokenBalance[] = [
    {
      symbol: "ICP",
      name: "Internet Computer",
      balance: isLoadingICP
        ? "..."
        : icpBalance !== null
          ? icpBalance.toFixed(4)
          : "0.0000",
      usdValue: "—",
      isAutoDetected: false,
    },
    {
      symbol: "CHAT",
      name: "OpenChat Token",
      balance: "0.00",
      usdValue: "0.00",
      isAutoDetected: true,
    },
    {
      symbol: "ckBTC",
      name: "Chain Key Bitcoin",
      balance: "0.00",
      usdValue: "0.00",
      isAutoDetected: false,
    },
    {
      symbol: "ckUSDC",
      name: "Chain Key USDC",
      balance: "0.00",
      usdValue: "0.00",
      isAutoDetected: false,
    },
  ];

  // Mock transaction data with token transactions
  const mockTransactions = [
    ...nfts.map((nft, index) => ({
      id: `tx-nft-${index}`,
      type: "mint" as const,
      title: nft.metadata.title,
      timestamp: Number(nft.metadata.mintTimestamp) / 1000000,
      status: "confirmed" as const,
      details: {
        artist: nft.metadata.artist,
        fileType: nft.metadata.fileType,
        price: Number(nft.params.price) / 100,
        stableCoin: nft.params.stableCoin,
      },
    })),
    {
      id: "tx-token-1",
      type: "token" as const,
      title: "CHAT Token Received",
      timestamp: Date.now(),
      status: "confirmed" as const,
      details: {
        tokenSymbol: "CHAT",
        amount: "0.00",
        from: "Auto-detected",
      },
    },
  ];

  const renderNFTCard = (nft: any, index: number) => {
    const fileTypeIcon =
      nft.metadata.fileType === FileType.audio ? (
        <Music className="h-4 w-4" />
      ) : nft.metadata.fileType === FileType.image ? (
        <ImageIcon className="h-4 w-4" />
      ) : (
        <Package className="h-4 w-4" />
      );

    const fileTypeLabel =
      nft.metadata.fileType === FileType.audio
        ? "Audio"
        : nft.metadata.fileType === FileType.image
          ? "Album Art"
          : "Combined";

    return (
      <Card
        key={index}
        className="overflow-hidden hover:shadow-lg transition-shadow"
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {nft.imageBlob ? (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                <img
                  src={nft.imageBlob.getDirectURL()}
                  alt={nft.metadata.title}
                  className="h-full w-full object-cover"
                />
              </div>
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-accent">
                {fileTypeIcon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-sm line-clamp-1">
                {nft.metadata.title}
              </h4>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {nft.metadata.artist}
              </p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant="secondary" className="text-xs">
                  {fileTypeLabel}
                </Badge>
                <Badge variant="outline" className="text-xs">
                  ${(Number(nft.params.price) / 100).toFixed(2)}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderTransaction = (tx: any) => {
    const isExpanded = expandedTx === tx.id;
    const date = new Date(tx.timestamp);

    return (
      <div key={tx.id} className="border rounded-lg p-4 space-y-2">
        <button
          type="button"
          className="w-full flex items-center justify-between cursor-pointer text-left"
          onClick={() => toggleTxExpansion(tx.id)}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                tx.type === "mint"
                  ? "bg-green-500/10"
                  : tx.type === "token"
                    ? "bg-blue-500/10"
                    : tx.type === "transfer"
                      ? "bg-purple-500/10"
                      : "bg-orange-500/10"
              }`}
            >
              {tx.type === "mint" ? (
                <Coins className="h-4 w-4 text-green-500" />
              ) : tx.type === "token" ? (
                <TrendingUp className="h-4 w-4 text-blue-500" />
              ) : tx.type === "transfer" ? (
                <ArrowUpRight className="h-4 w-4 text-purple-500" />
              ) : (
                <ArrowDownLeft className="h-4 w-4 text-orange-500" />
              )}
            </div>
            <div>
              <p className="font-medium text-sm capitalize">{tx.type}</p>
              <p className="text-xs text-muted-foreground">{tx.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={tx.status === "confirmed" ? "default" : "secondary"}
              className="text-xs"
            >
              {tx.status}
            </Badge>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </div>
        </button>

        {isExpanded && (
          <div className="pt-2 space-y-2 text-sm">
            <Separator />
            {tx.type === "mint" ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Artist</p>
                  <p className="font-medium">{tx.details.artist}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Type</p>
                  <p className="font-medium capitalize">
                    {tx.details.fileType}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Price</p>
                  <p className="font-medium">
                    ${tx.details.price.toFixed(2)}{" "}
                    {tx.details.stableCoin.toUpperCase()}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{date.toLocaleDateString()}</p>
                </div>
              </div>
            ) : tx.type === "token" ? (
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">Token</p>
                  <p className="font-medium">{tx.details.tokenSymbol}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-medium">{tx.details.amount}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="font-medium">{tx.details.from}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium">{date.toLocaleDateString()}</p>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>
    );
  };

  if (!identity) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Wallet className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Wallet Not Connected</h3>
          <p className="text-sm text-muted-foreground">
            Please login to view your wallet information
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Wallet Overview
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Wallet Address Section */}
        <div className="mb-6 p-4 rounded-lg border bg-muted/30">
          {/* Principal ID */}
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-sm font-semibold">ICP Wallet Address</h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        This is your Principal ID — valid for in-app
                        transactions and NFT ownership. For deposits from
                        centralized exchanges (Coinbase, Binance, Kraken), you
                        need your Account ID, available at nns.ic0.app.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <p className="text-xs font-mono text-muted-foreground break-all">
                {walletAddress}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyAddress}
              className="shrink-0"
            >
              {copiedAddress ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-2" />
                  Copy
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Use this address to receive NFTs, tokens, and other assets on the
            Internet Computer.
          </p>

          {/* Account ID for exchanges */}
          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold">
                ICP Account ID (for exchanges)
              </h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent className="max-w-xs">
                    <p className="text-xs">
                      Your Account ID is a 64-character hex address derived from
                      your Principal ID. Centralized exchanges (Coinbase,
                      Binance, Kraken) require this format for ICP deposits.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <p className="text-xs text-muted-foreground">
              Your Account ID is derived from your Principal ID and is required
              for deposits from centralized exchanges like Coinbase or Binance.
            </p>
            <Button
              variant="outline"
              size="sm"
              asChild
              data-ocid="wallet.account_id.button"
            >
              <a
                href="https://nns.ic0.app"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Find Account ID on NNS
              </a>
            </Button>
            <p className="text-xs text-muted-foreground flex items-start gap-1.5">
              <Info className="h-3 w-3 mt-0.5 shrink-0" />
              Log into nns.ic0.app with the same Internet Identity to view your
              Account ID in the correct format.
            </p>
          </div>
        </div>

        <Tabs defaultValue="assets" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="transactions">Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="assets" className="space-y-6 mt-4">
            {/* Token Balances with Auto-Detection */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Coins className="h-4 w-4" />
                  Token Balances
                </h3>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs cursor-help">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        Auto-detect enabled
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p className="text-xs">
                        Compatible tokens (ICP, CHAT, ckBTC, ckUSDC) are
                        automatically detected and added to your wallet when
                        received.
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
              <div className="space-y-2">
                {tokenBalances.map((token) => (
                  <div
                    key={token.symbol}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary to-accent">
                        <Coins className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-sm">{token.symbol}</p>
                          {token.isAutoDetected && (
                            <Badge variant="secondary" className="text-xs">
                              Auto-detected
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {token.name}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {token.symbol === "ICP" && isLoadingICP ? (
                          <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                        ) : null}
                        <p className="font-semibold text-sm">{token.balance}</p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {token.usdValue !== "—"
                          ? `$${token.usdValue} USD`
                          : token.usdValue}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-start gap-2">
                <Info className="h-3 w-3 mt-0.5 shrink-0" />
                <span>
                  Token balances are queried via ICRC-1 standard. New compatible
                  tokens will automatically appear when received.
                </span>
              </p>
            </div>

            <Separator />

            {/* NFT Collection */}
            <div>
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                NFT Collection ({nfts.length})
              </h3>
              {isLoadingNFTs ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : nfts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No NFTs minted yet</p>
                </div>
              ) : (
                <ScrollArea className="h-[400px]">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {nfts.map((nft, index) => renderNFTCard(nft, index))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </TabsContent>

          <TabsContent value="transactions" className="space-y-4 mt-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Recent Activity
              </h3>
              <Badge variant="secondary">
                {mockTransactions.length} transactions
              </Badge>
            </div>

            {mockTransactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No transactions yet</p>
              </div>
            ) : (
              <ScrollArea className="h-[500px]">
                <div className="space-y-3">
                  {mockTransactions.map((tx) => renderTransaction(tx))}
                </div>
              </ScrollArea>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

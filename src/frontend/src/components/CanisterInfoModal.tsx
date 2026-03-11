import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useQueryClient } from "@tanstack/react-query";
import { Check, Copy, ExternalLink, Info, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface CanisterInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CanisterInfoModal({
  open,
  onOpenChange,
}: CanisterInfoModalProps) {
  const { clear, identity } = useInternetIdentity();
  const queryClient = useQueryClient();
  const [copiedPrincipal, setCopiedPrincipal] = useState(false);
  const [copiedCanister, setCopiedCanister] = useState(false);

  // Get canister ID from environment
  const getCanisterId = (): string => {
    try {
      // Try to get from environment variables
      if (typeof window !== "undefined") {
        // Check for canister ID in window object (set by vite)
        const canisterId =
          (window as any).BACKEND_CANISTER_ID ||
          (import.meta as any).env?.VITE_BACKEND_CANISTER_ID ||
          (import.meta as any).env?.CANISTER_ID_BACKEND;

        if (canisterId) return canisterId;
      }

      // Fallback: try to extract from current URL
      const hostname = window.location.hostname;
      if (
        hostname.includes(".localhost") ||
        hostname.includes(".ic0.app") ||
        hostname.includes(".raw.ic0.app")
      ) {
        const parts = hostname.split(".");
        if (parts.length > 0 && parts[0].length > 10) {
          return parts[0];
        }
      }

      return "Not available";
    } catch (error) {
      console.error("Error loading canister ID:", error);
      return "Error loading ID";
    }
  };

  // Get principal ID from identity
  const getPrincipalId = (): string => {
    try {
      if (!identity) {
        return "Not available";
      }
      return identity.getPrincipal().toString();
    } catch (error) {
      console.error("Error loading principal ID:", error);
      return "Error loading ID";
    }
  };

  const canisterId = getCanisterId();
  const principalId = getPrincipalId();
  const isAuthenticated = !!identity;

  const handleCopyPrincipal = async () => {
    try {
      await navigator.clipboard.writeText(principalId);
      setCopiedPrincipal(true);
      toast.success("Principal ID copied to clipboard");
      setTimeout(() => setCopiedPrincipal(false), 2000);
    } catch (error) {
      console.error("Failed to copy principal ID:", error);
      toast.error("Failed to copy principal ID");
    }
  };

  const handleCopyCanister = async () => {
    try {
      await navigator.clipboard.writeText(canisterId);
      setCopiedCanister(true);
      toast.success("Canister ID copied to clipboard");
      setTimeout(() => setCopiedCanister(false), 2000);
    } catch (error) {
      console.error("Failed to copy canister ID:", error);
      toast.error("Failed to copy canister ID");
    }
  };

  const handleDisconnect = async () => {
    try {
      await clear();
      queryClient.clear();
      toast.success("Disconnected successfully");
      onOpenChange(false);
    } catch (error: any) {
      console.error("Disconnect error:", error);
      toast.error(error.message || "Failed to disconnect");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="canister-info-description"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Canister Information
          </DialogTitle>
          <DialogDescription id="canister-info-description">
            View and manage your canister connection
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Signed-in Principal ID Section */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Signed-in Principal ID
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono break-all">
                {isAuthenticated ? principalId : "Not available"}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyPrincipal}
                disabled={
                  !isAuthenticated ||
                  principalId === "Not available" ||
                  principalId === "Error loading ID"
                }
                aria-label="Copy principal ID"
                className="shrink-0"
              >
                {copiedPrincipal ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {copiedPrincipal && (
              <p className="text-xs text-green-600 animate-in fade-in">
                Copied to clipboard!
              </p>
            )}
          </div>

          {/* Account ID for exchanges — only shown when signed in */}
          {isAuthenticated && (
            <>
              <Separator />
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">
                  ICP Account ID (for exchanges)
                </p>
                <p className="text-xs text-muted-foreground">
                  Your Account ID is derived from your Principal ID and is
                  required for deposits from centralized exchanges like Coinbase
                  or Binance.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  data-ocid="canister_info.account_id.button"
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
                  Log into nns.ic0.app with the same Internet Identity to view
                  your Account ID in the correct format.
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Backend Canister ID Section */}
          <div className="space-y-2">
            <p className="text-sm font-medium text-muted-foreground">
              Backend Canister ID
            </p>
            <div className="flex items-center gap-2">
              <div className="flex-1 rounded-md border bg-muted/50 px-3 py-2 text-sm font-mono break-all">
                {canisterId}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopyCanister}
                disabled={
                  canisterId === "Not available" ||
                  canisterId === "Error loading ID"
                }
                aria-label="Copy canister ID"
                className="shrink-0"
              >
                {copiedCanister ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            {copiedCanister && (
              <p className="text-xs text-green-600 animate-in fade-in">
                Copied to clipboard!
              </p>
            )}
          </div>

          {/* Connection Status */}
          {isAuthenticated && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">
                Connection Status
              </p>
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm">Connected</span>
              </div>
            </div>
          )}

          {/* Disconnect Button */}
          {isAuthenticated && (
            <div className="pt-2">
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                className="w-full"
                data-ocid="canister_info.delete_button"
              >
                Disconnect Wallet
              </Button>
            </div>
          )}
        </div>

        {/* Close button */}
        <button
          type="button"
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none"
          aria-label="Close"
          data-ocid="canister_info.close_button"
        >
          <X className="h-4 w-4" />
        </button>
      </DialogContent>
    </Dialog>
  );
}

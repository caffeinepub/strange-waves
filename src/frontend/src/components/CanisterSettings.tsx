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
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

interface CanisterSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CanisterSettings({
  open,
  onOpenChange,
}: CanisterSettingsProps) {
  const [canisterId, setCanisterId] = useState("");
  const [savedCanisterId, setSavedCanisterId] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load saved canister ID from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("liveCanisterId");
    if (saved) {
      setSavedCanisterId(saved);
      setCanisterId(saved);
      setIsConnected(true);
    }
  }, []);

  const handleSave = async () => {
    if (!canisterId.trim()) {
      return;
    }

    setIsSaving(true);

    // Simulate validation/connection check
    await new Promise((resolve) => setTimeout(resolve, 500));

    try {
      localStorage.setItem("liveCanisterId", canisterId.trim());
      setSavedCanisterId(canisterId.trim());
      setIsConnected(true);
      console.log("Live canister ID saved:", canisterId.trim());
    } catch (error) {
      console.error("Failed to save canister ID:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem("liveCanisterId");
    setCanisterId("");
    setSavedCanisterId("");
    setIsConnected(false);
    console.log("Live canister ID cleared");
  };

  const handleClose = () => {
    // Reset to saved value if user closes without saving
    setCanisterId(savedCanisterId);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Canister Settings</DialogTitle>
          <DialogDescription>
            Configure the live canister link for backend synchronization.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Connection Status */}
          <div className="flex items-center gap-2 rounded-lg border p-3">
            {isConnected ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span className="text-sm font-medium">Connected</span>
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-muted-foreground" />
                <span className="text-sm font-medium text-muted-foreground">
                  Not Connected
                </span>
              </>
            )}
          </div>

          {/* Canister ID Input */}
          <div className="space-y-2">
            <Label htmlFor="canister-id">Live Canister ID</Label>
            <Input
              id="canister-id"
              placeholder="Enter canister ID (e.g., rrkah-fqaaa-aaaaa-aaaaq-cai)"
              value={canisterId}
              onChange={(e) => setCanisterId(e.target.value)}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Enter the canister ID of your live backend deployment.
            </p>
          </div>

          {/* Current Saved ID Display */}
          {savedCanisterId && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">
                Current Saved ID
              </Label>
              <div className="rounded-md bg-muted p-2">
                <code className="text-xs break-all">{savedCanisterId}</code>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={handleClear}
            disabled={!savedCanisterId || isSaving}
          >
            Clear
          </Button>
          <Button
            onClick={handleSave}
            disabled={
              !canisterId.trim() || canisterId === savedCanisterId || isSaving
            }
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { Disc3, Info, Menu, Settings } from "lucide-react";
import { useState } from "react";
import type { AlbumView } from "../backend";
import { useListAlbums } from "../hooks/useQueries";
import { CanisterInfoModal } from "./CanisterInfoModal";
import { CanisterSettings } from "./CanisterSettings";
import { ErrorBoundary } from "./ErrorBoundary";
import { LoginButton } from "./LoginButton";
import { ThemeToggle } from "./ThemeToggle";

// Fallback uses the backend's actual ID (underscore, matching migration.mo)
const SSCC_FALLBACK: AlbumView = {
  id: "sscc_collection",
  name: "SScc Collection",
  description: "",
  theme: "",
  trackIds: [],
  listenerTier: {
    name: "",
    description: "",
    supply: BigInt(0),
    price: BigInt(0),
  },
  collectorTier: {
    name: "",
    description: "",
    supply: BigInt(0),
    price: BigInt(0),
  },
  investorTier: {
    name: "",
    description: "",
    supply: BigInt(0),
    price: BigInt(0),
  },
  creationTimestamp: BigInt(0),
};

interface HeaderProps {
  onNavigate?: (page: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const [canisterModalOpen, setCanisterModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: albums, isLoading: albumsLoading } = useListAlbums();

  // Sort albums so SScc Collection appears first; always show at least the fallback
  const sortedAlbums: AlbumView[] = (() => {
    const list = albums && albums.length > 0 ? [...albums] : [SSCC_FALLBACK];
    // Ensure SScc Collection is first
    const ssccIdx = list.findIndex(
      (a) => a.id === "sscc_collection" || a.name === "SScc Collection",
    );
    if (ssccIdx > 0) {
      const [sscc] = list.splice(ssccIdx, 1);
      list.unshift(sscc);
    } else if (ssccIdx === -1) {
      list.unshift(SSCC_FALLBACK);
    }
    return list;
  })();

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Navigation Bar */}
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleNavigate("home")}
            className="text-lg font-semibold hover:text-primary transition-colors"
          >
            Strange Waves
          </button>
        </div>

        <div className="flex items-center gap-2">
          {/* Navigation Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem onClick={() => handleNavigate("about")}>
                About
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate("merch")}>
                Merch
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate("music-mints")}>
                Music Mints
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate("fan-connect")}>
                FAN Connect
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate("socials")}>
                Socials
              </DropdownMenuItem>

              {/* Albums Sub-menu */}
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="flex items-center gap-2">
                  <Disc3 className="h-4 w-4" />
                  <span>Albums</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-52">
                  {albumsLoading ? (
                    <>
                      {/* Always show SScc Collection even while loading */}
                      <DropdownMenuItem
                        onClick={() => handleNavigate("album/sscc_collection")}
                        className="flex items-center gap-2"
                      >
                        <Disc3 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">SScc Collection</span>
                      </DropdownMenuItem>
                      <div className="p-2 space-y-1">
                        <Skeleton className="h-7 w-full" />
                      </div>
                    </>
                  ) : (
                    sortedAlbums.map((album) => (
                      <DropdownMenuItem
                        key={album.id}
                        onClick={() => handleNavigate(`album/${album.id}`)}
                        className="flex items-center gap-2"
                      >
                        <Disc3 className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="truncate">{album.name}</span>
                      </DropdownMenuItem>
                    ))
                  )}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Settings Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setSettingsOpen(true)}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </Button>

          {/* Canister Info Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setCanisterModalOpen(true)}
            aria-label="Canister information"
          >
            <Info className="h-5 w-5" />
          </Button>

          <ThemeToggle />
          <ErrorBoundary>
            <LoginButton />
          </ErrorBoundary>
        </div>
      </div>

      {/* Canister Info Modal */}
      <CanisterInfoModal
        open={canisterModalOpen}
        onOpenChange={setCanisterModalOpen}
      />

      {/* Canister Settings Dialog */}
      <CanisterSettings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </header>
  );
}

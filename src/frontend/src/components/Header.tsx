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

const EMPTY_TIER = {
  name: "",
  description: "",
  supply: BigInt(0),
  price: BigInt(0),
};

const SSCC_FALLBACK: AlbumView = {
  id: "sscc_collection",
  name: "SScc Collection",
  description: "",
  theme: "",
  trackIds: [],
  listenerTier: EMPTY_TIER,
  collectorTier: EMPTY_TIER,
  investorTier: EMPTY_TIER,
  creationTimestamp: BigInt(0),
};

const KOTS_FALLBACK: AlbumView = {
  id: "knight_of_the_soul",
  name: "Knight of the Soul",
  description: "",
  theme: "",
  trackIds: [],
  listenerTier: EMPTY_TIER,
  collectorTier: EMPTY_TIER,
  investorTier: EMPTY_TIER,
  creationTimestamp: BigInt(0),
};

const MYSTIC_FIRE_FALLBACK: AlbumView = {
  id: "mystic_fire",
  name: "Mystic Fire",
  description: "",
  theme: "",
  trackIds: [],
  listenerTier: EMPTY_TIER,
  collectorTier: EMPTY_TIER,
  investorTier: EMPTY_TIER,
  creationTimestamp: BigInt(0),
};

const KRYPTO_BEATZ_FALLBACK: AlbumView = {
  id: "krypto_beatz",
  name: "Krypto Beatz",
  description: "",
  theme: "",
  trackIds: [],
  listenerTier: EMPTY_TIER,
  collectorTier: EMPTY_TIER,
  investorTier: EMPTY_TIER,
  creationTimestamp: BigInt(0),
};

const WELLNESS_WEDNESDAY_FALLBACK: AlbumView = {
  id: "wellness_wednesday",
  name: "Wellness Wednesday",
  description:
    "community as harmonic convergence for consciously aware individuals who seek to deepen their innerstanding and experience the profound fulfillment of the spirit through the boundless power of love, embracing a holistic path to well-being, exploring how to cultivate high vibrations in every facet of our lives",
  theme: "",
  trackIds: [],
  listenerTier: EMPTY_TIER,
  collectorTier: EMPTY_TIER,
  investorTier: EMPTY_TIER,
  creationTimestamp: BigInt(0),
};

const FALLBACK_ALBUMS = [
  SSCC_FALLBACK,
  KOTS_FALLBACK,
  MYSTIC_FIRE_FALLBACK,
  KRYPTO_BEATZ_FALLBACK,
  WELLNESS_WEDNESDAY_FALLBACK,
];

interface HeaderProps {
  onNavigate?: (page: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const [canisterModalOpen, setCanisterModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const { data: albums, isLoading: albumsLoading } = useListAlbums();

  // Merge backend albums with fallbacks, ensuring all known albums always appear
  const sortedAlbums: AlbumView[] = (() => {
    const list: AlbumView[] = albums && albums.length > 0 ? [...albums] : [];

    // Ensure SScc Collection is present
    if (
      !list.some(
        (a) => a.id === "sscc_collection" || a.name === "SScc Collection",
      )
    ) {
      list.unshift(SSCC_FALLBACK);
    }

    // Ensure Knight of the Soul is present
    if (
      !list.some(
        (a) => a.id === "knight_of_the_soul" || a.name === "Knight of the Soul",
      )
    ) {
      list.push(KOTS_FALLBACK);
    }

    // Ensure Mystic Fire is present
    if (!list.some((a) => a.id === "mystic_fire" || a.name === "Mystic Fire")) {
      list.push(MYSTIC_FIRE_FALLBACK);
    }

    // Ensure Krypto Beatz is present
    if (
      !list.some((a) => a.id === "krypto_beatz" || a.name === "Krypto Beatz")
    ) {
      list.push(KRYPTO_BEATZ_FALLBACK);
    }

    // Ensure Wellness Wednesday is present
    if (
      !list.some(
        (a) => a.id === "wellness_wednesday" || a.name === "Wellness Wednesday",
      )
    ) {
      list.push(WELLNESS_WEDNESDAY_FALLBACK);
    }

    // Sort: SScc first, then KOTS, then Mystic Fire, then Krypto Beatz, then Wellness Wednesday, then others
    return list.sort((a, b) => {
      const order = (x: AlbumView) =>
        x.id === "sscc_collection"
          ? 0
          : x.id === "knight_of_the_soul"
            ? 1
            : x.id === "mystic_fire"
              ? 2
              : x.id === "krypto_beatz"
                ? 3
                : x.id === "wellness_wednesday"
                  ? 4
                  : 5;
      return order(a) - order(b);
    });
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
                <DropdownMenuSubTrigger
                  className="flex items-center gap-2"
                  data-ocid="nav.albums.toggle"
                >
                  <Disc3 className="h-4 w-4" />
                  <span>Albums</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="w-52">
                  {albumsLoading ? (
                    <>
                      {FALLBACK_ALBUMS.map((fa) => (
                        <DropdownMenuItem
                          key={fa.id}
                          onClick={() => handleNavigate(`album/${fa.id}`)}
                          className="flex items-center gap-2"
                        >
                          <Disc3 className="h-3.5 w-3.5 text-primary shrink-0" />
                          <span className="truncate">{fa.name}</span>
                        </DropdownMenuItem>
                      ))}
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
                        data-ocid={`nav.album.${album.id}.link`}
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

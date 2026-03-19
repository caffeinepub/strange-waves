import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { AudioLibrary } from "./components/AudioLibrary";
import { AudioUploader } from "./components/AudioUploader";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { PersistentAudioPlayer } from "./components/PersistentAudioPlayer";
import { TrackPopupPlayer } from "./components/TrackPopupPlayer";
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from "./contexts/AudioPlayerContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  type CombinedAudio,
  useAudioFiles,
  usePlaylists,
} from "./hooks/useQueries";
import {
  logComponentError,
  logComponentInit,
  logComponentSuccess,
} from "./lib/diagnostics";
import { AboutPage } from "./pages/AboutPage";
import AlbumPage from "./pages/AlbumPage";
import { MusicMints } from "./pages/MusicMints";

function AppContent() {
  const [_appError, setAppError] = useState<Error | null>(null);
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>("home");

  useEffect(() => {
    logComponentInit("App");
    try {
      logComponentSuccess("App");
    } catch (error) {
      logComponentError("App", error as Error);
      setAppError(error as Error);
    }
  }, []);

  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { setTrack, openPopup, setTrackList } = useAudioPlayer();
  const { data: audioFiles = [] } = useAudioFiles();
  const { data: playlists = [] } = usePlaylists();

  // Guard so the URL ?track= auto-load only fires once
  const hasAutoLoadedRef = useRef(false);

  // Guard so the URL ?playlist= auto-load only fires once
  const hasAutoLoadedPlaylistRef = useRef(false);

  // Auto-load track from URL ?track= param on mount
  useEffect(() => {
    if (audioFiles.length === 0 || hasAutoLoadedRef.current) return;
    try {
      const trackId = new URLSearchParams(window.location.search).get("track");
      if (!trackId) {
        hasAutoLoadedRef.current = true;
        return;
      }
      const match = audioFiles.find((f) => f.id === trackId);
      if (match) {
        hasAutoLoadedRef.current = true;
        setTrackList(
          audioFiles.map((f) => ({ source: "local" as const, data: f })),
        );
        setTrack({ source: "local", data: match });
        setTimeout(() => {
          openPopup();
        }, 400);
      }
    } catch (err) {
      console.error("[App] Failed to auto-load shared track:", err);
    }
  }, [audioFiles, setTrack, openPopup, setTrackList]);

  // Auto-load playlist from URL ?playlist= param on mount
  useEffect(() => {
    if (
      audioFiles.length === 0 ||
      playlists.length === 0 ||
      hasAutoLoadedPlaylistRef.current
    )
      return;
    try {
      const playlistId = new URLSearchParams(window.location.search).get(
        "playlist",
      );
      if (!playlistId) return;
      const playlist = playlists.find((p) => p.id === playlistId);
      if (!playlist) return;

      const localTracks: CombinedAudio[] = playlist.trackIds.reduce(
        (acc: CombinedAudio[], id) => {
          const audioFile = audioFiles.find((f) => f.id === id);
          if (audioFile) acc.push({ source: "local", data: audioFile });
          return acc;
        },
        [],
      );

      const audiusTracks: CombinedAudio[] = playlist.audiusTracks.map((t) => ({
        source: "audius" as const,
        data: {
          id: t.id,
          title: t.title,
          duration: 0,
          artwork: t.artworkUrl
            ? { "150x150": t.artworkUrl, "480x480": t.artworkUrl }
            : undefined,
          user: { name: t.artist, handle: t.artist },
        },
      }));

      const combinedTracks: CombinedAudio[] = [...localTracks, ...audiusTracks];

      if (combinedTracks.length > 0) {
        hasAutoLoadedPlaylistRef.current = true;
        setTrackList(combinedTracks);
        setTrack(combinedTracks[0]);
        setTimeout(() => {
          openPopup();
        }, 400);
      }
    } catch (err) {
      console.error("[App] Failed to auto-load shared playlist:", err);
    }
  }, [audioFiles, playlists, setTrack, openPopup, setTrackList]);

  const handleNavigate = (page: string) => {
    console.log("[App] Navigating to page:", page);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const renderPage = () => {
    if (currentPage.startsWith("album/")) {
      const albumId = currentPage.slice("album/".length);
      console.log("[App] Rendering AlbumPage with albumId:", albumId);
      if (!albumId) {
        return (
          <div className="container mx-auto px-4 py-16 text-center">
            <p className="text-muted-foreground">No album specified.</p>
          </div>
        );
      }
      return <AlbumPage albumId={albumId} onNavigate={handleNavigate} />;
    }

    switch (currentPage) {
      case "music-mints":
        return <MusicMints />;
      case "about":
        return <AboutPage />;
      case "fan-connect":
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">FAN Connect</h1>
            <p className="text-lg text-muted-foreground">Coming soon...</p>
          </div>
        );
      case "merch":
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">Merch</h1>
            <p className="text-lg text-muted-foreground">Coming soon...</p>
          </div>
        );
      case "socials":
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">Socials</h1>
            <p className="text-lg text-muted-foreground">Coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="container mx-auto px-4 py-8">
            {/* Hero Section */}
            <section
              className="mb-6 overflow-hidden rounded-lg bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: "url(/assets/StrangeWaves2.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                minHeight: "300px",
              }}
            />

            <section className="mb-8 text-center">
              <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Welcome to Strange Waves
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Strange Waves is where genre boundaries dissolve and
                authenticity amplifies. We celebrate music that refuses to be
                commodified, championing Art that creates from the spirit, not
                the algorithm.
              </p>
            </section>

            {!isAuthenticated && (
              <section className="mb-8">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Login Required</AlertTitle>
                  <AlertDescription>
                    Please login with Internet Identity to upload audio files
                    and access your personal library.
                  </AlertDescription>
                </Alert>
              </section>
            )}

            {/* Library Section */}
            <ErrorBoundary>
              <section className="mb-12">
                <AudioLibrary
                  onSelectAudio={setTrack}
                  selectedAudioId={undefined}
                />
              </section>
            </ErrorBoundary>

            {/* Upload Section */}
            {isAuthenticated && (
              <ErrorBoundary>
                <section className="mb-12">
                  <div className="space-y-4">
                    <Button
                      onClick={() => setIsUploadExpanded(!isUploadExpanded)}
                      variant="outline"
                      className="w-full flex items-center justify-between py-6 text-lg font-semibold"
                    >
                      <span>Upload Audio File</span>
                      {isUploadExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>
                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isUploadExpanded
                          ? "max-h-[2000px] opacity-100"
                          : "max-h-0 opacity-0"
                      }`}
                    >
                      <AudioUploader />
                    </div>
                  </div>
                </section>
              </ErrorBoundary>
            )}
          </div>
        );
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header onNavigate={handleNavigate} />
      <main className="flex-1 pb-20">{renderPage()}</main>
      <PersistentAudioPlayer />
      <ErrorBoundary>
        <TrackPopupPlayer />
      </ErrorBoundary>
      <Footer />
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ErrorBoundary>
        <AudioPlayerProvider>
          <AppContent />
        </AudioPlayerProvider>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;

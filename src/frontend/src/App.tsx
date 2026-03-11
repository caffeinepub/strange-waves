import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { ChevronDown, ChevronUp, Info } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { AudioLibrary } from "./components/AudioLibrary";
import { AudioUploader } from "./components/AudioUploader";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { PersistentAudioPlayer } from "./components/PersistentAudioPlayer";
import {
  AudioPlayerProvider,
  useAudioPlayer,
} from "./contexts/AudioPlayerContext";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import {
  logComponentError,
  logComponentInit,
  logComponentSuccess,
} from "./lib/diagnostics";
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

  const { setTrack } = useAudioPlayer();

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
      case "fan-connect":
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">FAN Connect</h1>
            <p className="text-lg text-muted-foreground">Coming soon...</p>
          </div>
        );
      case "about":
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">About Strange Waves</h1>
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

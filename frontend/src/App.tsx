import { useEffect, useState } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { AudioUploader } from './components/AudioUploader';
import { AudioPlayer } from './components/AudioPlayer';
import { AudioLibrary } from './components/AudioLibrary';
import { MusicMints } from './pages/MusicMints';
import AlbumPage from './pages/AlbumPage';
import { useSelectedAudio } from './hooks/useQueries';
import { Toaster } from '@/components/ui/sonner';
import { ThemeProvider } from 'next-themes';
import { useInternetIdentity } from './hooks/useInternetIdentity';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';
import { ErrorBoundary } from './components/ErrorBoundary';
import { logComponentInit, logComponentSuccess, logComponentError } from './lib/diagnostics';
import { Button } from '@/components/ui/button';
import { WalletDisplay } from './components/WalletDisplay';

function App() {
  const [appError, setAppError] = useState<Error | null>(null);
  const [isUploadExpanded, setIsUploadExpanded] = useState(false);
  const [isEditExpanded, setIsEditExpanded] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>('home');

  useEffect(() => {
    logComponentInit('App');
    try {
      logComponentSuccess('App');
    } catch (error) {
      logComponentError('App', error as Error);
      setAppError(error as Error);
    }
  }, []);

  // Internet Identity authentication
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity && !identity.getPrincipal().isAnonymous();

  const { selectedAudio, setSelectedAudio } = useSelectedAudio();

  const handleNavigate = (page: string) => {
    console.log('[App] Navigating to page:', page);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderPage = () => {
    // Handle album routes: "album/<albumId>"
    if (currentPage.startsWith('album/')) {
      const albumId = currentPage.slice('album/'.length);
      console.log('[App] Rendering AlbumPage with albumId:', albumId);
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
      case 'music-mints':
        return <MusicMints />;
      case 'fan-connect':
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">FAN Connect</h1>
            <p className="text-lg text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'about':
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">About Strange Waves</h1>
            <p className="text-lg text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'merch':
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">Merch</h1>
            <p className="text-lg text-muted-foreground">Coming soon...</p>
          </div>
        );
      case 'socials':
        return (
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-4xl font-bold mb-4">Socials</h1>
            <p className="text-lg text-muted-foreground">Coming soon...</p>
          </div>
        );
      default:
        return (
          <div className="container mx-auto px-4 py-8">
            {/* Hero Section with Background Image */}
            <section
              className="mb-6 overflow-hidden rounded-lg bg-cover bg-center bg-no-repeat"
              style={{
                backgroundImage: 'url(/assets/StrangeWaves2.jpg)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                minHeight: '300px',
              }}
            />

            {/* Hero Text Section - Below Background Image */}
            <section className="mb-8 text-center">
              <h1 className="mb-4 text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Welcome to Strange Waves
              </h1>
              <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
                Strange Waves is where genre boundaries dissolve and authenticity amplifies. We celebrate music that refuses to be commodified, championing Art that creates from the spirit, not the algorithm.
              </p>
            </section>

            {/* Authentication Notice */}
            {!isAuthenticated && (
              <section className="mb-8">
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertTitle>Login Required</AlertTitle>
                  <AlertDescription>
                    Please login with Internet Identity to upload audio files and access your personal library.
                  </AlertDescription>
                </Alert>
              </section>
            )}

            {/* Player Section - Always available */}
            {selectedAudio && (
              <ErrorBoundary>
                <section className="mb-12">
                  <AudioPlayer audio={selectedAudio} />
                </section>
              </ErrorBoundary>
            )}

            {/* Library Section - Always available */}
            <ErrorBoundary>
              <section className="mb-12">
                <AudioLibrary
                  onSelectAudio={setSelectedAudio}
                  selectedAudioId={
                    selectedAudio?.source === 'local' || selectedAudio?.source === 'remote'
                      ? selectedAudio.data.id
                      : selectedAudio?.source === 'audius'
                      ? selectedAudio.data.id
                      : undefined
                  }
                />
              </section>
            </ErrorBoundary>

            {/* Edit Section - Collapsible at bottom */}
            {isAuthenticated && (
              <ErrorBoundary>
                <section className="mb-12">
                  <div className="space-y-4">
                    <Button
                      onClick={() => setIsEditExpanded(!isEditExpanded)}
                      variant="outline"
                      className="w-full flex items-center justify-between py-6 text-lg font-semibold"
                    >
                      <span>Edit &amp; Manage</span>
                      {isEditExpanded ? (
                        <ChevronUp className="h-5 w-5" />
                      ) : (
                        <ChevronDown className="h-5 w-5" />
                      )}
                    </Button>

                    <div
                      className={`overflow-hidden transition-all duration-300 ease-in-out ${
                        isEditExpanded
                          ? 'max-h-[2000px] opacity-100'
                          : 'max-h-0 opacity-0'
                      }`}
                    >
                      <WalletDisplay />
                    </div>
                  </div>
                </section>
              </ErrorBoundary>
            )}

            {/* Upload Section - Collapsible at bottom, only show when authenticated */}
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
                          ? 'max-h-[2000px] opacity-100'
                          : 'max-h-0 opacity-0'
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
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <ErrorBoundary>
        <div className="flex min-h-screen flex-col bg-background">
          <Header onNavigate={handleNavigate} />

          <main className="flex-1">
            {renderPage()}
          </main>

          <Footer />
          <Toaster />
        </div>
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;

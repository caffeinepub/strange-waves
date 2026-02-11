import { useState } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { LoginButton } from './LoginButton';
import { ErrorBoundary } from './ErrorBoundary';
import { CanisterInfoModal } from './CanisterInfoModal';
import { CanisterSettings } from './CanisterSettings';
import { Menu, Info, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onNavigate?: (page: string) => void;
}

export function Header({ onNavigate }: HeaderProps) {
  const [canisterModalOpen, setCanisterModalOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleNavigate = (page: string) => {
    if (onNavigate) {
      onNavigate(page);
    } else {
      console.log(`Navigate to: ${page}`);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      {/* Navigation Bar */}
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <button 
            onClick={() => handleNavigate('home')}
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
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => handleNavigate('about')}>
                About
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate('merch')}>
                Merch
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate('music-mints')}>
                Music Mints
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleNavigate('socials')}>
                Socials
              </DropdownMenuItem>
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
      <CanisterSettings 
        open={settingsOpen} 
        onOpenChange={setSettingsOpen} 
      />
    </header>
  );
}

import { useState, useEffect, memo } from 'react';
import { DateTime } from 'luxon';
import { Maximize, Minimize } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PinDialog } from '@/components/PinDialog';
import { useSettingsStore } from '@/stores/settingsStore';
import { TIMEZONE, CLOCK_UPDATE_INTERVAL } from '@/lib/constants';

interface HeaderProps {
  title: string;
  maxWidth?: 'max-w-2xl' | 'max-w-4xl';
  children?: React.ReactNode; // For additional elements like view selector
  onTitleClick?: () => void; // Optional click handler for title
  subtitle?: string; // Optional subtitle text
}

const Header = memo(({ title, maxWidth = 'max-w-2xl', children, onTitleClick, subtitle }: HeaderProps) => {
  const [currentTime, setCurrentTime] = useState(DateTime.now().setZone(TIMEZONE));
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingExitFullScreen, setPendingExitFullScreen] = useState(false);
  const { language } = useSettingsStore();

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(DateTime.now().setZone(TIMEZONE));
    }, CLOCK_UPDATE_INTERVAL);
    return () => clearInterval(interval);
  }, []);

  // Fullscreen event listener
  useEffect(() => {
    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement;

      // If we're in fullscreen mode state but browser exited fullscreen
      if (!isCurrentlyFullScreen && isFullScreen) {
        if (pendingExitFullScreen) {
          // This is an authorized exit with correct PIN
          setIsFullScreen(false);
          setPendingExitFullScreen(false);
        } else {
          // Unauthorized exit attempt - show PIN dialog and re-enter
          if (!showPinDialog) {
            setShowPinDialog(true);
          }
          // Re-enter fullscreen immediately
          document.documentElement.requestFullscreen().catch((err) => {
            console.error('Failed to re-enter fullscreen:', err);
          });
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [isFullScreen, pendingExitFullScreen, showPinDialog]);

  const weekdayNames = {
    pl: ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'],
    en: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  };
  const weekdayName = weekdayNames[language][currentTime.weekday - 1];
  const formattedDate = currentTime.toFormat('dd.MM.yyyy');
  const formattedTime = currentTime.toFormat('HH:mm');

  const toggleFullScreen = () => {
    if (!isFullScreen) {
      document.documentElement.requestFullscreen();
      setIsFullScreen(true);
    } else {
      setShowPinDialog(true);
    }
  };

  const handleCorrectPin = () => {
    setPendingExitFullScreen(true);
    setShowPinDialog(false);

    document.exitFullscreen().catch((err) => {
      console.error('Failed to exit fullscreen:', err);
      setPendingExitFullScreen(false);
    });
  };

  const handlePinCancel = () => {
    setShowPinDialog(false);

    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
  };

  const handleWrongPin = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(console.error);
    }
  };

  return (
    <>
      <header className="bg-primary border-2 border-primary shadow-soft sticky top-0 z-10">
        <div className={`container ${maxWidth} mx-auto px-4 py-3`}>
          <div className="flex items-center justify-between gap-4">
            {/* Left side: Title, time, and optional children */}
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {onTitleClick ? (
                  <button
                    onClick={onTitleClick}
                    className="text-left hover:opacity-90 transition-smooth cursor-pointer"
                  >
                    <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
                      {title}
                    </h1>
                    {subtitle && (
                      <p className="text-sm text-primary-foreground/80 mt-1">
                        {subtitle}
                      </p>
                    )}
                  </button>
                ) : (
                  <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
                    {title}
                  </h1>
                )}
                {children}
              </div>

              {/* Time and date aligned with title on desktop */}
              <div className="hidden md:block mt-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-primary-foreground tracking-wider text-base">
                    {formattedTime}
                  </span>
                  <span className="text-primary-foreground/40">•</span>
                  <span className="text-primary-foreground/90">
                    {weekdayName}, {formattedDate}
                  </span>
                </div>
              </div>

              {/* Mobile: Date and Time below title */}
              <div className="md:hidden mt-2">
                <div className="flex items-center gap-3 text-sm">
                  <span className="font-bold text-primary-foreground tracking-wider">
                    {formattedTime}
                  </span>
                  <span className="text-primary-foreground/40">•</span>
                  <span className="text-primary-foreground/90">
                    {weekdayName}, {formattedDate}
                  </span>
                </div>
              </div>
            </div>

            {/* Right: Fullscreen button */}
            <div>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleFullScreen}
                className="text-primary-foreground hover:bg-primary-foreground/10 opacity-20 hover:opacity-60 transition-opacity"
              >
                {isFullScreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <PinDialog
        open={showPinDialog}
        onCorrectPin={handleCorrectPin}
        onCancel={handlePinCancel}
        onWrongPin={handleWrongPin}
      />
    </>
  );
});

Header.displayName = 'Header';

export default Header;

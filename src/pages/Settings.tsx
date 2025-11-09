import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ClassPicker } from '@/components/ClassPicker';
import { ClassInfoFrame } from '@/components/ClassInfoFrame';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { Maximize, Minimize } from 'lucide-react';
import { PinDialog } from '@/components/PinDialog';
import { useEffect } from 'react';

const Settings = () => {
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingExitFullScreen, setPendingExitFullScreen] = useState(false);
  const navigate = useNavigate();

  const {
    class_label,
    subgroup_label,
    language,
    setLanguage,
    theme,
    setTheme,
    use24Hour,
    setUse24Hour,
  } = useSettingsStore();

  const t = translations[language];

  // Fullscreen event listener
  useEffect(() => {
    const handleFullScreenChange = () => {
      const isCurrentlyFullScreen = !!document.fullscreenElement;

      if (!isCurrentlyFullScreen && isFullScreen) {
        if (pendingExitFullScreen) {
          setIsFullScreen(false);
          setPendingExitFullScreen(false);
        } else {
          if (!showPinDialog) {
            setShowPinDialog(true);
          }
          document.documentElement.requestFullscreen().catch((err) => {
            console.error('Failed to re-enter fullscreen:', err);
          });
        }
      }
    };

    document.addEventListener('fullscreenchange', handleFullScreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullScreenChange);
  }, [isFullScreen, pendingExitFullScreen, showPinDialog]);

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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-primary border-2 border-primary shadow-soft sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="flex-1 text-2xl md:text-3xl font-bold text-primary-foreground text-center">{t.settings}</h1>
            <button
              onClick={toggleFullScreen}
              className="opacity-20 hover:opacity-60 transition-opacity"
              title={isFullScreen ? "Wyjdź z trybu pełnoekranowego" : "Tryb pełnoekranowy"}
            >
              {isFullScreen ? (
                <Minimize className="h-3 w-3 text-primary-foreground" />
              ) : (
                <Maximize className="h-3 w-3 text-primary-foreground" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-2xl mx-auto px-4 py-8 pb-28 space-y-6">
        {/* Class Selection */}
        <Card>
          <CardHeader>
            <CardTitle>{t.selectClass}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <ClassInfoFrame>
              <div className="text-lg font-bold text-accent-foreground">
                {class_label || t.noClass}
                {subgroup_label && ` • ${subgroup_label}`}
              </div>
            </ClassInfoFrame>
            <Button
              onClick={() => setShowClassPicker(true)}
              variant="outline"
              className="w-full"
            >
              {t.changeClass}
            </Button>
          </CardContent>
        </Card>

        {/* Language */}
        <Card>
          <CardHeader>
            <CardTitle>{t.language}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={(val) => setLanguage(val as 'pl' | 'en')}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pl">Polski</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Theme */}
        <Card>
          <CardHeader>
            <CardTitle>{t.themeMode}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={theme} onValueChange={(val) => setTheme(val as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="system">{t.system}</SelectItem>
                <SelectItem value="light">{t.light}</SelectItem>
                <SelectItem value="dark">{t.dark}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Clock Format */}
        <Card>
          <CardHeader>
            <CardTitle>{t.clockFormat}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <Label htmlFor="clock-format">{t.hour24}</Label>
              <Switch
                id="clock-format"
                checked={use24Hour}
                onCheckedChange={setUse24Hour}
              />
            </div>
          </CardContent>
        </Card>
      </main>

      <BottomNav />
      <ClassPicker open={showClassPicker} onOpenChange={setShowClassPicker} />
      <PinDialog
        open={showPinDialog}
        onCorrectPin={handleCorrectPin}
        onCancel={handlePinCancel}
        onWrongPin={handleWrongPin}
      />
    </div>
  );
};

export default Settings;

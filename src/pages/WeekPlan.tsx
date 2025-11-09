import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { Lesson, Weekday } from '@/types/schedule';
import { Clock, MapPin, Maximize, Minimize } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PinDialog } from '@/components/PinDialog';

const WeekPlan = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [showPinDialog, setShowPinDialog] = useState(false);
  const [pendingExitFullScreen, setPendingExitFullScreen] = useState(false);

  const { class_id, class_label, subgroup_id, language } = useSettingsStore();
  const t = translations[language];
  const navigate = useNavigate();

  const weekdays: { key: Weekday; label: string }[] = [
    { key: 'MON', label: t.monday },
    { key: 'TUE', label: t.tuesday },
    { key: 'WED', label: t.wednesday },
    { key: 'THU', label: t.thursday },
    { key: 'FRI', label: t.friday },
  ];

  useEffect(() => {
    if (!class_id) return;
    
    setLoading(true);
    import('@/lib/xmlParser').then(({ getLessonsForClass }) => {
      getLessonsForClass(class_id)
        .then((data: Lesson[]) => {
          const filtered = data
            .filter(l => l.class_id === class_id)
            .filter(l => {
              if (!subgroup_id) return true;
              return l.subgroup_id === '' || l.subgroup_id === subgroup_id;
            });
          setLessons(filtered);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load lessons:', err);
          setLoading(false);
        });
    });
  }, [class_id, subgroup_id]);

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

  const getLessonsForDay = (weekday: Weekday) => {
    const dayLessons = lessons
      .filter(l => l.weekday === weekday)
      .sort((a, b) => a.period - b.period);
    
    // Group by period to show simultaneous classes together
    const groupedByPeriod = dayLessons.reduce((acc, lesson) => {
      const key = `${lesson.period}-${lesson.start_time}`;
      if (!acc[key]) {
        acc[key] = {
          period: lesson.period,
          start_time: lesson.start_time,
          end_time: lesson.end_time,
          lessons: []
        };
      }
      acc[key].lessons.push(lesson);
      return acc;
    }, {} as Record<string, { period: number; start_time: string; end_time: string; lessons: Lesson[] }>);
    
    return Object.values(groupedByPeriod);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="bg-primary border-2 border-primary shadow-soft sticky top-0 z-10">
        <div className="container max-w-4xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <button onClick={() => navigate('/')} className="flex-1 text-center hover:opacity-90 transition-smooth cursor-pointer">
              <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">{t.showWeekPlan}</h1>
              <p className="text-sm text-primary-foreground/80 mt-1">{class_label}</p>
            </button>
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
      <main className="container max-w-4xl mx-auto px-4 py-8 pb-28">
        {loading && (
          <Alert>
            <AlertDescription className="text-center">
              Ładowanie...
            </AlertDescription>
          </Alert>
        )}

        {!loading && (
          <Tabs defaultValue="MON" className="w-full">
            <TabsList className="grid w-full grid-cols-5 mb-6">
              {weekdays.map((day) => (
                <TabsTrigger key={day.key} value={day.key} className="text-xs sm:text-sm">
                  {day.label}
                </TabsTrigger>
              ))}
            </TabsList>

            {weekdays.map((day) => (
              <TabsContent key={day.key} value={day.key} className="space-y-4">
                {getLessonsForDay(day.key).length === 0 ? (
                  <Alert>
                    <AlertDescription className="text-center">
                      {t.noLessonsToday}
                    </AlertDescription>
                  </Alert>
                ) : (
                  getLessonsForDay(day.key).map((group, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      {/* Time and period on the left */}
                      <div className="flex flex-col gap-1 min-w-[120px] pt-4">
                        <span className="text-primary font-medium text-sm mb-1">
                          {t.period} {group.period}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{group.start_time} - {group.end_time}</span>
                        </div>
                      </div>
                      
                      {/* Lessons as tiles on the right */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.lessons.map((lesson, lessonIdx) => (
                          <Card key={lessonIdx} className="p-4 transition-smooth hover:shadow-medium">
                            <h3 className="font-bold text-base text-foreground mb-2">
                              {lesson.subject}
                            </h3>
                            {lesson.subgroup_label && (
                              <p className="text-xs text-muted-foreground mb-2">
                                {lesson.subgroup_label}
                              </p>
                            )}
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              <span>{lesson.room}</span>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      <BottomNav />
      <PinDialog
        open={showPinDialog}
        onCorrectPin={handleCorrectPin}
        onCancel={handlePinCancel}
        onWrongPin={handleWrongPin}
      />
    </div>
  );
};

export default WeekPlan;

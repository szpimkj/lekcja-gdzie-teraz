import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { LessonCard } from '@/components/LessonCard';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { getCurrentOrNextLesson } from '@/lib/scheduleLogic';
import { Lesson, CurrentLessonInfo } from '@/types/schedule';
import { Clock, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/Header';

// Helper function to format time with days, hours, and minutes
const formatTimeUntil = (minutes: number): string => {
  if (minutes >= 1440) {
    // 24+ hours: show days, hours, and minutes
    const days = Math.floor(minutes / 1440);
    const remaining = minutes % 1440;
    const hours = Math.floor(remaining / 60);
    const mins = remaining % 60;
    return `${days}d ${hours}h ${mins}min`;
  } else if (minutes >= 60) {
    // 1-23 hours: show hours and minutes
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  } else {
    // Less than 1 hour: show just minutes
    return `${minutes} min`;
  }
};

const Index = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentInfo, setCurrentInfo] = useState<CurrentLessonInfo | CurrentLessonInfo[] | null>(null);
  const [loading, setLoading] = useState(false);

  const { class_id, class_label, subgroup_id, subgroup_label, language } = useSettingsStore();
  const t = translations[language];
  const navigate = useNavigate();

  // Redirect to class selector if no class selected
  useEffect(() => {
    if (!class_id) {
      navigate('/');
    }
  }, [class_id, navigate]);

  // Load lessons for selected class
  useEffect(() => {
    if (!class_id) return;
    
    setLoading(true);
    import('@/lib/xmlParser').then(({ getLessonsForClass }) => {
      getLessonsForClass(class_id)
        .then((data) => {
          setLessons(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load lessons:', err);
          setLoading(false);
        });
    });
  }, [class_id]);

  // Update current lesson every minute
  useEffect(() => {
    if (lessons.length === 0 || !class_id) return;

    const updateCurrent = () => {
      const info = getCurrentOrNextLesson(lessons, class_id, subgroup_id, language);
      setCurrentInfo(info);
    };

    updateCurrent();
    const interval = setInterval(updateCurrent, 60000); // Every minute

    return () => clearInterval(interval);
  }, [lessons, class_id, subgroup_id, language]);

  // Auto-redirect back to main page after 10 seconds
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate('/');
    }, 10000);

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  const renderCurrentInfo = () => {
    if (!currentInfo) {
      return (
        <Alert>
          <AlertDescription className="text-center">
            {t.noLessons}
          </AlertDescription>
        </Alert>
      );
    }

    if (Array.isArray(currentInfo)) {
      // Multiple subgroups - show as tiles next to each other
      const firstInfo = currentInfo[0];
      const isBreakTime = firstInfo.status === 'next' || firstInfo.status === 'end-of-day';
      const isCurrentClass = firstInfo.status === 'current';

      return (
        <div className="space-y-4">
          {isBreakTime && (
            <div className="text-center mb-8 p-6 bg-primary/10 rounded-2xl border-2 border-primary/20">
              <div className="text-sm font-medium text-muted-foreground mb-2">
                Uff! Masz teraz przerwę
              </div>
              <div className="text-lg font-semibold text-foreground mb-3">
                Następne zajęcia zaczynają się za:
              </div>
              {firstInfo.minutesUntil && (
                <div className="text-5xl font-bold text-primary">
                  {formatTimeUntil(firstInfo.minutesUntil)}
                </div>
              )}
            </div>
          )}
          {isCurrentClass && (
            <div className="text-center mb-8 p-6 bg-accent/10 rounded-2xl border-2 border-accent/20">
              <div className="text-lg font-semibold text-foreground mb-3">
                Aktualne zajęcia:
              </div>
              {firstInfo.minutesRemaining && (
                <div>
                  <div className="text-5xl font-bold text-accent mb-1">
                    {formatTimeUntil(firstInfo.minutesRemaining)}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    pozostało do końca zajęć
                  </div>
                </div>
              )}
            </div>
          )}
          
          <div className="flex gap-4 items-start">
            {/* Time and period on the left */}
            <div className="flex flex-col gap-2 min-w-[140px] pt-2">
              <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
                <span className="text-primary font-bold text-lg block mb-2">
                  {t.period} {firstInfo.lesson.period}
                </span>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                  <Clock className="h-4 w-4" />
                  <span className="font-medium">{firstInfo.lesson.start_time} - {firstInfo.lesson.end_time}</span>
                </div>
                {firstInfo.minutesRemaining && (
                  <div className="text-center p-2 bg-accent/20 rounded-lg border border-accent/30">
                    <div className="text-xs text-muted-foreground mb-1">{t.remaining}</div>
                    <div className="text-2xl font-bold text-accent">
                      {formatTimeUntil(firstInfo.minutesRemaining)}
                    </div>
                  </div>
                )}
                {firstInfo.minutesUntil && (
                  <div className="text-center p-2 bg-primary/20 rounded-lg border border-primary/30">
                    <div className="text-xs text-muted-foreground mb-1">{t.in}</div>
                    <div className="text-2xl font-bold text-primary">
                      {formatTimeUntil(firstInfo.minutesUntil)}
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Lessons as tiles on the right */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentInfo.map((info, idx) => (
                <Card key={idx} className={`p-4 transition-smooth hover:shadow-medium ${
                  info.status === 'current' ? 'border-accent border-2' : ''
                }`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-foreground mb-1">
                        {info.lesson.subject}
                      </h3>
                      {info.lesson.subgroup_label && (
                        <p className="text-xs text-muted-foreground">
                          {info.lesson.subgroup_label}
                        </p>
                      )}
                    </div>
                    <div className="bg-primary/20 border-2 border-primary rounded-lg p-2 text-center min-w-[70px]">
                      <MapPin className="h-4 w-4 text-primary mx-auto mb-1" />
                      <div className="text-2xl font-black text-primary leading-none">
                        {info.lesson.room}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
          {!subgroup_id && (
            <Alert>
              <AlertDescription className="text-center text-sm">
                {t.multipleGroups}
              </AlertDescription>
            </Alert>
          )}
        </div>
      );
    }

    // Single lesson
    const isBreakTime = currentInfo.status === 'next' || currentInfo.status === 'end-of-day';
    const isCurrentClass = currentInfo.status === 'current';

    return (
      <div className="space-y-4">
        {isBreakTime && (
          <div className="text-center mb-8 p-6 bg-primary/10 rounded-2xl border-2 border-primary/20">
            <div className="text-sm font-medium text-muted-foreground mb-2">
              Uff! Masz teraz przerwę
            </div>
            <div className="text-lg font-semibold text-foreground mb-3">
              Następne zajęcia zaczynają się za:
            </div>
            {currentInfo.minutesUntil && (
              <div className="text-5xl font-bold text-primary">
                {formatTimeUntil(currentInfo.minutesUntil)}
              </div>
            )}
          </div>
        )}
        {isCurrentClass && (
          <div className="text-center mb-8 p-6 bg-accent/10 rounded-2xl border-2 border-accent/20">
            <div className="text-lg font-semibold text-foreground mb-3">
              Aktualne zajęcia:
            </div>
            {currentInfo.minutesRemaining && (
              <div>
                <div className="text-5xl font-bold text-accent mb-1">
                  {formatTimeUntil(currentInfo.minutesRemaining)}
                </div>
                <div className="text-sm text-muted-foreground">
                  pozostało do końca zajęć
                </div>
              </div>
            )}
          </div>
        )}
        
        <LessonCard
          lesson={currentInfo.lesson}
          status={currentInfo.status === 'current' ? 'current' : currentInfo.status === 'next' ? 'next' : undefined}
          minutesInfo={
            currentInfo.minutesRemaining
              ? `${t.remaining} ${formatTimeUntil(currentInfo.minutesRemaining)}`
              : currentInfo.minutesUntil
                ? `${t.in} ${formatTimeUntil(currentInfo.minutesUntil)}`
                : undefined
          }
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
      <Header
        title={`Gdzie ma lekcje klasa ${class_label || t.noClass}?`}
        onTitleClick={() => navigate('/')}
        subtitle="Zmień klasę"
      />

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-8 pb-28 space-y-6">
        {/* Current/Next Lesson Display */}
        {currentInfo && (
          <div className="mt-8">
            {renderCurrentInfo()}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LessonCard } from '@/components/LessonCard';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { getCurrentOrNextLesson } from '@/lib/scheduleLogic';
import { formatTimeUntil } from '@/lib/utils';
import { LESSON_UPDATE_INTERVAL, AUTO_REDIRECT_TIMEOUT } from '@/lib/constants';
import { Lesson, CurrentLessonInfo } from '@/types/schedule';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/Header';
import { BreakTimeDisplay, CurrentLessonDisplay } from '@/components/lesson/TimeStatusDisplay';
import { LessonTimeInfo } from '@/components/lesson/LessonTimeInfo';
import { MultiLessonCard } from '@/components/lesson/MultiLessonCard';
import { Button } from '@/components/ui/button';

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
    const interval = setInterval(updateCurrent, LESSON_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [lessons, class_id, subgroup_id, language]);

  // Auto-redirect back to main page after timeout
  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate('/');
    }, AUTO_REDIRECT_TIMEOUT);

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
          {isBreakTime && firstInfo.minutesUntil && (
            <BreakTimeDisplay minutesUntil={firstInfo.minutesUntil} />
          )}
          {isCurrentClass && firstInfo.minutesRemaining && (
            <CurrentLessonDisplay minutesRemaining={firstInfo.minutesRemaining} />
          )}

          <div className="flex gap-4 items-start">
            {/* Time and period on the left */}
            <LessonTimeInfo
              period={firstInfo.lesson.period}
              startTime={firstInfo.lesson.start_time}
              endTime={firstInfo.lesson.end_time}
              minutesRemaining={firstInfo.minutesRemaining}
            />

            {/* Lessons as tiles on the right */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentInfo.map((info, idx) => (
                <MultiLessonCard
                  key={idx}
                  lesson={info.lesson}
                  status={info.status}
                />
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
        {isBreakTime && currentInfo.minutesUntil && (
          <BreakTimeDisplay minutesUntil={currentInfo.minutesUntil} />
        )}
        {isCurrentClass && currentInfo.minutesRemaining && (
          <CurrentLessonDisplay minutesRemaining={currentInfo.minutesRemaining} />
        )}

        <LessonCard
          lesson={currentInfo.lesson}
          status={currentInfo.status === 'current' ? 'current' : currentInfo.status === 'next' ? 'next' : undefined}
          minutesInfo={
            currentInfo.minutesRemaining
              ? `${t.remaining} ${formatTimeUntil(currentInfo.minutesRemaining, { days: t.days, hours: t.hours, minutes: t.minutes })}`
              : undefined
          }
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-muted/30 to-background">
      <Header
        title={`${t.whereHasLessonClass} ${class_label || t.noClass}?`}
        onTitleClick={() => navigate('/')}
      />

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-8 pb-28 space-y-6">
        {/* Current/Next Lesson Display */}
        {currentInfo && (
          <div className="mt-8">
            {renderCurrentInfo()}
          </div>
        )}

        {/* Back Button */}
        <div className="mt-6">
          <Button
            onClick={() => navigate('/')}
            className="w-full"
            variant="outline"
          >
            {t.back}
          </Button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
};

export default Index;

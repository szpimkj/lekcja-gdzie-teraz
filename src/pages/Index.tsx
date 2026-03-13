import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { LessonCard } from '@/components/LessonCard';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { getCurrentOrNextLesson } from '@/lib/scheduleLogic';
import { loadSubstitutions, getTodayDateString, findSubstitution } from '@/lib/substitutions';
import { formatTimeUntil } from '@/lib/utils';
import { LESSON_UPDATE_INTERVAL, AUTO_REDIRECT_TIMEOUT } from '@/lib/constants';
import { Lesson, CurrentLessonInfo } from '@/types/schedule';
import { Substitution, AppliedSubstitution } from '@/types/substitution';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/Header';
import { BreakTimeDisplay, CurrentLessonDisplay } from '@/components/lesson/TimeStatusDisplay';
import { LessonTimeInfo } from '@/components/lesson/LessonTimeInfo';
import { MultiLessonCard } from '@/components/lesson/MultiLessonCard';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [currentInfo, setCurrentInfo] = useState<CurrentLessonInfo | CurrentLessonInfo[] | null>(null);
  const [xmlError, setXmlError] = useState<string | null>(null);

  const { class_id, class_label, language, substitutionsSheetUrl } = useSettingsStore();
  const t = translations[language];
  const navigate = useNavigate();

  useEffect(() => {
    if (!class_id) {
      navigate('/');
    }
  }, [class_id, navigate]);

  useEffect(() => {
    if (!class_id) return;

    Promise.all([
      import('@/lib/xmlParser').then(({ getLessonsForClass }) => getLessonsForClass(class_id)),
      loadSubstitutions(substitutionsSheetUrl),
    ]).then(([data, subs]) => {
      setLessons(data);
      setSubstitutions(subs);
      setXmlError(null);
    }).catch((err: Error) => {
      console.error('Failed to load lessons:', err);
      if (err.message === 'XML_INCOMPLETE') {
        setXmlError(t.xmlIncomplete);
      } else if (err.message.startsWith('XML_INVALID') || err.message.startsWith('XML_PARSE_ERROR')) {
        setXmlError(t.xmlInvalid);
      } else {
        setXmlError(t.xmlLoadError);
      }
    });
  }, [class_id, substitutionsSheetUrl]);

  useEffect(() => {
    if (lessons.length === 0 || !class_id) return;

    const updateCurrent = () => {
      const info = getCurrentOrNextLesson(lessons, class_id, null, language);
      setCurrentInfo(info);
    };

    updateCurrent();
    const interval = setInterval(updateCurrent, LESSON_UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, [lessons, class_id, language]);

  useEffect(() => {
    const redirectTimer = setTimeout(() => {
      navigate('/');
    }, AUTO_REDIRECT_TIMEOUT);

    return () => clearTimeout(redirectTimer);
  }, [navigate]);

  /** Get substitution for a lesson based on today's date */
  const getSubForLesson = (lesson: Lesson): AppliedSubstitution | null => {
    const todayDate = getTodayDateString();
    return findSubstitution(lesson, todayDate, substitutions);
  };

  /** Apply substitution changes to a lesson for display */
  const applySubToLesson = (lesson: Lesson, sub: AppliedSubstitution | null): Lesson => {
    if (!sub || sub.substitution.type !== 'change') return lesson;
    return {
      ...lesson,
      subject: sub.substitution.new_subject || lesson.subject,
      teacher: sub.substitution.new_teacher || lesson.teacher,
      room: sub.substitution.new_room || lesson.room,
    };
  };

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

          <div className="space-y-4">
            <LessonTimeInfo
              period={firstInfo.lesson.period}
              startTime={firstInfo.lesson.start_time}
              endTime={firstInfo.lesson.end_time}
              minutesRemaining={firstInfo.minutesRemaining}
            />

            <div className="space-y-3">
              {currentInfo.map((info, idx) => {
                const sub = getSubForLesson(info.lesson);
                const displayLesson = applySubToLesson(info.lesson, sub);
                return (
                  <MultiLessonCard
                    key={idx}
                    lesson={displayLesson}
                    status={info.status}
                    substitution={sub}
                  />
                );
              })}
            </div>
          </div>
        </div>
      );
    }

    // Single lesson
    const sub = getSubForLesson(currentInfo.lesson);
    const displayLesson = applySubToLesson(currentInfo.lesson, sub);
    const isBreakTime = currentInfo.status === 'next' || currentInfo.status === 'end-of-day';
    const isCurrentClass = currentInfo.status === 'current';
    const isCancelled = sub?.substitution.type === 'cancel';

    return (
      <div className="space-y-4">
        {isBreakTime && currentInfo.minutesUntil && (
          <BreakTimeDisplay minutesUntil={currentInfo.minutesUntil} />
        )}
        {isCurrentClass && currentInfo.minutesRemaining && (
          <CurrentLessonDisplay minutesRemaining={currentInfo.minutesRemaining} />
        )}

        <LessonCard
          lesson={displayLesson}
          status={currentInfo.status === 'current' ? 'current' : currentInfo.status === 'next' ? 'next' : undefined}
          substitution={sub}
          minutesInfo={
            currentInfo.minutesRemaining && !isCancelled
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

      <main className="container max-w-2xl mx-auto px-4 py-8 pb-28 space-y-6">
        {xmlError && (
          <Alert variant="destructive" className="mt-8">
            <AlertDescription>{xmlError}</AlertDescription>
          </Alert>
        )}

        {!xmlError && currentInfo && (
          <div className="mt-8">
            {renderCurrentInfo()}
          </div>
        )}

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

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LessonCard } from '@/components/LessonCard';
import { ClassPicker } from '@/components/ClassPicker';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { getCurrentOrNextLesson } from '@/lib/scheduleLogic';
import { Lesson, CurrentLessonInfo } from '@/types/schedule';
import { Settings } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const Index = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentInfo, setCurrentInfo] = useState<CurrentLessonInfo | CurrentLessonInfo[] | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const { class_id, class_label, subgroup_id, language } = useSettingsStore();
  const t = translations[language];
  const navigate = useNavigate();

  // Show class picker on first load
  useEffect(() => {
    if (!class_id) {
      setShowClassPicker(true);
    }
  }, [class_id]);

  // Load lessons for selected class
  useEffect(() => {
    if (!class_id) return;
    
    setLoading(true);
    fetch(`/data/classes/${class_id}.json`)
      .then((res) => res.json())
      .then((data) => {
        setLessons(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load lessons:', err);
        setLoading(false);
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

  const handleMainButton = () => {
    if (!class_id) {
      setShowClassPicker(true);
      return;
    }

    const info = getCurrentOrNextLesson(lessons, class_id, subgroup_id, language);
    setCurrentInfo(info);
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
      // Multiple subgroups
      return (
        <div className="space-y-4">
          {currentInfo.map((info, idx) => (
            <LessonCard
              key={idx}
              lesson={info.lesson}
              status={info.status === 'current' ? 'current' : 'next'}
              minutesInfo={
                info.minutesRemaining 
                  ? `${t.remaining} ${info.minutesRemaining} ${t.minutesShort}`
                  : info.minutesUntil 
                    ? `${t.in} ${info.minutesUntil} ${t.minutesShort}`
                    : undefined
              }
            />
          ))}
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
    return (
      <LessonCard
        lesson={currentInfo.lesson}
        status={currentInfo.status === 'current' ? 'current' : currentInfo.status === 'next' ? 'next' : undefined}
        minutesInfo={
          currentInfo.minutesRemaining 
            ? `${t.remaining} ${currentInfo.minutesRemaining} ${t.minutesShort}`
            : currentInfo.minutesUntil 
              ? `${t.in} ${currentInfo.minutesUntil} ${t.minutesShort}`
              : undefined
        }
      />
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-foreground">
              {class_label || t.noClass}
            </h1>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/settings')}
            className="hover:bg-secondary"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-8 pb-28 space-y-6">
        {/* Big Main Button */}
        <div className="text-center space-y-6">
          <Button
            onClick={handleMainButton}
            disabled={loading || !class_id}
            size="lg"
            className="w-full h-24 text-xl font-bold gradient-hero hover:opacity-90 transition-smooth shadow-large"
          >
            {t.mainButton}
          </Button>

          {/* Removed quick action buttons - now using bottom nav */}
        </div>

        {/* Current/Next Lesson Display */}
        {currentInfo && (
          <div className="mt-8">
            {renderCurrentInfo()}
          </div>
        )}

        {!class_id && (
          <Alert>
            <AlertDescription className="text-center">
              {t.chooseClass}
            </AlertDescription>
          </Alert>
        )}
      </main>

      <BottomNav />
      <ClassPicker open={showClassPicker} onOpenChange={setShowClassPicker} />
    </div>
  );
};

export default Index;

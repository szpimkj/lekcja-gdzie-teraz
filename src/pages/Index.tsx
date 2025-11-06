import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { LessonCard } from '@/components/LessonCard';
import { ClassPicker } from '@/components/ClassPicker';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { getCurrentOrNextLesson } from '@/lib/scheduleLogic';
import { Lesson, CurrentLessonInfo } from '@/types/schedule';
import { Settings, Clock, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import breakImage from '@/assets/break-time.jpg';

const Index = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [currentInfo, setCurrentInfo] = useState<CurrentLessonInfo | CurrentLessonInfo[] | null>(null);
  const [showClassPicker, setShowClassPicker] = useState(false);
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
      // Multiple subgroups - show as tiles next to each other
      const firstInfo = currentInfo[0];
      const isBreakTime = firstInfo.status === 'next' || firstInfo.status === 'end-of-day';
      
      return (
        <div className="space-y-4">
          {isBreakTime && (
            <div className="text-center space-y-4 mb-6">
              <img 
                src={breakImage} 
                alt="Przerwa" 
                className="w-64 mx-auto rounded-lg shadow-medium"
              />
              <h2 className="text-2xl font-bold text-primary">
                Uff! Masz teraz przerwę. Następne zajęcia to:
              </h2>
            </div>
          )}
          
          <div className="flex gap-4 items-start">
            {/* Time and period on the left */}
            <div className="flex flex-col gap-1 min-w-[120px] pt-4">
              <span className="text-primary font-medium text-sm mb-1">
                {t.period} {firstInfo.lesson.period}
              </span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="font-medium">{firstInfo.lesson.start_time} - {firstInfo.lesson.end_time}</span>
              </div>
              {firstInfo.minutesRemaining && (
                <div className="text-sm text-accent font-medium mt-2">
                  {t.remaining} {firstInfo.minutesRemaining} {t.minutesShort}
                </div>
              )}
              {firstInfo.minutesUntil && (
                <div className="text-sm text-primary font-medium mt-2">
                  {t.in} {firstInfo.minutesUntil} {t.minutesShort}
                </div>
              )}
            </div>
            
            {/* Lessons as tiles on the right */}
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {currentInfo.map((info, idx) => (
                <Card key={idx} className={`p-4 transition-smooth hover:shadow-medium ${
                  info.status === 'current' ? 'border-accent border-2' : ''
                }`}>
                  <h3 className="font-bold text-base text-foreground mb-2">
                    {info.lesson.subject}
                  </h3>
                  {info.lesson.subgroup_label && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {info.lesson.subgroup_label}
                    </p>
                  )}
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <MapPin className="h-3 w-3" />
                    <span>{info.lesson.room}</span>
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
    
    return (
      <div className="space-y-4">
        {isBreakTime && (
          <div className="text-center space-y-4 mb-6">
            <img 
              src={breakImage} 
              alt="Przerwa" 
              className="w-64 mx-auto rounded-lg shadow-medium"
            />
            <h2 className="text-2xl font-bold text-primary">
              Uff! Masz teraz przerwę. Następne zajęcia to:
            </h2>
          </div>
        )}
        
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
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/')}
            className="w-full text-center hover:bg-secondary/50 rounded-lg px-4 py-2 transition-smooth group"
          >
            <div className="flex items-center justify-center gap-2">
              <h1 className="text-lg font-bold text-foreground">
                {class_label || t.noClass}
              </h1>
              <svg 
                className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-smooth" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {subgroup_label || 'Dotknij aby zmienić'}
            </p>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container max-w-2xl mx-auto px-4 py-8 pb-28 space-y-6">
        {/* Big Main Button */}
        <div className="text-center space-y-6">
          <Button
            onClick={handleMainButton}
            disabled={loading}
            size="lg"
            className="w-full h-24 text-xl font-bold gradient-hero hover:opacity-90 transition-smooth shadow-large"
          >
            {t.mainButton}
          </Button>
        </div>

        {/* Current/Next Lesson Display */}
        {currentInfo && (
          <div className="mt-8">
            {renderCurrentInfo()}
          </div>
        )}
      </main>

      <BottomNav />
      <ClassPicker open={showClassPicker} onOpenChange={setShowClassPicker} />
    </div>
  );
};

export default Index;

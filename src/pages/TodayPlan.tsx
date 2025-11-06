import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { LessonCard } from '@/components/LessonCard';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { getCurrentWeekday } from '@/lib/scheduleLogic';
import { Lesson } from '@/types/schedule';
import { ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const TodayPlan = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { class_id, class_label, subgroup_id, language } = useSettingsStore();
  const t = translations[language];
  const navigate = useNavigate();

  useEffect(() => {
    if (!class_id) return;
    
    setLoading(true);
    fetch(`/data/classes/${class_id}.json`)
      .then((res) => res.json())
      .then((data: Lesson[]) => {
        const currentWeekday = getCurrentWeekday();
        if (!currentWeekday) {
          setLessons([]);
          setLoading(false);
          return;
        }

        const todayLessons = data
          .filter(l => l.class_id === class_id && l.weekday === currentWeekday)
          .filter(l => {
            if (!subgroup_id) return true;
            return l.subgroup_id === '' || l.subgroup_id === subgroup_id;
          })
          .sort((a, b) => a.period - b.period);

        setLessons(todayLessons);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load lessons:', err);
        setLoading(false);
      });
  }, [class_id, subgroup_id]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/')}
            className="hover:bg-secondary"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-lg font-bold text-foreground">{t.showDayPlan}</h1>
            <p className="text-sm text-muted-foreground">{class_label}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-2xl mx-auto px-4 py-8 space-y-4">
        {loading && (
          <Alert>
            <AlertDescription className="text-center">
              Ładowanie...
            </AlertDescription>
          </Alert>
        )}

        {!loading && lessons.length === 0 && (
          <Alert>
            <AlertDescription className="text-center">
              {t.noLessonsToday}
            </AlertDescription>
          </Alert>
        )}

        {!loading && lessons.map((lesson, idx) => (
          <LessonCard key={idx} lesson={lesson} />
        ))}
      </main>
    </div>
  );
};

export default TodayPlan;

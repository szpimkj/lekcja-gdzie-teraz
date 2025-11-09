import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { getCurrentWeekday } from '@/lib/scheduleLogic';
import { Lesson } from '@/types/schedule';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Clock, MapPin } from 'lucide-react';

const TodayPlan = () => {
  const [lessons, setLessons] = useState<Array<{ period: number; start_time: string; end_time: string; lessons: Lesson[] }>>([]);
  const [loading, setLoading] = useState(false);
  
  const { class_id, class_label, subgroup_id, language } = useSettingsStore();
  const t = translations[language];
  const navigate = useNavigate();

  useEffect(() => {
    if (!class_id) return;
    
    setLoading(true);
    import('@/lib/xmlParser').then(({ getLessonsForClass }) => {
      getLessonsForClass(class_id)
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

          // Group by period to show simultaneous classes together
          const groupedByPeriod = todayLessons.reduce((acc, lesson) => {
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

          setLessons(Object.values(groupedByPeriod));
          setLoading(false);
        })
        .catch((err) => {
          console.error('Failed to load lessons:', err);
          setLoading(false);
        });
    });
  }, [class_id, subgroup_id]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      {/* Header */}
      <header className="bg-primary border-2 border-primary shadow-soft sticky top-0 z-10">
        <div className="container max-w-2xl mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-lg font-bold text-primary-foreground">{t.showDayPlan}</h1>
            <p className="text-sm text-primary-foreground/80">{class_label}</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container max-w-2xl mx-auto px-4 py-8 pb-28 space-y-4">
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

        {!loading && lessons.map((group, idx) => (
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
        ))}
      </main>

      <BottomNav />
    </div>
  );
};

export default TodayPlan;

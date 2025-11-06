import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { Lesson, Weekday } from '@/types/schedule';
import { Clock, MapPin } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const WeekPlan = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(false);
  
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
    fetch(`/data/classes/${class_id}.json`)
      .then((res) => res.json())
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
  }, [class_id, subgroup_id]);

  const getLessonsForDay = (weekday: Weekday) => {
    return lessons
      .filter(l => l.weekday === weekday)
      .sort((a, b) => a.period - b.period);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10 shadow-soft">
        <div className="container max-w-4xl mx-auto px-4 py-4">
          <div className="text-center">
            <h1 className="text-lg font-bold text-foreground">{t.showWeekPlan}</h1>
            <p className="text-sm text-muted-foreground">{class_label}</p>
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
              <TabsContent key={day.key} value={day.key} className="space-y-3">
                {getLessonsForDay(day.key).length === 0 ? (
                  <Alert>
                    <AlertDescription className="text-center">
                      {t.noLessonsToday}
                    </AlertDescription>
                  </Alert>
                ) : (
                  getLessonsForDay(day.key).map((lesson, idx) => (
                    <Card key={idx} className="p-4 transition-smooth hover:shadow-medium">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg text-foreground mb-1">
                            {lesson.subject}
                          </h3>
                          {lesson.subgroup_label && (
                            <p className="text-sm text-muted-foreground mb-2">
                              {lesson.subgroup_label}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              <span>{lesson.room}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              <span>{lesson.start_time} - {lesson.end_time}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-primary">
                          {t.period} {lesson.period}
                        </div>
                      </div>
                    </Card>
                  ))
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </main>

      <BottomNav />
    </div>
  );
};

export default WeekPlan;

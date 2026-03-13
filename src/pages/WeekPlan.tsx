import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BottomNav } from '@/components/BottomNav';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';
import { Lesson, Weekday } from '@/types/schedule';
import { Substitution, AppliedSubstitution } from '@/types/substitution';
import { loadSubstitutions, getWeekdayDateString, findSubstitution } from '@/lib/substitutions';
import { Clock, MapPin, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Header from '@/components/Header';

interface LessonWithSub extends Lesson {
  _substitution?: AppliedSubstitution | null;
}

const WeekPlan = () => {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [substitutions, setSubstitutions] = useState<Substitution[]>([]);
  const [loading, setLoading] = useState(false);

  const { class_id, class_label, subgroup_id, language, substitutionsSheetUrl } = useSettingsStore();
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
    Promise.all([
      import('@/lib/xmlParser').then(({ getLessonsForClass }) => getLessonsForClass(class_id)),
      loadSubstitutions(substitutionsSheetUrl),
    ]).then(([data, subs]) => {
      const filtered = data
        .filter(l => l.class_id === class_id)
        .filter(l => {
          if (!subgroup_id) return true;
          return l.subgroup_id === '' || l.subgroup_id === subgroup_id;
        });
      setLessons(filtered);
      setSubstitutions(subs);
      setLoading(false);
    }).catch((err) => {
      console.error('Failed to load lessons:', err);
      setLoading(false);
    });
  }, [class_id, subgroup_id, substitutionsSheetUrl]);

  const getLessonsForDay = (weekday: Weekday) => {
    const dateStr = getWeekdayDateString(weekday);
    const dayLessons: LessonWithSub[] = lessons
      .filter(l => l.weekday === weekday)
      .sort((a, b) => a.period - b.period)
      .map(l => {
        const sub = findSubstitution(l, dateStr, substitutions);
        if (sub && sub.substitution.type === 'change') {
          return {
            ...l,
            subject: sub.substitution.new_subject || l.subject,
            teacher: sub.substitution.new_teacher || l.teacher,
            room: sub.substitution.new_room || l.room,
            _substitution: sub,
          };
        }
        return { ...l, _substitution: sub };
      });
    
    const groupedByPeriod = dayLessons.reduce((acc, lesson) => {
      const key = `${lesson.period}-${lesson.start_time}`;
      if (!acc[key]) {
        acc[key] = { period: lesson.period, start_time: lesson.start_time, end_time: lesson.end_time, lessons: [] };
      }
      acc[key].lessons.push(lesson);
      return acc;
    }, {} as Record<string, { period: number; start_time: string; end_time: string; lessons: LessonWithSub[] }>);
    
    return Object.values(groupedByPeriod);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background">
      <Header
        title={t.showWeekPlan}
        maxWidth="max-w-4xl"
        onTitleClick={() => navigate('/')}
        subtitle={class_label || ''}
      />

      <main className="container max-w-4xl mx-auto px-4 py-8 pb-28">
        {loading && (
          <Alert>
            <AlertDescription className="text-center">Ładowanie...</AlertDescription>
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
                    <AlertDescription className="text-center">{t.noLessonsToday}</AlertDescription>
                  </Alert>
                ) : (
                  getLessonsForDay(day.key).map((group, idx) => (
                    <div key={idx} className="flex gap-4 items-start">
                      <div className="flex flex-col gap-1 min-w-[120px] pt-4">
                        <span className="text-primary font-medium text-sm mb-1">
                          {t.period} {group.period}
                        </span>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span className="font-medium">{group.start_time} - {group.end_time}</span>
                        </div>
                      </div>
                      
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {group.lessons.map((lesson, lessonIdx) => {
                          const sub = (lesson as LessonWithSub)._substitution;
                          const isCancelled = sub?.substitution.type === 'cancel';
                          const isChanged = sub?.substitution.type === 'change';
                          const hasSub = isCancelled || isChanged;

                          return (
                            <Card key={lessonIdx} className={`p-4 transition-smooth hover:shadow-medium ${
                              isCancelled ? 'opacity-60' : ''
                            } ${hasSub ? 'border-2 border-destructive/50' : ''}`}>
                              {hasSub && (
                                <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
                                  <AlertTriangle className="h-3 w-3" />
                                  {isCancelled ? t.cancelled : t.substitution}
                                </div>
                              )}
                              {isChanged && sub.original.subject !== lesson.subject && (
                                <p className="text-xs text-muted-foreground line-through">{sub.original.subject}</p>
                              )}
                              <h3 className={`font-bold text-base text-foreground mb-2 ${isCancelled ? 'line-through' : ''}`}>
                                {lesson.subject}
                              </h3>
                              {lesson.subgroup_label && (
                                <p className="text-xs text-muted-foreground mb-2">{lesson.subgroup_label}</p>
                              )}
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {isChanged && sub.original.room !== lesson.room && (
                                  <span className="line-through mr-1 text-muted-foreground/60">{sub.original.room}</span>
                                )}
                                <span className={isCancelled ? 'line-through' : ''}>{lesson.room}</span>
                              </div>
                              {sub?.substitution.note && (
                                <p className="text-xs text-destructive mt-2">{sub.substitution.note}</p>
                              )}
                            </Card>
                          );
                        })}
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
    </div>
  );
};

export default WeekPlan;

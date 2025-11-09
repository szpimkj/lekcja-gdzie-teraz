import { Lesson } from '@/types/schedule';
import { Card } from '@/components/ui/card';
import { Clock, MapPin, User } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';

interface LessonCardProps {
  lesson: Lesson;
  status?: 'current' | 'next';
  minutesInfo?: string;
  className?: string;
}

export function LessonCard({ lesson, status, minutesInfo, className = '' }: LessonCardProps) {
  const language = useSettingsStore((state) => state.language);
  const t = translations[language];

  return (
    <Card className={`p-6 transition-smooth hover:shadow-medium ${
      status === 'current' ? 'border-2 border-accent shadow-large' : ''
    } ${className}`}>
      {status && (
        <div className={`mb-4 text-xs font-semibold uppercase tracking-wider ${
          status === 'current'
            ? 'text-accent'
            : 'text-primary'
        }`}>
          {status === 'current' ? t.current : t.next}
        </div>
      )}

      <div className="space-y-4">
        <div>
          <h3 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3 flex-wrap">
            <span>{lesson.subject}</span>
            <span className="text-muted-foreground font-normal">|</span>
            <span className="flex items-center gap-2 text-primary">
              <MapPin className="h-8 w-8" />
              <span className="text-5xl font-black">{lesson.room}</span>
            </span>
          </h3>
          {lesson.subgroup_label && (
            <p className="text-sm font-medium text-muted-foreground">{lesson.subgroup_label}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-5 w-5 text-primary" />
            <span className="font-semibold text-base">{lesson.start_time} - {lesson.end_time}</span>
          </div>

          {lesson.teacher && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-5 w-5 text-primary" />
              <span className="font-medium">{lesson.teacher}</span>
            </div>
          )}
        </div>

        {minutesInfo && (
          <div className={`mt-4 p-4 rounded-lg text-center ${
            status === 'current'
              ? 'bg-accent/20 border-2 border-accent/30'
              : 'bg-primary/20 border-2 border-primary/30'
          }`}>
            <p className={`text-lg font-bold ${
              status === 'current' ? 'text-accent' : 'text-primary'
            }`}>{minutesInfo}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

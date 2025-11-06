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
    <Card className={`p-6 transition-smooth hover:shadow-medium ${className}`}>
      {status && (
        <div className={`mb-3 text-sm font-medium ${
          status === 'current' 
            ? 'text-accent' 
            : 'text-primary'
        }`}>
          {status === 'current' ? t.current : t.next}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-1">{lesson.subject}</h3>
          {lesson.subgroup_label && (
            <p className="text-sm text-muted-foreground">{lesson.subgroup_label}</p>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <MapPin className="h-4 w-4" />
            <span className="font-medium">{lesson.room}</span>
          </div>
          
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{lesson.start_time} - {lesson.end_time}</span>
          </div>
          
          {lesson.teacher && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <User className="h-4 w-4" />
              <span>{lesson.teacher}</span>
            </div>
          )}
        </div>

        {minutesInfo && (
          <div className="pt-2 border-t border-border">
            <p className="text-sm text-muted-foreground">{minutesInfo}</p>
          </div>
        )}
      </div>
    </Card>
  );
}

import { memo } from 'react';
import { Lesson } from '@/types/schedule';
import { AppliedSubstitution } from '@/types/substitution';
import { Card } from '@/components/ui/card';
import { Clock, MapPin, User, AlertTriangle } from 'lucide-react';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';

interface LessonCardProps {
  lesson: Lesson;
  status?: 'current' | 'next';
  minutesInfo?: string;
  className?: string;
  substitution?: AppliedSubstitution | null;
}

export const LessonCard = memo(({ lesson, status, minutesInfo, className = '', substitution }: LessonCardProps) => {
  const language = useSettingsStore((state) => state.language);
  const t = translations[language];

  const isCancelled = substitution?.substitution.type === 'cancel';
  const isChanged = substitution?.substitution.type === 'change';
  const hasSubstitution = isCancelled || isChanged;

  return (
    <Card className={`p-6 transition-smooth hover:shadow-medium ${
      status === 'current' ? 'border-2 border-accent shadow-large' : ''
    } ${isCancelled ? 'opacity-60' : ''} ${hasSubstitution ? 'border-2 border-destructive/50' : ''} ${className}`}>
      {/* Substitution badge */}
      {hasSubstitution && (
        <div className="mb-4 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-destructive">
          <AlertTriangle className="h-4 w-4" />
          {isCancelled ? t.cancelled : t.substitution}
        </div>
      )}

      {status && !hasSubstitution && (
        <div className={`mb-4 text-xs font-semibold uppercase tracking-wider ${
          status === 'current'
            ? 'text-accent'
            : 'text-primary'
        }`}>
          {status === 'current' ? t.current : t.next}
        </div>
      )}

      <div className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 space-y-2">
            {/* Subject */}
            <div>
              {isChanged && substitution.original.subject !== lesson.subject && (
                <p className="text-lg text-muted-foreground line-through">{substitution.original.subject}</p>
              )}
              <h3 className={`text-3xl font-bold text-foreground ${isCancelled ? 'line-through' : ''}`}>
                {lesson.subject}
              </h3>
            </div>

            {lesson.subgroup_label && (
              <p className="text-sm font-medium text-muted-foreground">{lesson.subgroup_label}</p>
            )}

            {/* Time */}
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-5 w-5 text-primary" />
              <span className={`font-semibold text-base ${isCancelled ? 'line-through' : ''}`}>
                {lesson.start_time} - {lesson.end_time}
              </span>
            </div>

            {/* Teacher */}
            {lesson.teacher && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-5 w-5 text-primary" />
                <span className="font-medium">
                  {isChanged && substitution.original.teacher && substitution.original.teacher !== lesson.teacher && (
                    <span className="line-through mr-2 text-muted-foreground/60">{substitution.original.teacher}</span>
                  )}
                  <span className={isCancelled ? 'line-through' : ''}>{lesson.teacher}</span>
                </span>
              </div>
            )}
          </div>

          {/* Room */}
          <div className={`border-2 rounded-xl p-4 text-center min-w-[120px] ${
            isCancelled 
              ? 'bg-destructive/10 border-destructive/30' 
              : hasSubstitution 
                ? 'bg-destructive/10 border-destructive/50' 
                : 'bg-primary/20 border-primary'
          }`}>
            <MapPin className={`h-6 w-6 mx-auto mb-2 ${hasSubstitution ? 'text-destructive' : 'text-primary'}`} />
            {isChanged && substitution.original.room !== lesson.room && (
              <div className="text-sm text-muted-foreground line-through">{substitution.original.room}</div>
            )}
            <div className={`text-5xl font-black leading-none ${
              isCancelled ? 'text-destructive/50 line-through' : hasSubstitution ? 'text-destructive' : 'text-primary'
            }`}>
              {lesson.room}
            </div>
          </div>
        </div>

        {/* Substitution note */}
        {substitution?.substitution.note && (
          <div className="mt-3 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              {t.substitutionNote}: {substitution.substitution.note}
            </p>
          </div>
        )}

        {minutesInfo && !isCancelled && (
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
});

LessonCard.displayName = 'LessonCard';

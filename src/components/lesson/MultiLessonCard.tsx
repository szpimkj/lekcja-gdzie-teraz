import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin, AlertTriangle } from 'lucide-react';
import { Lesson } from '@/types/schedule';
import { AppliedSubstitution } from '@/types/substitution';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';

interface MultiLessonCardProps {
  lesson: Lesson;
  status: 'current' | 'next' | 'end-of-day' | 'no-data';
  substitution?: AppliedSubstitution | null;
}

/**
 * Compact lesson card for displaying multiple lessons at once (subgroups)
 */
export const MultiLessonCard = memo(({ lesson, status, substitution }: MultiLessonCardProps) => {
  const language = useSettingsStore((state) => state.language);
  const t = translations[language];

  const isCancelled = substitution?.substitution.type === 'cancel';
  const isChanged = substitution?.substitution.type === 'change';
  const hasSubstitution = isCancelled || isChanged;

  return (
    <Card className={`p-4 transition-smooth hover:shadow-medium ${
      status === 'current' ? 'border-accent border-2' : ''
    } ${isCancelled ? 'opacity-60' : ''} ${hasSubstitution ? 'border-destructive/50 border-2' : ''}`}>
      {hasSubstitution && (
        <div className="mb-2 flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-destructive">
          <AlertTriangle className="h-3 w-3" />
          {isCancelled ? t.cancelled : t.substitution}
        </div>
      )}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          {isChanged && substitution.original.subject !== lesson.subject && (
            <p className="text-xs text-muted-foreground line-through">{substitution.original.subject}</p>
          )}
          <h3 className={`font-bold text-lg text-foreground mb-1 ${isCancelled ? 'line-through' : ''}`}>
            {lesson.subject}
          </h3>
          {lesson.subgroup_label && (
            <p className="text-xs text-muted-foreground">
              {lesson.subgroup_label}
            </p>
          )}
          {substitution?.substitution.note && (
            <p className="text-xs text-destructive mt-1">{substitution.substitution.note}</p>
          )}
        </div>
        <div className={`border-2 rounded-lg p-2 text-center min-w-[70px] ${
          hasSubstitution ? 'bg-destructive/10 border-destructive/50' : 'bg-primary/20 border-primary'
        }`}>
          <MapPin className={`h-4 w-4 mx-auto mb-1 ${hasSubstitution ? 'text-destructive' : 'text-primary'}`} />
          {isChanged && substitution.original.room !== lesson.room && (
            <div className="text-xs text-muted-foreground line-through">{substitution.original.room}</div>
          )}
          <div className={`text-2xl font-black leading-none ${
            isCancelled ? 'text-destructive/50 line-through' : hasSubstitution ? 'text-destructive' : 'text-primary'
          }`}>
            {lesson.room}
          </div>
        </div>
      </div>
    </Card>
  );
});

MultiLessonCard.displayName = 'MultiLessonCard';

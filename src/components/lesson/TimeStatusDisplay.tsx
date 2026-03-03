import { memo } from 'react';
import { formatTimeUntil } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';


interface BreakTimeDisplayProps {
  minutesUntil: number;
}

/**
 * Display component for break time between lessons
 */
export const BreakTimeDisplay = memo(({ minutesUntil }: BreakTimeDisplayProps) => {
  const language = useSettingsStore((state) => state.language);
  const t = translations[language];

  return (
    <div className="mb-8 p-6 bg-primary/10 rounded-2xl border-2 border-primary/20">
      <div className="text-center">
        <div className="text-sm font-medium text-muted-foreground mb-2">
          {t.breakTime}
        </div>
        <div className="text-lg font-semibold text-foreground mb-3">
          {t.nextLessonStartsIn}
        </div>
        <div className="text-5xl font-bold text-primary">
          {formatTimeUntil(minutesUntil, { days: t.days, hours: t.hours, minutes: t.minutes })}
        </div>
      </div>
    </div>
  );
});

BreakTimeDisplay.displayName = 'BreakTimeDisplay';

interface CurrentLessonDisplayProps {
  minutesRemaining: number;
}

/**
 * Display component for current lesson time remaining
 */
export const CurrentLessonDisplay = memo(({ minutesRemaining }: CurrentLessonDisplayProps) => {
  const language = useSettingsStore((state) => state.language);
  const t = translations[language];

  return (
    <div className="text-center mb-8 p-6 bg-accent/10 rounded-2xl border-2 border-accent/20">
      <div className="text-lg font-semibold text-foreground mb-3">
        {t.currentLesson}
      </div>
      <div>
        <div className="text-5xl font-bold text-accent mb-1">
          {formatTimeUntil(minutesRemaining, { days: t.days, hours: t.hours, minutes: t.minutes })}
        </div>
        <div className="text-sm text-muted-foreground">
          {t.timeRemainingUntilEnd}
        </div>
      </div>
    </div>
  );
});

CurrentLessonDisplay.displayName = 'CurrentLessonDisplay';

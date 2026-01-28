import { memo } from 'react';
import { Clock } from 'lucide-react';
import { formatTimeUntil } from '@/lib/utils';
import { useSettingsStore } from '@/stores/settingsStore';
import { translations } from '@/lib/i18n';

interface LessonTimeInfoProps {
  period: number;
  startTime: string;
  endTime: string;
  minutesRemaining?: number;
}

/**
 * Display component for lesson time information (period, time range, countdown)
 */
export const LessonTimeInfo = memo(({
  period,
  startTime,
  endTime,
  minutesRemaining
}: LessonTimeInfoProps) => {
  const language = useSettingsStore((state) => state.language);
  const t = translations[language];

  return (
    <div className="flex flex-col gap-2 min-w-[140px] pt-2">
      <div className="bg-primary/10 rounded-lg p-3 border border-primary/20">
        <span className="text-primary font-bold text-lg block mb-2">
          {t.period} {period}
        </span>
        <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
          <Clock className="h-4 w-4" />
          <span className="font-medium">{startTime} - {endTime}</span>
        </div>
        {minutesRemaining && (
          <div className="text-center p-2 bg-accent/20 rounded-lg border border-accent/30">
            <div className="text-xs text-muted-foreground mb-1">{t.remaining}</div>
            <div className="text-2xl font-bold text-accent">
              {formatTimeUntil(minutesRemaining, { days: t.days, hours: t.hours, minutes: t.minutes })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

LessonTimeInfo.displayName = 'LessonTimeInfo';

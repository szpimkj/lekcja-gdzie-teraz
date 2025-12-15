import { memo } from 'react';
import { Card } from '@/components/ui/card';
import { MapPin } from 'lucide-react';
import { Lesson } from '@/types/schedule';

interface MultiLessonCardProps {
  lesson: Lesson;
  status: 'current' | 'next' | 'end-of-day' | 'no-data';
}

/**
 * Compact lesson card for displaying multiple lessons at once (subgroups)
 */
export const MultiLessonCard = memo(({ lesson, status }: MultiLessonCardProps) => {
  return (
    <Card className={`p-4 transition-smooth hover:shadow-medium ${
      status === 'current' ? 'border-accent border-2' : ''
    }`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <h3 className="font-bold text-lg text-foreground mb-1">
            {lesson.subject}
          </h3>
          {lesson.subgroup_label && (
            <p className="text-xs text-muted-foreground">
              {lesson.subgroup_label}
            </p>
          )}
        </div>
        <div className="bg-primary/20 border-2 border-primary rounded-lg p-2 text-center min-w-[70px]">
          <MapPin className="h-4 w-4 text-primary mx-auto mb-1" />
          <div className="text-2xl font-black text-primary leading-none">
            {lesson.room}
          </div>
        </div>
      </div>
    </Card>
  );
});

MultiLessonCard.displayName = 'MultiLessonCard';

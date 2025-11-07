import { DateTime } from 'luxon';
import { Lesson, Weekday, CurrentLessonInfo } from '@/types/schedule';
import { translations, TranslationKey } from './i18n';

const TIMEZONE = 'Europe/Warsaw';

export const WEEKDAY_MAP: Record<string, Weekday> = {
  'MON': 'MON',
  'TUE': 'TUE',
  'WED': 'WED',
  'THU': 'THU',
  'FRI': 'FRI',
  'Pn': 'MON',
  'Wt': 'TUE',
  'Śr': 'WED',
  'Czw': 'THU',
  'Pi': 'FRI',
};

export function getCurrentWeekday(): Weekday | null {
  const now = DateTime.now().setZone(TIMEZONE);
  const dayOfWeek = now.weekday; // 1=Mon, 7=Sun
  
  if (dayOfWeek >= 1 && dayOfWeek <= 5) {
    return ['MON', 'TUE', 'WED', 'THU', 'FRI'][dayOfWeek - 1] as Weekday;
  }
  
  return null; // Weekend
}

export function parseTime(timeStr: string): { hour: number; minute: number } {
  const [hour, minute] = timeStr.split(':').map(Number);
  return { hour, minute };
}

export function isTimeBetween(now: DateTime, startTime: string, endTime: string): boolean {
  const start = parseTime(startTime);
  const end = parseTime(endTime);
  
  const startDT = now.set({ hour: start.hour, minute: start.minute, second: 0 });
  const endDT = now.set({ hour: end.hour, minute: end.minute, second: 0 });
  
  return now >= startDT && now < endDT;
}

export function getMinutesUntil(now: DateTime, timeStr: string): number {
  const time = parseTime(timeStr);
  const target = now.set({ hour: time.hour, minute: time.minute, second: 0 });
  
  return Math.floor(target.diff(now, 'minutes').minutes);
}

export function getMinutesRemaining(now: DateTime, timeStr: string): number {
  const time = parseTime(timeStr);
  const target = now.set({ hour: time.hour, minute: time.minute, second: 0 });
  
  return Math.floor(target.diff(now, 'minutes').minutes);
}

export function getCurrentOrNextLesson(
  lessons: Lesson[],
  class_id: string,
  subgroup_id: string | null,
  language: 'pl' | 'en' = 'pl'
): CurrentLessonInfo | CurrentLessonInfo[] | null {
  const now = DateTime.now().setZone(TIMEZONE);
  const currentWeekday = getCurrentWeekday();
  
  if (!currentWeekday) {
    // Weekend - find Monday's first lesson
    const mondayLessons = filterLessons(lessons, class_id, 'MON', subgroup_id);
    if (mondayLessons.length === 0) return null;
    
    const firstLesson = mondayLessons.sort((a, b) => a.period - b.period)[0];
    return {
      lesson: firstLesson,
      status: 'next',
      minutesUntil: undefined,
      message: `${translations[language].nextLessonTomorrow}: ${firstLesson.subject} ${firstLesson.start_time} — ${translations[language].room} ${firstLesson.room}`,
    };
  }
  
  const todayLessons = filterLessons(lessons, class_id, currentWeekday, subgroup_id);
  
  // Check if currently in a lesson
  for (const lesson of todayLessons) {
    if (isTimeBetween(now, lesson.start_time, lesson.end_time)) {
      const minutesRemaining = getMinutesRemaining(now, lesson.end_time);
      
      // If no subgroup selected and multiple groups for this period, return all
      if (!subgroup_id) {
        const sameTimeLessons = todayLessons.filter(
          l => l.start_time === lesson.start_time && l.end_time === lesson.end_time
        );
        
        if (sameTimeLessons.length > 1) {
          return sameTimeLessons.map(l => ({
            lesson: l,
            status: 'current' as const,
            minutesRemaining,
            message: `${translations[language].current}: ${l.subject} — ${translations[language].room} ${l.room} (${translations[language].until} ${l.end_time}, ${translations[language].remaining} ${minutesRemaining} ${translations[language].minutesShort})`,
          }));
        }
      }
      
      return {
        lesson,
        status: 'current',
        minutesRemaining,
        message: `${translations[language].current}: ${lesson.subject} — ${translations[language].room} ${lesson.room} (${translations[language].until} ${lesson.end_time}, ${translations[language].remaining} ${minutesRemaining} ${translations[language].minutesShort})`,
      };
    }
  }
  
  // Find next lesson today
  const upcomingLessons = todayLessons
    .filter(l => {
      const lessonStart = parseTime(l.start_time);
      const lessonTime = now.set({ hour: lessonStart.hour, minute: lessonStart.minute });
      return lessonTime > now;
    })
    .sort((a, b) => a.period - b.period);
  
  if (upcomingLessons.length > 0) {
    const nextLesson = upcomingLessons[0];
    const minutesUntil = getMinutesUntil(now, nextLesson.start_time);
    
    // Check for multiple groups at same time
    if (!subgroup_id) {
      const sameTimeLessons = upcomingLessons.filter(
        l => l.start_time === nextLesson.start_time && l.end_time === nextLesson.end_time
      );
      
      if (sameTimeLessons.length > 1) {
        return sameTimeLessons.map(l => ({
          lesson: l,
          status: 'next' as const,
          minutesUntil,
          message: `${translations[language].next}: ${l.subject} — ${translations[language].room} ${l.room} ${translations[language].in} ${l.start_time} (${translations[language].in} ${minutesUntil} ${translations[language].minutesShort})`,
        }));
      }
    }
    
    return {
      lesson: nextLesson,
      status: 'next',
      minutesUntil,
      message: `${translations[language].next}: ${nextLesson.subject} — ${translations[language].room} ${nextLesson.room} ${translations[language].in} ${nextLesson.start_time} (${translations[language].in} ${minutesUntil} ${translations[language].minutesShort})`,
    };
  }
  
  // No more lessons today - find tomorrow's first
  const nextWeekday = getNextWeekday(currentWeekday);
  const tomorrowLessons = filterLessons(lessons, class_id, nextWeekday, subgroup_id);

  if (tomorrowLessons.length > 0) {
    const firstLesson = tomorrowLessons.sort((a, b) => a.period - b.period)[0];

    // Calculate minutes until tomorrow's lesson, accounting for weekends
    const lessonTime = parseTime(firstLesson.start_time);
    const daysUntilNextLesson = getDaysUntilWeekday(currentWeekday, nextWeekday);
    const nextLessonDate = now.plus({ days: daysUntilNextLesson }).set({ hour: lessonTime.hour, minute: lessonTime.minute, second: 0 });
    const minutesUntil = Math.floor(nextLessonDate.diff(now, 'minutes').minutes);

    return {
      lesson: firstLesson,
      status: 'end-of-day',
      minutesUntil,
      message: `${translations[language].endOfDay}. ${translations[language].nextLessonTomorrow}: ${firstLesson.subject} ${firstLesson.start_time} — ${translations[language].room} ${firstLesson.room}`,
    };
  }
  
  return null;
}

function filterLessons(
  lessons: Lesson[],
  class_id: string,
  weekday: Weekday,
  subgroup_id: string | null
): Lesson[] {
  return lessons
    .filter(l => l.class_id === class_id && l.weekday === weekday)
    .filter(l => {
      if (!subgroup_id) {
        // Include all lessons (whole class + all subgroups)
        return true;
      }
      // Include whole class lessons and matching subgroup
      return l.subgroup_id === '' || l.subgroup_id === subgroup_id;
    })
    .sort((a, b) => {
      if (a.period !== b.period) return a.period - b.period;
      return a.priority - b.priority;
    });
}

function getNextWeekday(current: Weekday): Weekday {
  const weekdays: Weekday[] = ['MON', 'TUE', 'WED', 'THU', 'FRI'];
  const index = weekdays.indexOf(current);
  return weekdays[(index + 1) % 5];
}

function getDaysUntilWeekday(current: Weekday, target: Weekday): number {
  // If transitioning from Friday to Monday, we need to account for the weekend
  if (current === 'FRI' && target === 'MON') {
    return 3; // Saturday + Sunday + Monday
  }
  // For all other weekday transitions, it's just 1 day
  return 1;
}

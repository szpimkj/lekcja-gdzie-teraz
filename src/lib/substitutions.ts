import { Substitution, AppliedSubstitution } from '@/types/substitution';
import { Lesson, Weekday } from '@/types/schedule';
import { DateTime } from 'luxon';
import { TIMEZONE } from './constants';

let cachedSubstitutions: Substitution[] | null = null;

export async function loadSubstitutions(): Promise<Substitution[]> {
  if (cachedSubstitutions) return cachedSubstitutions;

  try {
    const response = await fetch(import.meta.env.BASE_URL + 'data/substitutions.json');
    if (!response.ok) {
      cachedSubstitutions = [];
      return [];
    }
    const data = await response.json();
    cachedSubstitutions = Array.isArray(data) ? data : [];
    return cachedSubstitutions;
  } catch {
    cachedSubstitutions = [];
    return [];
  }
}

/** Get today's date string in YYYY-MM-DD */
export function getTodayDateString(): string {
  return DateTime.now().setZone(TIMEZONE).toFormat('yyyy-MM-dd');
}

/** Get a specific weekday's date for the current week */
export function getWeekdayDateString(weekday: Weekday): string {
  const now = DateTime.now().setZone(TIMEZONE);
  const weekdayMap: Record<Weekday, number> = {
    MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5,
  };
  const targetDay = weekdayMap[weekday];
  const currentDay = now.weekday;
  const diff = targetDay - currentDay;
  return now.plus({ days: diff }).toFormat('yyyy-MM-dd');
}

/** Find substitution for a specific lesson on a given date */
export function findSubstitution(
  lesson: Lesson,
  date: string,
  substitutions: Substitution[]
): AppliedSubstitution | null {
  const match = substitutions.find(s =>
    s.date === date &&
    s.class_id === lesson.class_id &&
    s.period === lesson.period &&
    (!s.original_subject || s.original_subject === lesson.subject) &&
    (!s.subgroup_id || s.subgroup_id === lesson.subgroup_id)
  );

  if (!match) return null;

  return {
    original: {
      subject: lesson.subject,
      teacher: lesson.teacher,
      room: lesson.room,
    },
    substitution: match,
  };
}

/** Apply substitution to a lesson, returning a modified copy */
export function applySubstitution(lesson: Lesson, sub: AppliedSubstitution): Lesson {
  if (sub.substitution.type === 'cancel') {
    return { ...lesson, notes: 'cancelled' };
  }

  return {
    ...lesson,
    subject: sub.substitution.new_subject || lesson.subject,
    teacher: sub.substitution.new_teacher || lesson.teacher,
    room: sub.substitution.new_room || lesson.room,
  };
}

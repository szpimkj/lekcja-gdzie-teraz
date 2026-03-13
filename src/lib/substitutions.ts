import { Substitution, AppliedSubstitution } from '@/types/substitution';
import { Lesson, Weekday } from '@/types/schedule';
import { DateTime } from 'luxon';
import { TIMEZONE } from './constants';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedSubstitutions: Substitution[] | null = null;
let cacheTimestamp = 0;

/**
 * Parse CSV text into Substitution objects.
 * Expected columns: data_od, data_do, klasa, lekcja, typ, nowy_przedmiot, nowy_nauczyciel, nowa_sala, uwaga
 */
function parseCSV(csvText: string): Substitution[] {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  // Skip header row
  const results: Substitution[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    if (values.length < 5) continue;

    const [dateFrom, dateTo, classId, period, typ, newSubject, newTeacher, newRoom, note] = values;

    const periodNum = parseInt(period?.trim() || '0', 10);
    if (!dateFrom?.trim() || !classId?.trim() || isNaN(periodNum) || periodNum <= 0) continue;

    const typeNormalized = typ?.trim().toLowerCase();
    const type: 'change' | 'cancel' =
      typeNormalized === 'odwołanie' || typeNormalized === 'odwolanie' || typeNormalized === 'cancel'
        ? 'cancel'
        : 'change';

    results.push({
      date_from: dateFrom.trim(),
      date_to: (dateTo?.trim() || dateFrom.trim()),
      class_id: classId.trim().toLowerCase().replace(/\s+/g, ''),
      period: periodNum,
      type,
      new_subject: newSubject?.trim() || undefined,
      new_teacher: newTeacher?.trim() || undefined,
      new_room: newRoom?.trim() || undefined,
      note: note?.trim() || undefined,
    });
  }

  return results;
}

/** Parse a single CSV line handling quoted fields */
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);
  return result;
}

/** Fetch substitutions from a published Google Sheets CSV URL */
export async function loadSubstitutions(sheetUrl: string | null): Promise<Substitution[]> {
  if (!sheetUrl) return [];

  const now = Date.now();
  if (cachedSubstitutions && now - cacheTimestamp < CACHE_TTL_MS) {
    return cachedSubstitutions;
  }

  try {
    const response = await fetch(sheetUrl);
    if (!response.ok) {
      console.warn('Failed to fetch substitutions:', response.status);
      return cachedSubstitutions || [];
    }
    const csvText = await response.text();
    cachedSubstitutions = parseCSV(csvText);
    cacheTimestamp = now;
    return cachedSubstitutions;
  } catch (err) {
    console.warn('Error loading substitutions:', err);
    return cachedSubstitutions || [];
  }
}

/** Clear substitutions cache (e.g., when URL changes) */
export function clearSubstitutionsCache() {
  cachedSubstitutions = null;
  cacheTimestamp = 0;
}

/** Check if a date string falls within a substitution's date range */
function isDateInRange(dateStr: string, dateFrom: string, dateTo: string): boolean {
  return dateStr >= dateFrom && dateStr <= dateTo;
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
    isDateInRange(date, s.date_from, s.date_to) &&
    s.class_id === lesson.class_id &&
    s.period === lesson.period
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

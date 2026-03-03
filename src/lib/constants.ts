/**
 * Application-wide constants
 */

// Timezone configuration
export const TIMEZONE = 'Europe/Warsaw';

// Update intervals (in milliseconds)
export const CLOCK_UPDATE_INTERVAL = 1000; // 1 second
export const LESSON_UPDATE_INTERVAL = 60000; // 1 minute
export const AUTO_REDIRECT_TIMEOUT = 10000; // 10 seconds

// Time conversion constants
export const MINUTES_IN_HOUR = 60;
export const MINUTES_IN_DAY = 1440;
export const HOURS_IN_DAY = 24;

// Roman numeral to Arabic conversion
export const ROMAN_TO_ARABIC: Record<string, string> = {
  'I': '1',
  'II': '2',
  'III': '3',
  'IV': '4',
  'V': '5',
  'VI': '6',
  'VII': '7',
  'VIII': '8',
};

// Weekday constants
export const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI'] as const;
export const WEEKEND_DAYS = ['SAT', 'SUN'] as const;

// Storage keys
export const SETTINGS_STORAGE_KEY = 'timetable-settings';

// Fullscreen button opacity
export const FULLSCREEN_BUTTON_OPACITY = {
  default: 0.2,
  hover: 0.6,
};

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { MINUTES_IN_HOUR, MINUTES_IN_DAY } from './constants';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format time until/remaining in a human-readable format
 * @param minutes - Number of minutes
 * @param labels - Optional labels for days, hours, and minutes (defaults to 'd', 'h', 'min')
 * @returns Formatted string (e.g., "2d 3h 15min", "1h 30min", "45 min")
 */
export function formatTimeUntil(
  minutes: number,
  labels: { days?: string; hours?: string; minutes?: string } = {}
): string {
  const { days = 'd', hours = 'h', minutes: mins = 'min' } = labels;

  if (minutes >= MINUTES_IN_DAY) {
    // 24+ hours: show days, hours, and minutes
    const d = Math.floor(minutes / MINUTES_IN_DAY);
    const remaining = minutes % MINUTES_IN_DAY;
    const h = Math.floor(remaining / MINUTES_IN_HOUR);
    const m = remaining % MINUTES_IN_HOUR;
    return `${d}${days} ${h}${hours} ${m}${mins}`;
  } else if (minutes >= MINUTES_IN_HOUR) {
    // 1-23 hours: show hours and minutes
    const h = Math.floor(minutes / MINUTES_IN_HOUR);
    const m = minutes % MINUTES_IN_HOUR;
    return `${h}${hours} ${m}${mins}`;
  } else {
    // Less than 1 hour: show just minutes
    return `${minutes} ${mins}`;
  }
}

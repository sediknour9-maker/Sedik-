import { addDays } from './date';

/**
 * Counts consecutive active days ending today (or yesterday, so an
 * unfinished today doesn't break the streak). A day is active when it
 * appears in the given set of dates with logged food or activity.
 */
export function computeStreak(activeDates: string[], today: string): number {
  const dateSet = new Set(activeDates);
  let streak = 0;

  // An empty today keeps the streak alive as long as yesterday was active.
  let cursor = dateSet.has(today) ? today : addDays(today, -1);

  while (dateSet.has(cursor)) {
    streak += 1;
    cursor = addDays(cursor, -1);
  }
  return streak;
}

/** Longest run of consecutive active days ever recorded. */
export function computeLongestStreak(activeDates: string[]): number {
  const sorted = Array.from(new Set(activeDates)).sort();
  let longest = 0;
  let current = 0;
  let previous: string | null = null;

  for (const date of sorted) {
    current = previous !== null && addDays(previous, 1) === date ? current + 1 : 1;
    longest = Math.max(longest, current);
    previous = date;
  }
  return longest;
}

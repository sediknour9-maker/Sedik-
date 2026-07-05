import { toDateString } from './date';

/**
 * Counts consecutive active days ending today (or yesterday, so an
 * unfinished today doesn't break the streak). A day is active when it
 * appears in the given set of dates with logged food or activity.
 */
export function computeStreak(activeDates: string[], today: string): number {
  const dateSet = new Set(activeDates);
  let streak = 0;
  const cursor = parseDate(today);

  // An empty today keeps the streak alive as long as yesterday was active.
  if (!dateSet.has(today)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  while (dateSet.has(toDateString(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function parseDate(date: string): Date {
  const [year, month, day] = date.split('-').map(Number);
  return new Date(year, month - 1, day);
}

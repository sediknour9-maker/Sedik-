import type { Goal } from '../models/user';

/** "m:ss" for countdowns and stopwatches; negative input is treated as zero. */
export function formatClock(totalSeconds: number): string {
  const seconds = Math.max(0, Math.floor(totalSeconds));
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${`${seconds % 60}`.padStart(2, '0')}`;
}

// Shorter rests keep the heart rate up when cutting; longer ones allow heavier sets when building.
const REST_SECONDS_PER_GOAL: Record<Goal, number> = {
  lose: 45,
  maintain: 60,
  gain: 90,
};

export function restSecondsFor(goal: Goal): number {
  return REST_SECONDS_PER_GOAL[goal];
}

import { addDays, formatDate, lastNDates, parseDate } from '../src/services/date';
import { computeStrengthKcal } from '../src/services/cardioCalculator';
import { estimateDayMinutes, generatePlan } from '../src/services/planGenerator';
import { pushRecentFood } from '../src/services/recentFoods';
import { computeLongestStreak } from '../src/services/streakService';
import { formatClock, restSecondsFor } from '../src/services/workoutTiming';

describe('date helpers', () => {
  it('parses YYYY-MM-DD as local midnight', () => {
    const date = parseDate('2026-03-05');
    expect([date.getFullYear(), date.getMonth(), date.getDate(), date.getHours()]).toEqual([2026, 2, 5, 0]);
  });

  it('adds days across month and year boundaries', () => {
    expect(addDays('2026-01-31', 1)).toBe('2026-02-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('lists the last n days oldest first', () => {
    expect(lastNDates('2026-03-02', 3)).toEqual(['2026-02-28', '2026-03-01', '2026-03-02']);
  });

  it('formats dates per language and falls back to English for unknown ones', () => {
    expect(formatDate('2026-11-17', 'de', 'dayMonth')).toMatch(/17/);
    expect(formatDate('2026-11-17', 'xx', 'full')).toMatch(/November/);
  });
});

describe('workout timing', () => {
  it('formats seconds as m:ss and clamps negatives', () => {
    expect(formatClock(0)).toBe('0:00');
    expect(formatClock(65)).toBe('1:05');
    expect(formatClock(600)).toBe('10:00');
    expect(formatClock(-3)).toBe('0:00');
  });

  it('rests longer when building muscle than when cutting', () => {
    expect(restSecondsFor('lose')).toBeLessThan(restSecondsFor('maintain'));
    expect(restSecondsFor('maintain')).toBeLessThan(restSecondsFor('gain'));
  });

  it('estimates session length from sets and rest, in 5-minute steps', () => {
    const plan = generatePlan({ goal: 'maintain', activityLevel: 'moderate', equipment: 'gym' });
    const minutes = estimateDayMinutes(plan.days[0]);
    expect(minutes % 5).toBe(0);
    expect(minutes).toBeGreaterThanOrEqual(15);
    expect(minutes).toBeLessThanOrEqual(60);
  });

  it('computes strength-training calories from body weight and duration', () => {
    expect(computeStrengthKcal(80, 60)).toBe(280);
    expect(computeStrengthKcal(80, 30)).toBe(140);
  });
});

describe('computeLongestStreak', () => {
  it('finds the longest consecutive run, ignoring order and duplicates', () => {
    const dates = ['2026-01-05', '2026-01-01', '2026-01-02', '2026-01-02', '2026-01-03', '2026-01-07', '2026-01-06'];
    expect(computeLongestStreak(dates)).toBe(3);
  });

  it('returns 0 without any active day', () => {
    expect(computeLongestStreak([])).toBe(0);
  });
});

describe('pushRecentFood', () => {
  it('moves the food to the front without duplicates', () => {
    expect(pushRecentFood(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
    expect(pushRecentFood([], 'x')).toEqual(['x']);
  });

  it('keeps at most 12 foods', () => {
    const many = Array.from({ length: 12 }, (_, index) => `food${index}`);
    const next = pushRecentFood(many, 'new');
    expect(next).toHaveLength(12);
    expect(next[0]).toBe('new');
    expect(next).not.toContain('food11');
  });
});

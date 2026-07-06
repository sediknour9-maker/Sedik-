import { computeStreak } from '../src/services/streakService';

describe('streakService', () => {
  it('counts consecutive days ending today', () => {
    expect(computeStreak(['2026-07-03', '2026-07-04', '2026-07-05'], '2026-07-05')).toBe(3);
  });

  it('keeps the streak alive when today has no entry yet', () => {
    expect(computeStreak(['2026-07-03', '2026-07-04'], '2026-07-05')).toBe(2);
  });

  it('breaks the streak on a gap', () => {
    expect(computeStreak(['2026-07-01', '2026-07-02', '2026-07-04', '2026-07-05'], '2026-07-05')).toBe(2);
  });

  it('returns 0 with no active days', () => {
    expect(computeStreak([], '2026-07-05')).toBe(0);
  });

  it('returns 0 when the last active day is older than yesterday', () => {
    expect(computeStreak(['2026-07-01'], '2026-07-05')).toBe(0);
  });

  it('handles month boundaries', () => {
    expect(computeStreak(['2026-06-29', '2026-06-30', '2026-07-01'], '2026-07-01')).toBe(3);
  });
});

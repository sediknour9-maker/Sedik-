import { columnPath, nearestIndex, niceScale, niceStep, zeroBasedScale } from '../src/components/charts/scale';
import { daysBetween } from '../src/services/date';

describe('chart scale helpers', () => {
  it('rounds steps to 1, 2, 2.5 or 5 times a power of ten', () => {
    expect(niceStep(0.3)).toBe(0.5);
    expect(niceStep(1.7)).toBe(2);
    expect(niceStep(2.2)).toBe(2.5);
    expect(niceStep(700)).toBe(1000);
    expect(niceStep(0)).toBe(1);
  });

  it('builds a calorie axis from zero with clean ticks', () => {
    expect(niceScale(0, 2602, 3)).toEqual({ min: 0, max: 3000, ticks: [0, 1000, 2000, 3000] });
    // Close to the next tick: round up so the top gridline caps the plot.
    expect(zeroBasedScale(2903)).toEqual({ min: 0, max: 3000, ticks: [0, 1000, 2000, 3000] });
    // Far from it: keep the data maximum so the tallest column uses the full height.
    expect(zeroBasedScale(2100)).toEqual({ min: 0, max: 2100, ticks: [0, 1000, 2000] });
    expect(zeroBasedScale(0)).toEqual({ min: 0, max: 1, ticks: [0] });
  });

  it('widens nearly flat weight data to the minimum span', () => {
    const scale = niceScale(72.1, 72.3, 3, 2);
    expect(scale.min).toBeLessThanOrEqual(71.2);
    expect(scale.max).toBeGreaterThanOrEqual(73.2);
    expect(scale.ticks.length).toBeGreaterThanOrEqual(3);
    expect(scale.ticks.length).toBeLessThanOrEqual(5);
  });

  it('handles a single value and all-zero data', () => {
    expect(niceScale(5, 5).ticks.length).toBeGreaterThanOrEqual(2);
    expect(niceScale(0, 0)).toEqual({ min: 0, max: 1, ticks: [0, 0.5, 1] });
  });

  it('finds the nearest position', () => {
    expect(nearestIndex([10, 50, 90], 62)).toBe(1);
    expect(nearestIndex([10, 50, 90], 400)).toBe(2);
    expect(nearestIndex([90, 50, 10], 12)).toBe(2);
  });

  it('draws nothing for empty columns and clamps the corner radius', () => {
    expect(columnPath(0, 20, 100, 100)).toBe('');
    expect(columnPath(0, 20, 98, 100)).toContain('Q0,98 2,98');
  });

  it('counts calendar days between dates', () => {
    expect(daysBetween('2026-03-28', '2026-04-02')).toBe(5);
    expect(daysBetween('2026-11-17', '2026-11-10')).toBe(-7);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
  });
});

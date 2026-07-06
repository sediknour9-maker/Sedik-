import { computeCardioKcal } from '../src/services/cardioCalculator';

describe('cardioCalculator', () => {
  it('computes kcal via MET * weight * hours', () => {
    // Running (MET 9.8), 80kg, 60min -> 784 kcal
    expect(computeCardioKcal(9.8, 80, 60)).toBe(784);
  });

  it('scales linearly with duration', () => {
    expect(computeCardioKcal(9.8, 80, 30)).toBe(392);
  });

  it('rounds to whole kcal', () => {
    // Walking (MET 3.5), 72kg, 45min -> 189 kcal
    expect(computeCardioKcal(3.5, 72, 45)).toBe(189);
  });
});

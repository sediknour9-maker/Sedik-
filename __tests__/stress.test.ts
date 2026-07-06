import { aggregateMacros } from '../src/services/logRepository';
import { computeStreak } from '../src/services/streakService';
import { generatePlan } from '../src/services/planGenerator';
import { mergeFoods, searchFoods, computeMacrosForPortion } from '../src/services/foodRepository';
import { toDateString } from '../src/services/date';
import type { LogEntry } from '../src/models/log';
import type { FoodItem } from '../src/models/food';

function makeEntries(count: number): LogEntry[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `e${i}`,
    date: '2026-07-06',
    mealSlot: 'lunch' as const,
    foodId: 'harira',
    portionUnitKey: 'bowl',
    multiplier: 1,
    computed: { kcal: 180, proteinG: 8, carbsG: 24, fatG: 6 },
    loggedAt: new Date().toISOString(),
  }));
}

function makeCustomFoods(count: number): FoodItem[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `custom_${i}`,
    nameKey: '',
    customName: `Custom Food ${i}`,
    category: 'other' as const,
    portionUnits: [{ key: 'p', labelKey: 'portion.piece', gramsEquivalent: 100, isDefault: true }],
    perPortion: { kcal: 100, proteinG: 5, carbsG: 10, fatG: 3 },
    isCustom: true,
  }));
}

describe('stress: heavy-usage performance envelopes', () => {
  it('aggregates a 10,000-entry day under 100ms', () => {
    const entries = makeEntries(10_000);
    const start = performance.now();
    const total = aggregateMacros(entries);
    const ms = performance.now() - start;
    expect(total.kcal).toBe(1_800_000);
    expect(ms).toBeLessThan(100);
  });

  it('computes a 3-year streak under 50ms', () => {
    const dates: string[] = [];
    const cursor = new Date(2023, 6, 6);
    for (let i = 0; i < 1095; i++) {
      dates.push(toDateString(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    const start = performance.now();
    const streak = computeStreak(dates, '2026-07-04');
    const ms = performance.now() - start;
    expect(streak).toBe(1095);
    expect(ms).toBeLessThan(50);
  });

  it('generates 1,000 plans under 500ms', () => {
    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      generatePlan({ goal: 'gain', activityLevel: 'active', equipment: 'home' });
    }
    const ms = performance.now() - start;
    expect(ms).toBeLessThan(500);
  });

  it('searches a database with 1,000 custom foods under 100ms', () => {
    const foods = mergeFoods(makeCustomFoods(1000), {});
    const start = performance.now();
    const results = searchFoods(foods, 'custom food 99', () => '');
    const ms = performance.now() - start;
    expect(results.length).toBeGreaterThan(0);
    expect(ms).toBeLessThan(100);
  });

  it('scales portions 100,000 times under 500ms', () => {
    const food = makeCustomFoods(1)[0];
    const start = performance.now();
    for (let i = 0; i < 100_000; i++) {
      computeMacrosForPortion(food, 'p', 1.5);
    }
    const ms = performance.now() - start;
    expect(ms).toBeLessThan(500);
  });
});

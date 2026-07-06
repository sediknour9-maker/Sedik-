import { mergeFoods, searchFoods, computeMacrosForPortion } from '../src/services/foodRepository';
import type { FoodItem } from '../src/models/food';

const customFood: FoodItem = {
  id: 'custom_snack',
  nameKey: 'food.custom_snack.name',
  category: 'other',
  portionUnits: [{ key: 'piece', labelKey: 'portion.piece', gramsEquivalent: 50, isDefault: true }],
  perPortion: { kcal: 100, proteinG: 2, carbsG: 15, fatG: 3 },
  isCustom: true,
};

describe('foodRepository', () => {
  it('merges the seed database with custom foods and applies overrides', () => {
    const foods = mergeFoods([customFood], { harira: { category: 'other' } });
    expect(foods.find((f) => f.id === 'custom_snack')).toBeTruthy();
    expect(foods.find((f) => f.id === 'harira')?.category).toBe('other');
    // seed items not overridden keep their original category
    expect(foods.find((f) => f.id === 'khobz')?.category).toBe('bread_pastry');
  });

  it('filters search results by category', () => {
    const foods = mergeFoods([], {});
    const results = searchFoods(foods, '', (key) => key, 'soup');
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((f) => f.category === 'soup')).toBe(true);
  });

  it('filters search results by resolved (translated) name', () => {
    const foods = mergeFoods([], {});
    const resolveName = (key: string) => (key === 'food.harira.name' ? 'Harira soup' : 'Other dish');
    const results = searchFoods(foods, 'harira', resolveName);
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('harira');
  });

  it('scales macros for the default portion and multiplier 1', () => {
    const macros = computeMacrosForPortion(customFood, 'piece', 1);
    expect(macros).toEqual({ kcal: 100, proteinG: 2, carbsG: 15, fatG: 3 });
  });

  it('scales macros proportionally for a non-default portion unit', () => {
    const doublePortionFood: FoodItem = {
      ...customFood,
      portionUnits: [
        { key: 'piece', labelKey: 'portion.piece', gramsEquivalent: 50, isDefault: true },
        { key: 'double', labelKey: 'portion.piece', gramsEquivalent: 100 },
      ],
    };
    const macros = computeMacrosForPortion(doublePortionFood, 'double', 1);
    expect(macros).toEqual({ kcal: 200, proteinG: 4, carbsG: 30, fatG: 6 });
  });

  it('scales macros with a fractional multiplier', () => {
    const macros = computeMacrosForPortion(customFood, 'piece', 0.5);
    expect(macros).toEqual({ kcal: 50, proteinG: 1, carbsG: 7.5, fatG: 1.5 });
  });
});

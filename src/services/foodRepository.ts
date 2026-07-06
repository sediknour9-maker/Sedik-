import { MOROCCAN_FOODS } from '../data/foods.moroccan';
import { GENERIC_FOODS } from '../data/foods.generic';
import type { FoodCategory, FoodItem, Macros, PortionUnit } from '../models/food';

const SEED_FOODS = [...MOROCCAN_FOODS, ...GENERIC_FOODS];

export function mergeFoods(
  custom: FoodItem[],
  overrides: Record<string, Partial<FoodItem>>
): FoodItem[] {
  const seedWithOverrides = SEED_FOODS.map((food) => ({ ...food, ...overrides[food.id] }));
  return [...seedWithOverrides, ...custom];
}

/** Resolves a food's display name: user-given name first, then translation. */
export function getFoodName(food: FoodItem, translate: (key: string) => string): string {
  return food.customName ?? translate(food.nameKey);
}

export function searchFoods(
  foods: FoodItem[],
  query: string,
  resolveName: (nameKey: string) => string,
  category?: FoodCategory
): FoodItem[] {
  const normalizedQuery = query.trim().toLowerCase();
  return foods.filter((food) => {
    if (category && food.category !== category) return false;
    if (!normalizedQuery) return true;
    const name = food.customName ?? resolveName(food.nameKey);
    return name.toLowerCase().includes(normalizedQuery);
  });
}

function getDefaultPortion(food: FoodItem): PortionUnit {
  return food.portionUnits.find((unit) => unit.isDefault) ?? food.portionUnits[0];
}

function getPortionUnit(food: FoodItem, portionUnitKey: string): PortionUnit {
  return food.portionUnits.find((unit) => unit.key === portionUnitKey) ?? getDefaultPortion(food);
}

/** Scales a food's default-portion macros to the selected portion unit and multiplier. */
export function computeMacrosForPortion(
  food: FoodItem,
  portionUnitKey: string,
  multiplier: number
): Macros {
  const defaultPortion = getDefaultPortion(food);
  const selectedPortion = getPortionUnit(food, portionUnitKey);
  const scale = (selectedPortion.gramsEquivalent / defaultPortion.gramsEquivalent) * multiplier;

  return {
    kcal: Math.round(food.perPortion.kcal * scale),
    proteinG: Math.round(food.perPortion.proteinG * scale * 10) / 10,
    carbsG: Math.round(food.perPortion.carbsG * scale * 10) / 10,
    fatG: Math.round(food.perPortion.fatG * scale * 10) / 10,
  };
}

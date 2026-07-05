import { RAMADAN_RANGES } from '../data/ramadanDates';
import type { MealSlot } from '../models/log';
import type { RamadanOverride } from '../models/user';

function isWithinAnyRange(date: string): boolean {
  return RAMADAN_RANGES.some((range) => date >= range.start && date <= range.end);
}

/** Manual override always wins over the auto-detected date range. */
export function isRamadanActive(date: string, override: RamadanOverride): boolean {
  if (override === 'on') return true;
  if (override === 'off') return false;
  return isWithinAnyRange(date);
}

export const RAMADAN_MEAL_SLOTS: MealSlot[] = ['suhoor', 'iftar', 'snack'];
export const STANDARD_MEAL_SLOTS: MealSlot[] = ['breakfast', 'lunch', 'dinner', 'snack'];

export function getMealSlotsFor(date: string, override: RamadanOverride): MealSlot[] {
  return isRamadanActive(date, override) ? RAMADAN_MEAL_SLOTS : STANDARD_MEAL_SLOTS;
}

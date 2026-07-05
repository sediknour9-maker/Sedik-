import type { Macros } from './food';

export type MealSlot = 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'suhoor' | 'iftar';

export interface LogEntry {
  id: string;
  date: string; // 'YYYY-MM-DD' local date
  mealSlot: MealSlot;
  foodId: string;
  portionUnitKey: string;
  multiplier: number;
  computed: Macros;
  loggedAt: string;
}

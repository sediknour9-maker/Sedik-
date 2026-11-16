import { readStorage, writeStorage, STORAGE_KEYS } from './storage';

/** Daily hydration target in glasses (~250 ml each, about 2 litres). */
export const WATER_GOAL_GLASSES = 8;

export async function getWaterGlasses(date: string): Promise<number> {
  return (await readStorage<number>(STORAGE_KEYS.waterForDate(date))) ?? 0;
}

export async function setWaterGlasses(date: string, glasses: number): Promise<void> {
  await writeStorage(STORAGE_KEYS.waterForDate(date), Math.max(0, glasses));
}

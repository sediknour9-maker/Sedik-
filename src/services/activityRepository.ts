import type { ActivityLogEntry, WeightEntry } from '../models/training';
import { readStorage, writeStorage, removeStorage, STORAGE_KEYS } from './storage';

export async function getActivitiesForDate(date: string): Promise<ActivityLogEntry[]> {
  return (await readStorage<ActivityLogEntry[]>(STORAGE_KEYS.activityForDate(date))) ?? [];
}

export async function getActivityDates(): Promise<string[]> {
  return (await readStorage<string[]>(STORAGE_KEYS.activityIndex)) ?? [];
}

export async function addActivity(entry: ActivityLogEntry): Promise<void> {
  const existing = await getActivitiesForDate(entry.date);
  await writeStorage(STORAGE_KEYS.activityForDate(entry.date), [...existing, entry]);

  const dates = await getActivityDates();
  if (!dates.includes(entry.date)) {
    await writeStorage(STORAGE_KEYS.activityIndex, [...dates, entry.date].sort());
  }
}

export async function removeActivity(date: string, entryId: string): Promise<void> {
  const existing = await getActivitiesForDate(date);
  const remaining = existing.filter((entry) => entry.id !== entryId);
  await writeStorage(STORAGE_KEYS.activityForDate(date), remaining);

  if (remaining.length === 0) {
    const dates = await getActivityDates();
    await writeStorage(
      STORAGE_KEYS.activityIndex,
      dates.filter((d) => d !== date)
    );
  }
}

export async function resetAllActivities(): Promise<void> {
  const dates = await getActivityDates();
  await Promise.all(dates.map((date) => removeStorage(STORAGE_KEYS.activityForDate(date))));
  await removeStorage(STORAGE_KEYS.activityIndex);
}

export async function getWeightEntries(): Promise<WeightEntry[]> {
  return (await readStorage<WeightEntry[]>(STORAGE_KEYS.weights)) ?? [];
}

export async function addWeightEntry(entry: WeightEntry): Promise<void> {
  const existing = await getWeightEntries();
  const withoutSameDay = existing.filter((e) => e.date !== entry.date);
  const next = [...withoutSameDay, entry].sort((a, b) => a.date.localeCompare(b.date));
  await writeStorage(STORAGE_KEYS.weights, next);
}

export async function resetWeights(): Promise<void> {
  await removeStorage(STORAGE_KEYS.weights);
}

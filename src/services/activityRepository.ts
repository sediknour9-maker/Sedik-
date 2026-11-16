import type { ActivityLogEntry, WeightEntry } from '../models/training';
import { readStorage, writeStorage, STORAGE_KEYS } from './storage';

export async function getActivitiesForDate(date: string): Promise<ActivityLogEntry[]> {
  return (await readStorage<ActivityLogEntry[]>(STORAGE_KEYS.activityForDate(date))) ?? [];
}

export async function getActivityDates(): Promise<string[]> {
  return (await readStorage<string[]>(STORAGE_KEYS.activityIndex)) ?? [];
}

export async function getAllActivities(): Promise<ActivityLogEntry[]> {
  const dates = await getActivityDates();
  const perDate = await Promise.all(dates.map((date) => getActivitiesForDate(date)));
  return perDate.flat();
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

export async function getWeightEntries(): Promise<WeightEntry[]> {
  return (await readStorage<WeightEntry[]>(STORAGE_KEYS.weights)) ?? [];
}

export async function addWeightEntry(entry: WeightEntry): Promise<void> {
  const existing = await getWeightEntries();
  const withoutSameDay = existing.filter((e) => e.date !== entry.date);
  const next = [...withoutSameDay, entry].sort((a, b) => a.date.localeCompare(b.date));
  await writeStorage(STORAGE_KEYS.weights, next);
}

/** Last working weight (kg) the user entered per exercise, keyed by exercise id. */
export async function getExerciseWeights(): Promise<Record<string, number>> {
  return (await readStorage<Record<string, number>>(STORAGE_KEYS.exerciseWeights)) ?? {};
}

export async function saveExerciseWeights(weights: Record<string, number>): Promise<void> {
  const existing = await getExerciseWeights();
  await writeStorage(STORAGE_KEYS.exerciseWeights, { ...existing, ...weights });
}

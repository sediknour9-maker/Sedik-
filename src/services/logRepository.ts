import type { LogEntry } from '../models/log';
import type { Macros } from '../models/food';
import { readStorage, writeStorage, STORAGE_KEYS } from './storage';

export async function getLogsForDate(date: string): Promise<LogEntry[]> {
  return (await readStorage<LogEntry[]>(STORAGE_KEYS.logsForDate(date))) ?? [];
}

export async function getLogDates(): Promise<string[]> {
  return (await readStorage<string[]>(STORAGE_KEYS.logsIndex)) ?? [];
}

export async function addLogEntry(entry: LogEntry): Promise<void> {
  const existing = await getLogsForDate(entry.date);
  await writeStorage(STORAGE_KEYS.logsForDate(entry.date), [...existing, entry]);

  const dates = await getLogDates();
  if (!dates.includes(entry.date)) {
    await writeStorage(STORAGE_KEYS.logsIndex, [...dates, entry.date].sort());
  }
}

/** Replaces the stored entry with the same id, keeping its position in the day. */
export async function updateLogEntry(entry: LogEntry): Promise<void> {
  const existing = await getLogsForDate(entry.date);
  await writeStorage(
    STORAGE_KEYS.logsForDate(entry.date),
    existing.map((current) => (current.id === entry.id ? entry : current))
  );
}

export async function removeLogEntry(date: string, entryId: string): Promise<void> {
  const existing = await getLogsForDate(date);
  const remaining = existing.filter((entry) => entry.id !== entryId);
  await writeStorage(STORAGE_KEYS.logsForDate(date), remaining);

  if (remaining.length === 0) {
    const dates = await getLogDates();
    await writeStorage(
      STORAGE_KEYS.logsIndex,
      dates.filter((d) => d !== date)
    );
  }
}

export interface DayTotal {
  date: string;
  kcal: number;
}

/** Calorie totals for the given dates, in the same order (0 for days without entries). */
export async function getDailyTotals(dates: string[]): Promise<DayTotal[]> {
  return Promise.all(
    dates.map(async (date) => ({ date, kcal: aggregateMacros(await getLogsForDate(date)).kcal }))
  );
}

export function aggregateMacros(entries: LogEntry[]): Macros {
  return entries.reduce(
    (total, entry) => ({
      kcal: total.kcal + entry.computed.kcal,
      proteinG: Math.round((total.proteinG + entry.computed.proteinG) * 10) / 10,
      carbsG: Math.round((total.carbsG + entry.computed.carbsG) * 10) / 10,
      fatG: Math.round((total.fatG + entry.computed.fatG) * 10) / 10,
    }),
    { kcal: 0, proteinG: 0, carbsG: 0, fatG: 0 }
  );
}

import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import {
  addActivity,
  addWeightEntry,
  getActivitiesForDate,
  getActivityDates,
  getWeightEntries,
  removeActivity,
} from '../services/activityRepository';
import { todayString } from '../services/date';
import type { ActivityLogEntry, WeightEntry } from '../models/training';

interface ActivityContextValue {
  todayActivities: ActivityLogEntry[];
  activityDates: string[];
  weights: WeightEntry[];
  /** Total number of completed strength workouts, used to rotate the plan. */
  strengthSessionCount: number;
  isLoading: boolean;
  logActivity: (entry: ActivityLogEntry) => Promise<void>;
  removeActivityEntry: (date: string, entryId: string) => Promise<void>;
  logWeight: (weightKg: number) => Promise<void>;
  refresh: () => Promise<void>;
}

const ActivityContext = createContext<ActivityContextValue | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const [todayActivities, setTodayActivities] = useState<ActivityLogEntry[]>([]);
  const [activityDates, setActivityDates] = useState<string[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [strengthSessionCount, setStrengthSessionCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const reload = async () => {
    const today = todayString();
    const [entries, dates, weightEntries] = await Promise.all([
      getActivitiesForDate(today),
      getActivityDates(),
      getWeightEntries(),
    ]);
    const allEntries = await Promise.all(dates.map((date) => getActivitiesForDate(date)));
    setStrengthSessionCount(allEntries.flat().filter((entry) => entry.type === 'strength').length);
    setTodayActivities(entries);
    setActivityDates(dates);
    setWeights(weightEntries);
    setIsLoading(false);
  };

  useEffect(() => {
    reload();
  }, []);

  // Reload "today's" activities when the app returns to the foreground,
  // so a date change past midnight is picked up.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') reload();
    });
    return () => subscription.remove();
  }, []);

  const logActivity = async (entry: ActivityLogEntry) => {
    await addActivity(entry);
    await reload();
  };

  const removeActivityEntry = async (date: string, entryId: string) => {
    await removeActivity(date, entryId);
    await reload();
  };

  const logWeight = async (weightKg: number) => {
    await addWeightEntry({ date: todayString(), weightKg });
    await reload();
  };

  const value = useMemo(
    () => ({
      todayActivities,
      activityDates,
      weights,
      strengthSessionCount,
      isLoading,
      logActivity,
      removeActivityEntry,
      logWeight,
      refresh: reload,
    }),
    [todayActivities, activityDates, weights, strengthSessionCount, isLoading]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity(): ActivityContextValue {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within an ActivityProvider');
  return ctx;
}

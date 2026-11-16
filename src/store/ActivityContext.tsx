import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import {
  addActivity,
  addWeightEntry,
  getAllActivities,
  getWeightEntries,
  removeActivity,
} from '../services/activityRepository';
import { useDataEpoch } from './DataEpochContext';
import { useToday } from './useToday';
import type { ActivityLogEntry, ActivityType, WeightEntry } from '../models/training';

interface ActivityContextValue {
  todayActivities: ActivityLogEntry[];
  /** Dates with at least one logged activity, oldest first. */
  activityDates: string[];
  /** Lifetime number of logged sessions per activity type. */
  activityCounts: Record<ActivityType, number>;
  weights: WeightEntry[];
  isLoading: boolean;
  logActivity: (entry: ActivityLogEntry) => Promise<void>;
  removeActivityEntry: (entry: ActivityLogEntry) => Promise<void>;
  logWeight: (weightKg: number) => Promise<void>;
}

const ActivityContext = createContext<ActivityContextValue | undefined>(undefined);

export function ActivityProvider({ children }: { children: ReactNode }) {
  const { epoch } = useDataEpoch();
  const today = useToday();
  const [activities, setActivities] = useState<ActivityLogEntry[]>([]);
  const [weights, setWeights] = useState<WeightEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const reload = useCallback(async () => {
    const [allActivities, weightEntries] = await Promise.all([getAllActivities(), getWeightEntries()]);
    setActivities(allActivities);
    setWeights(weightEntries);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    reload();
  }, [reload, epoch]);

  const logActivity = async (entry: ActivityLogEntry) => {
    await addActivity(entry);
    await reload();
  };

  const removeActivityEntry = async (entry: ActivityLogEntry) => {
    await removeActivity(entry.date, entry.id);
    await reload();
  };

  const logWeight = async (weightKg: number) => {
    await addWeightEntry({ date: today, weightKg });
    await reload();
  };

  const derived = useMemo(() => {
    const activityCounts: Record<ActivityType, number> = { strength: 0, cardio: 0, mobility: 0 };
    activities.forEach((entry) => {
      activityCounts[entry.type] += 1;
    });
    return {
      todayActivities: activities.filter((entry) => entry.date === today),
      activityDates: Array.from(new Set(activities.map((entry) => entry.date))).sort(),
      activityCounts,
    };
  }, [activities, today]);

  const value = useMemo(
    () => ({ ...derived, weights, isLoading, logActivity, removeActivityEntry, logWeight }),
    [derived, weights, isLoading, today]
  );

  return <ActivityContext.Provider value={value}>{children}</ActivityContext.Provider>;
}

export function useActivity(): ActivityContextValue {
  const ctx = useContext(ActivityContext);
  if (!ctx) throw new Error('useActivity must be used within an ActivityProvider');
  return ctx;
}

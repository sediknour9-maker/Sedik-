import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { computeTargets } from '../services/calorieCalculator';
import { readStorage, writeStorage, STORAGE_KEYS } from '../services/storage';
import { useDataEpoch } from './DataEpochContext';
import type { ActivityLevel, Goal, Sex, UserProfile } from '../models/user';

export interface ProfileDraft {
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  activityLevel: ActivityLevel;
  goal: Goal;
}

interface ProfileContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  createProfile: (draft: ProfileDraft) => Promise<void>;
  /** Applies the changes and recomputes the daily calorie and macro targets. */
  updateProfile: (changes: Partial<ProfileDraft>) => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const { epoch } = useDataEpoch();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    readStorage<UserProfile>(STORAGE_KEYS.profile)
      .then(setProfile)
      .finally(() => setIsLoading(false));
  }, [epoch]);

  const persist = async (next: UserProfile) => {
    setProfile(next);
    await writeStorage(STORAGE_KEYS.profile, next);
  };

  const createProfile = async (draft: ProfileDraft) => {
    await persist({
      id: `${Date.now()}`,
      ...draft,
      createdAt: new Date().toISOString(),
      targets: computeTargets(draft),
    });
  };

  const updateProfile = async (changes: Partial<ProfileDraft>) => {
    if (!profile) return;
    const merged = { ...profile, ...changes };
    await persist({ ...merged, targets: computeTargets(merged) });
  };

  const value = useMemo(() => ({ profile, isLoading, createProfile, updateProfile }), [profile, isLoading]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}

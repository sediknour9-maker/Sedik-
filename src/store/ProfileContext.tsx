import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { computeTargets } from '../services/calorieCalculator';
import { readStorage, writeStorage, removeStorage, STORAGE_KEYS } from '../services/storage';
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
  resetProfile: () => Promise<void>;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    readStorage<UserProfile>(STORAGE_KEYS.profile)
      .then(setProfile)
      .finally(() => setIsLoading(false));
  }, []);

  const createProfile = async (draft: ProfileDraft) => {
    const next: UserProfile = {
      id: `${Date.now()}`,
      ...draft,
      createdAt: new Date().toISOString(),
      targets: computeTargets(draft),
    };
    setProfile(next);
    await writeStorage(STORAGE_KEYS.profile, next);
  };

  const resetProfile = async () => {
    await removeStorage(STORAGE_KEYS.profile);
    setProfile(null);
  };

  const value = useMemo(() => ({ profile, isLoading, createProfile, resetProfile }), [profile, isLoading]);

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile must be used within a ProfileProvider');
  return ctx;
}

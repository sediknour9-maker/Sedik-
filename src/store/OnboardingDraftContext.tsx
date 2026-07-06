import React, { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

import type { ActivityLevel, Goal, Sex } from '../models/user';

export interface OnboardingDraft {
  sex: Sex;
  age: string;
  heightCm: string;
  weightKg: string;
  activityLevel: ActivityLevel;
  goal: Goal;
}

const DEFAULT_DRAFT: OnboardingDraft = {
  sex: 'male',
  age: '',
  heightCm: '',
  weightKg: '',
  activityLevel: 'moderate',
  goal: 'maintain',
};

interface OnboardingDraftContextValue {
  draft: OnboardingDraft;
  updateDraft: (patch: Partial<OnboardingDraft>) => void;
}

const OnboardingDraftContext = createContext<OnboardingDraftContextValue | undefined>(undefined);

export function OnboardingDraftProvider({ children }: { children: ReactNode }) {
  const [draft, setDraft] = useState<OnboardingDraft>(DEFAULT_DRAFT);

  const updateDraft = (patch: Partial<OnboardingDraft>) => setDraft((prev) => ({ ...prev, ...patch }));

  const value = useMemo(() => ({ draft, updateDraft }), [draft]);

  return <OnboardingDraftContext.Provider value={value}>{children}</OnboardingDraftContext.Provider>;
}

export function useOnboardingDraft(): OnboardingDraftContextValue {
  const ctx = useContext(OnboardingDraftContext);
  if (!ctx) throw new Error('useOnboardingDraft must be used within an OnboardingDraftProvider');
  return ctx;
}

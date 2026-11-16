import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { generatePlan } from '../services/planGenerator';
import { readStorage, writeStorage, STORAGE_KEYS } from '../services/storage';
import { useDataEpoch } from './DataEpochContext';
import { useProfile } from './ProfileContext';
import type { EquipmentPreference, GeneratedPlan } from '../models/training';

interface PlanContextValue {
  plan: GeneratedPlan | null;
  isLoading: boolean;
  regenerate: (equipment: EquipmentPreference) => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { epoch } = useDataEpoch();
  const { profile, isLoading: isProfileLoading } = useProfile();
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    readStorage<GeneratedPlan>(STORAGE_KEYS.plan)
      .then(setPlan)
      .finally(() => setIsLoading(false));
  }, [epoch]);

  const regenerate = async (equipment: EquipmentPreference) => {
    if (!profile) return;
    const next = generatePlan({ goal: profile.goal, activityLevel: profile.activityLevel, equipment });
    setPlan(next);
    await writeStorage(STORAGE_KEYS.plan, next);
  };

  // Keep the plan in sync with the profile: build one when none exists and
  // rebuild when the goal or activity level it was generated from changed.
  useEffect(() => {
    if (isLoading || isProfileLoading || !profile) return;
    const isOutdated = !plan || plan.goal !== profile.goal || plan.activityLevel !== profile.activityLevel;
    if (isOutdated) {
      regenerate(plan?.equipment ?? 'gym');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, isProfileLoading, plan, profile]);

  const value = useMemo(() => ({ plan, isLoading, regenerate }), [plan, isLoading, profile]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within a PlanProvider');
  return ctx;
}

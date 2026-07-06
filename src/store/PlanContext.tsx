import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { generatePlan } from '../services/planGenerator';
import { readStorage, writeStorage, STORAGE_KEYS } from '../services/storage';
import { useProfile } from './ProfileContext';
import type { EquipmentPreference, GeneratedPlan } from '../models/training';

interface PlanContextValue {
  plan: GeneratedPlan | null;
  isLoading: boolean;
  regenerate: (equipment: EquipmentPreference) => Promise<void>;
}

const PlanContext = createContext<PlanContextValue | undefined>(undefined);

export function PlanProvider({ children }: { children: ReactNode }) {
  const { profile } = useProfile();
  const [plan, setPlan] = useState<GeneratedPlan | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    readStorage<GeneratedPlan>(STORAGE_KEYS.plan)
      .then(setPlan)
      .finally(() => setIsLoading(false));
  }, []);

  // Generate an initial plan once a profile exists and none is stored yet.
  useEffect(() => {
    if (!isLoading && !plan && profile) {
      regenerate('gym');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, plan, profile]);

  const regenerate = async (equipment: EquipmentPreference) => {
    if (!profile) return;
    const next = generatePlan({ goal: profile.goal, activityLevel: profile.activityLevel, equipment });
    setPlan(next);
    await writeStorage(STORAGE_KEYS.plan, next);
  };

  const value = useMemo(() => ({ plan, isLoading, regenerate }), [plan, isLoading, profile]);

  return <PlanContext.Provider value={value}>{children}</PlanContext.Provider>;
}

export function usePlan(): PlanContextValue {
  const ctx = useContext(PlanContext);
  if (!ctx) throw new Error('usePlan must be used within a PlanProvider');
  return ctx;
}

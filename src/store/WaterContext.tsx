import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { getWaterGlasses, setWaterGlasses } from '../services/waterRepository';
import { useDataEpoch } from './DataEpochContext';

interface WaterContextValue {
  glassesByDate: Record<string, number>;
  load: (date: string) => void;
  setGlasses: (date: string, glasses: number) => Promise<void>;
}

const WaterContext = createContext<WaterContextValue | undefined>(undefined);

export function WaterProvider({ children }: { children: ReactNode }) {
  const { epoch } = useDataEpoch();
  const [glassesByDate, setGlassesByDate] = useState<Record<string, number>>({});

  useEffect(() => {
    setGlassesByDate({});
  }, [epoch]);

  const load = useCallback((date: string) => {
    getWaterGlasses(date).then((glasses) => {
      setGlassesByDate((current) => (date in current ? current : { ...current, [date]: glasses }));
    });
  }, []);

  const setGlasses = useCallback(async (date: string, glasses: number) => {
    const next = Math.max(0, glasses);
    setGlassesByDate((current) => ({ ...current, [date]: next }));
    await setWaterGlasses(date, next);
  }, []);

  const value = useMemo(() => ({ glassesByDate, load, setGlasses }), [glassesByDate, load, setGlasses]);

  return <WaterContext.Provider value={value}>{children}</WaterContext.Provider>;
}

/** Water intake for one day, shared between every screen that shows it. */
export function useWater(date: string): { glasses: number; setGlasses: (glasses: number) => Promise<void> } {
  const ctx = useContext(WaterContext);
  if (!ctx) throw new Error('useWater must be used within a WaterProvider');
  const { glassesByDate, load, setGlasses } = ctx;
  const isLoaded = date in glassesByDate;

  useEffect(() => {
    if (!isLoaded) load(date);
  }, [date, isLoaded, load]);

  return {
    glasses: glassesByDate[date] ?? 0,
    setGlasses: (glasses: number) => setGlasses(date, glasses),
  };
}

import React, { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { clearUserData } from '../services/storage';

interface DataEpochContextValue {
  /** Increments whenever stored user data was wiped; data providers reload when it changes. */
  epoch: number;
  resetAllData: () => Promise<void>;
}

const DataEpochContext = createContext<DataEpochContextValue | undefined>(undefined);

export function DataEpochProvider({ children }: { children: ReactNode }) {
  const [epoch, setEpoch] = useState(0);

  const resetAllData = useCallback(async () => {
    await clearUserData();
    setEpoch((current) => current + 1);
  }, []);

  const value = useMemo(() => ({ epoch, resetAllData }), [epoch, resetAllData]);

  return <DataEpochContext.Provider value={value}>{children}</DataEpochContext.Provider>;
}

export function useDataEpoch(): DataEpochContextValue {
  const ctx = useContext(DataEpochContext);
  if (!ctx) throw new Error('useDataEpoch must be used within a DataEpochProvider');
  return ctx;
}

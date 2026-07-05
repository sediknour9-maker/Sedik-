import React, { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { mergeFoods } from '../services/foodRepository';
import { readStorage, writeStorage, STORAGE_KEYS } from '../services/storage';
import type { FoodItem } from '../models/food';

interface FoodDbContextValue {
  foods: FoodItem[];
  isLoading: boolean;
  addCustomFood: (food: FoodItem) => Promise<void>;
}

const FoodDbContext = createContext<FoodDbContextValue | undefined>(undefined);

export function FoodDbProvider({ children }: { children: ReactNode }) {
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Partial<FoodItem>>>({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      readStorage<FoodItem[]>(STORAGE_KEYS.customFoods),
      readStorage<Record<string, Partial<FoodItem>>>(STORAGE_KEYS.foodOverrides),
    ])
      .then(([storedCustom, storedOverrides]) => {
        setCustomFoods(storedCustom ?? []);
        setOverrides(storedOverrides ?? {});
      })
      .finally(() => setIsLoading(false));
  }, []);

  const addCustomFood = async (food: FoodItem) => {
    const next = [...customFoods, { ...food, isCustom: true }];
    setCustomFoods(next);
    await writeStorage(STORAGE_KEYS.customFoods, next);
  };

  const foods = useMemo(() => mergeFoods(customFoods, overrides), [customFoods, overrides]);

  const value = useMemo(() => ({ foods, isLoading, addCustomFood }), [foods, isLoading, customFoods]);

  return <FoodDbContext.Provider value={value}>{children}</FoodDbContext.Provider>;
}

export function useFoodDb(): FoodDbContextValue {
  const ctx = useContext(FoodDbContext);
  if (!ctx) throw new Error('useFoodDb must be used within a FoodDbProvider');
  return ctx;
}

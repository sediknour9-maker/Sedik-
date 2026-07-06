import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { mergeFoods } from '../services/foodRepository';
import { readStorage, writeStorage, removeStorage, STORAGE_KEYS } from '../services/storage';
import type { FoodItem } from '../models/food';

interface FoodDbContextValue {
  foods: FoodItem[];
  isLoading: boolean;
  addCustomFood: (food: FoodItem) => Promise<void>;
  resetCustomFoods: () => Promise<void>;
}

const FoodDbContext = createContext<FoodDbContextValue | undefined>(undefined);

export function FoodDbProvider({ children }: { children: ReactNode }) {
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Partial<FoodItem>>>({});
  const [isLoading, setIsLoading] = useState(true);
  // Mirror of customFoods so rapid consecutive adds never build on stale state.
  const customFoodsRef = useRef<FoodItem[]>([]);

  const applyCustomFoods = (next: FoodItem[]) => {
    customFoodsRef.current = next;
    setCustomFoods(next);
  };

  useEffect(() => {
    Promise.all([
      readStorage<FoodItem[]>(STORAGE_KEYS.customFoods),
      readStorage<Record<string, Partial<FoodItem>>>(STORAGE_KEYS.foodOverrides),
    ])
      .then(([storedCustom, storedOverrides]) => {
        applyCustomFoods(storedCustom ?? []);
        setOverrides(storedOverrides ?? {});
      })
      .finally(() => setIsLoading(false));
  }, []);

  const addCustomFood = async (food: FoodItem) => {
    const next = [...customFoodsRef.current, { ...food, isCustom: true }];
    applyCustomFoods(next);
    await writeStorage(STORAGE_KEYS.customFoods, next);
  };

  const resetCustomFoods = async () => {
    applyCustomFoods([]);
    setOverrides({});
    await Promise.all([removeStorage(STORAGE_KEYS.customFoods), removeStorage(STORAGE_KEYS.foodOverrides)]);
  };

  const foods = useMemo(() => mergeFoods(customFoods, overrides), [customFoods, overrides]);

  const value = useMemo(() => ({ foods, isLoading, addCustomFood, resetCustomFoods }), [foods, isLoading]);

  return <FoodDbContext.Provider value={value}>{children}</FoodDbContext.Provider>;
}

export function useFoodDb(): FoodDbContextValue {
  const ctx = useContext(FoodDbContext);
  if (!ctx) throw new Error('useFoodDb must be used within a FoodDbProvider');
  return ctx;
}

import React, { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';

import { mergeFoods } from '../services/foodRepository';
import { pushRecentFood } from '../services/recentFoods';
import { readStorage, writeStorage, STORAGE_KEYS } from '../services/storage';
import { useDataEpoch } from './DataEpochContext';
import type { FoodItem } from '../models/food';

interface FoodDbContextValue {
  foods: FoodItem[];
  /** Most recently logged foods, newest first. */
  recentFoods: FoodItem[];
  isLoading: boolean;
  addCustomFood: (food: FoodItem) => Promise<void>;
  markFoodUsed: (foodId: string) => Promise<void>;
}

const FoodDbContext = createContext<FoodDbContextValue | undefined>(undefined);

export function FoodDbProvider({ children }: { children: ReactNode }) {
  const { epoch } = useDataEpoch();
  const [customFoods, setCustomFoods] = useState<FoodItem[]>([]);
  const [overrides, setOverrides] = useState<Record<string, Partial<FoodItem>>>({});
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  // Mirrors of state so rapid consecutive writes never build on stale values.
  const customFoodsRef = useRef<FoodItem[]>([]);
  const recentIdsRef = useRef<string[]>([]);

  const applyCustomFoods = (next: FoodItem[]) => {
    customFoodsRef.current = next;
    setCustomFoods(next);
  };

  const applyRecentIds = (next: string[]) => {
    recentIdsRef.current = next;
    setRecentIds(next);
  };

  useEffect(() => {
    setIsLoading(true);
    Promise.all([
      readStorage<FoodItem[]>(STORAGE_KEYS.customFoods),
      readStorage<Record<string, Partial<FoodItem>>>(STORAGE_KEYS.foodOverrides),
      readStorage<string[]>(STORAGE_KEYS.recentFoods),
    ])
      .then(([storedCustom, storedOverrides, storedRecent]) => {
        applyCustomFoods(storedCustom ?? []);
        setOverrides(storedOverrides ?? {});
        applyRecentIds(storedRecent ?? []);
      })
      .finally(() => setIsLoading(false));
  }, [epoch]);

  const addCustomFood = async (food: FoodItem) => {
    const next = [...customFoodsRef.current, { ...food, isCustom: true }];
    applyCustomFoods(next);
    await writeStorage(STORAGE_KEYS.customFoods, next);
  };

  const markFoodUsed = async (foodId: string) => {
    const next = pushRecentFood(recentIdsRef.current, foodId);
    applyRecentIds(next);
    await writeStorage(STORAGE_KEYS.recentFoods, next);
  };

  const foods = useMemo(() => mergeFoods(customFoods, overrides), [customFoods, overrides]);

  const recentFoods = useMemo(
    () => recentIds.map((id) => foods.find((food) => food.id === id)).filter((food): food is FoodItem => !!food),
    [recentIds, foods]
  );

  const value = useMemo(
    () => ({ foods, recentFoods, isLoading, addCustomFood, markFoodUsed }),
    [foods, recentFoods, isLoading]
  );

  return <FoodDbContext.Provider value={value}>{children}</FoodDbContext.Provider>;
}

export function useFoodDb(): FoodDbContextValue {
  const ctx = useContext(FoodDbContext);
  if (!ctx) throw new Error('useFoodDb must be used within a FoodDbProvider');
  return ctx;
}

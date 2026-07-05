import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_VERSION = 1;

interface StoredEnvelope<T> {
  v: number;
  data: T;
}

export async function readStorage<T>(key: string): Promise<T | null> {
  const raw = await AsyncStorage.getItem(key);
  if (!raw) return null;
  const parsed: StoredEnvelope<T> = JSON.parse(raw);
  return parsed.data;
}

export async function writeStorage<T>(key: string, data: T): Promise<void> {
  const envelope: StoredEnvelope<T> = { v: STORAGE_VERSION, data };
  await AsyncStorage.setItem(key, JSON.stringify(envelope));
}

export async function removeStorage(key: string): Promise<void> {
  await AsyncStorage.removeItem(key);
}

export const STORAGE_KEYS = {
  profile: 'app:profile',
  settings: 'app:settings',
  customFoods: 'app:foods:custom',
  foodOverrides: 'app:foods:overrides',
  logsIndex: 'app:logs:index',
  logsForDate: (date: string) => `app:logs:${date}`,
} as const;

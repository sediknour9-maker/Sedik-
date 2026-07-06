import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_VERSION = 1;

interface StoredEnvelope<T> {
  v: number;
  data: T;
}

// Fallback for environments where persistent storage is unavailable
// (sandboxed iframes, private browsing). Data then lives for the session only.
const memoryStore = new Map<string, string>();

async function getRaw(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return memoryStore.get(key) ?? null;
  }
}

async function setRaw(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    memoryStore.set(key, value);
  }
}

export async function readStorage<T>(key: string): Promise<T | null> {
  const raw = await getRaw(key);
  if (!raw) return null;
  const parsed: StoredEnvelope<T> = JSON.parse(raw);
  return parsed.data;
}

export async function writeStorage<T>(key: string, data: T): Promise<void> {
  const envelope: StoredEnvelope<T> = { v: STORAGE_VERSION, data };
  await setRaw(key, JSON.stringify(envelope));
}

export async function removeStorage(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(key);
  } catch {
    memoryStore.delete(key);
  }
}

export const STORAGE_KEYS = {
  profile: 'app:profile',
  settings: 'app:settings',
  customFoods: 'app:foods:custom',
  foodOverrides: 'app:foods:overrides',
  logsIndex: 'app:logs:index',
  logsForDate: (date: string) => `app:logs:${date}`,
  activityIndex: 'app:activity:index',
  activityForDate: (date: string) => `app:activity:${date}`,
  weights: 'app:weights',
  plan: 'app:plan',
} as const;

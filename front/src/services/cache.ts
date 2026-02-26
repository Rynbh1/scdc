import { tokenStorage } from '../utils/storage';

const CACHE_PREFIX = 'cache:';

type CacheEntry<T> = {
  value: T;
  ts: number;
};

export async function setCache<T>(key: string, value: T): Promise<void> {
  const entry: CacheEntry<T> = { value, ts: Date.now() };
  await tokenStorage.setItem(`${CACHE_PREFIX}${key}`, JSON.stringify(entry));
}

export async function getCache<T>(key: string, maxAgeMs = 5 * 60 * 1000): Promise<T | null> {
  const raw = await tokenStorage.getItem(`${CACHE_PREFIX}${key}`);
  if (!raw) return null;

  try {
    const entry = JSON.parse(raw) as CacheEntry<T>;
    if (Date.now() - entry.ts > maxAgeMs) return null;
    return entry.value;
  } catch {
    return null;
  }
}

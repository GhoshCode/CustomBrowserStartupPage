import { beforeEach, describe, expect, test } from 'vitest';
import { clearCache, readCache, writeCache } from './cache';
import { isExtension } from './env';

describe('ttl cache', () => {
  beforeEach(() => localStorage.clear());

  test('returns a fresh value for the same key', () => {
    writeCache('w', 'k1', { t: 20 }, 1_000);
    expect(readCache('w', 'k1', 500, 1_400)).toEqual({ t: 20 });
  });

  test('misses when expired or fetched for a different key', () => {
    writeCache('w', 'k1', 1, 1_000);
    expect(readCache('w', 'k1', 500, 1_501)).toBeNull();
    expect(readCache('w', 'k2', 500, 1_100)).toBeNull();
    clearCache('w');
    expect(readCache('w', 'k1', 500, 1_100)).toBeNull();
  });
});

test('isExtension is false outside an extension page', () => {
  expect(isExtension()).toBe(false);
});

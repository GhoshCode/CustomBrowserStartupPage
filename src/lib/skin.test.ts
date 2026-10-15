import { expect, test } from 'vitest';
import { skinFor } from './skin';

test('Sonoma Glass applies to the default light preset only', () => {
  expect(skinFor({ themeMode: 'light', presetTheme: 'default-light', backgroundImage: null })).toBe('sonoma');
  expect(skinFor({ themeMode: 'light', presetTheme: undefined, backgroundImage: null })).toBe('sonoma');
  expect(skinFor({ themeMode: 'dark', presetTheme: 'default-dark', backgroundImage: null })).toBeNull();
  expect(skinFor({ themeMode: 'light', presetTheme: 'sky-light', backgroundImage: null })).toBeNull();
  // A wallpaper or legacy gradient always wins over the skin.
  expect(skinFor({ themeMode: 'light', presetTheme: 'default-light', backgroundImage: 'linear-gradient(red, blue)' })).toBeNull();
});

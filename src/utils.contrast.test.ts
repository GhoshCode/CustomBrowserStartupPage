import { describe, expect, test } from 'vitest';
import { contrastRatio, ensureContrast, getCategoryDisplayColor } from './utils';

describe('contrast helpers', () => {
  test('contrastRatio matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#767676', '#ffffff')).toBeCloseTo(4.54, 1);
  });

  test.each(['#10b981', '#38bdf8', '#fbbf24', '#f472b6', '#a78bfa', '#4ade80'])(
    'light-mode category colour %s meets AA on white',
    (hex) => {
      expect(contrastRatio(getCategoryDisplayColor(hex, true), '#ffffff')).toBeGreaterThanOrEqual(4.5);
    },
  );

  test('already-dark colours and dark mode are left alone', () => {
    expect(ensureContrast('#1d4ed8')).toBe('#1d4ed8');
    expect(getCategoryDisplayColor('#10b981', false)).toBe('#10b981');
  });
});

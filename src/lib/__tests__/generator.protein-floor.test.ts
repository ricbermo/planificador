import { afterEach, describe, expect, it, vi } from 'vitest';
import { applyP2Multipliers, generateDay, mealProtein } from '../generator';

describe('generator protein safeguards', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('falls back to protein scaling when carb is capped', () => {
    const items = [
      { foodId: 'chicken-breast', multiplier: 1.2 },
      { foodId: 'rice', multiplier: 2 },
    ];

    const scaled = applyP2Multipliers(items, 1000);

    expect(scaled[0].multiplierP2).toBeGreaterThan(1.2);
    expect(scaled[0].multiplierP2).toBe(2.5);
  });

  it('meets minimum daily protein target when requested', () => {
    const seq = [0.9, 0.9, 0.1, 0.5, 0.4, 0.9, 0.1, 0.9, 0.1];
    let i = 0;
    vi.spyOn(Math, 'random').mockImplementation(() => seq[i++] ?? 0.5);

    const meals = generateDay({
      targetKcal: 2489,
      dayMeat: 'beef',
      minProteinTarget: 132,
    });

    const protein = meals.reduce((sum, meal) => sum + mealProtein(meal), 0);
    expect(Math.round(protein)).toBeGreaterThanOrEqual(132);
  });
});

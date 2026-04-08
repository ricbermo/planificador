import { afterEach, describe, expect, it, vi } from 'vitest';
import { FOODS_BY_ID } from '../../data/foods';
import { rerollItem } from '../generator';
import type { Meal } from '../types';

describe('portion safeguards', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps cooked carbs in normal serving ranges', () => {
    expect(FOODS_BY_ID.rice.minMultiplier).toBe(1);
    expect(FOODS_BY_ID.rice.maxMultiplier).toBe(2);
    expect(FOODS_BY_ID.rice.maxGrams).toBe(200);

    expect(FOODS_BY_ID.potato.minMultiplier).toBe(1.25);
    expect(FOODS_BY_ID.potato.maxMultiplier).toBe(2.5);
    expect(FOODS_BY_ID.potato.maxGrams).toBe(250);

    expect(FOODS_BY_ID.lentils.minMultiplier).toBe(1);
    expect(FOODS_BY_ID.lentils.maxMultiplier).toBe(2);
    expect(FOODS_BY_ID.lentils.maxGrams).toBe(200);

    expect(FOODS_BY_ID.beans.minMultiplier).toBe(1);
    expect(FOODS_BY_ID.beans.maxMultiplier).toBe(2);
    expect(FOODS_BY_ID.beans.maxGrams).toBe(200);
  });

  it('clamps rerolled carb multiplier even within kcal tolerance', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0.7);

    const meal: Meal = {
      slot: 'lunch',
      done: false,
      useDayMeat: true,
      items: [{ foodId: 'rice', multiplier: 3 }],
    };

    const updated = rerollItem(meal, 0, 390, 'chicken');

    expect(updated.items[0].foodId).toBe('beans');
    expect(updated.items[0].multiplier).toBe(2);
  });
});

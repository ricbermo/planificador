import { afterEach, describe, expect, it, vi } from 'vitest';
import { generateDay, mealKcal, mealKcalP2, mealProtein } from '../generator';

function lcg(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
}

describe('generator ranges', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps generated daily totals always in range', () => {
    const failures: string[] = [];
    const targets = [1600, 1800, 2000, 2200, 2400];

    for (const target of targets) {
      for (let seed = 1; seed <= 200; seed++) {
        const rnd = lcg(seed);
        vi.spyOn(Math, 'random').mockImplementation(() => rnd());

        const meals = generateDay({
          targetKcal: target,
          dayMeat: seed % 3 === 0 ? 'beef' : seed % 2 === 0 ? 'pork' : 'chicken',
          minProteinTarget: 132,
        });

        const kcal = meals.reduce((sum, m) => sum + mealKcal(m), 0);
        const protein = meals.reduce((sum, m) => sum + mealProtein(m), 0);
        const pct = (kcal / target) * 100;

        if (pct < 95 || pct > 105 || protein < 132) {
          const mealDetails = meals
            .map((m) => {
              const mk = Math.round(mealKcal(m));
              const mp = Math.round(mealProtein(m));
              const items = m.items
                .map((it) => `${it.foodId}:${it.multiplier}`)
                .join(',');
              return `${m.slot}[k=${mk},p=${mp}](${items})`;
            })
            .join(' | ');
          failures.push(
            `target=${target} seed=${seed} kcal=${Math.round(kcal)} pct=${pct.toFixed(1)} protein=${Math.round(protein)} :: ${mealDetails}`,
          );
          if (failures.length >= 5) break;
        }
      }
      if (failures.length >= 5) break;
    }

    expect(failures).toEqual([]);
  });

  it('keeps person 2 totals in range for low/high split targets', () => {
    const failures: string[] = [];
    const scenarios = [
      { p1: 2200, p2: 1200 },
      { p1: 2200, p2: 2600 },
    ];

    for (const { p1, p2 } of scenarios) {
      for (let seed = 1; seed <= 120; seed++) {
        const rnd = lcg(seed);
        vi.spyOn(Math, 'random').mockImplementation(() => rnd());

        const meals = generateDay({
          targetKcal: p1,
          dayMeat: seed % 3 === 0 ? 'beef' : seed % 2 === 0 ? 'pork' : 'chicken',
          remainingKcalP2: p2,
        });

        const kcalP2 = meals.reduce((sum, m) => sum + mealKcalP2(m), 0);
        const pctP2 = (kcalP2 / p2) * 100;

        if (pctP2 < 95 || pctP2 > 105) {
          failures.push(
            `p1=${p1} p2=${p2} seed=${seed} kcalP2=${Math.round(kcalP2)} pctP2=${pctP2.toFixed(1)}`,
          );
          if (failures.length >= 5) break;
        }
      }
      if (failures.length >= 5) break;
    }

    expect(failures).toEqual([]);
  });
});

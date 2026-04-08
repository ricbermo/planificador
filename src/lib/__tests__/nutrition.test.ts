import { describe, expect, it } from 'vitest';
import { computeMacroPlan, isValidMetrics } from '../nutrition';
import type { BodyMetrics } from '../types';

const baseMetrics: BodyMetrics = {
  age: 32,
  heightCm: 178,
  currentWeightKg: 80,
  targetWeightKg: 75,
  bodyFatPct: 20,
  targetBodyFatPct: 15,
  weeksToGoal: 12,
  activity: 'activo',
};

describe('computeMacroPlan', () => {
  it('produces a sensible cut plan', () => {
    const plan = computeMacroPlan(baseMetrics);
    // LBM = 64 kg → BMR ≈ 370 + 21.6*64 = 1752
    expect(plan.bmr).toBeGreaterThan(1700);
    expect(plan.bmr).toBeLessThan(1800);
    // TDEE with activo (1.725) ≈ 3022
    expect(plan.tdee).toBeGreaterThan(2900);
    expect(plan.tdee).toBeLessThan(3100);
    // Déficit razonable, target debe quedar por debajo del TDEE
    expect(plan.targetKcal).toBeLessThan(plan.tdee);
    expect(plan.dailyDeltaKcal).toBeLessThan(0);
    expect(plan.warning).toBeUndefined();
    // Weekly change negativo (perder peso)
    expect(plan.weeklyWeightChangeKg).toBeLessThan(0);
  });

  it('macros añaden cerca del targetKcal (±15 kcal)', () => {
    const plan = computeMacroPlan(baseMetrics);
    const totalKcal =
      plan.protein_g * 4 + plan.carbs_g * 4 + plan.fat_g * 9;
    expect(Math.abs(totalKcal - plan.targetKcal)).toBeLessThanOrEqual(15);
  });

  it('warns and applies safety floor on aggressive deficit', () => {
    const plan = computeMacroPlan({
      ...baseMetrics,
      currentWeightKg: 70,
      targetWeightKg: 55,
      bodyFatPct: 25,
      targetBodyFatPct: 10,
      weeksToGoal: 4, // imposible
    });
    expect(plan.warning).toBeDefined();
    expect(plan.targetKcal).toBeGreaterThanOrEqual(1200);
  });

  it('handles bulk (target weight > current)', () => {
    const plan = computeMacroPlan({
      ...baseMetrics,
      currentWeightKg: 70,
      targetWeightKg: 75,
      bodyFatPct: 15,
      targetBodyFatPct: 17,
    });
    expect(plan.dailyDeltaKcal).toBeGreaterThan(0);
    expect(plan.targetKcal).toBeGreaterThan(plan.tdee);
    expect(plan.weeklyWeightChangeKg).toBeGreaterThan(0);
  });

  it('treats weeksToGoal=0 defensively', () => {
    const plan = computeMacroPlan({ ...baseMetrics, weeksToGoal: 0 });
    expect(Number.isFinite(plan.targetKcal)).toBe(true);
    expect(plan.targetKcal).toBeGreaterThan(0);
  });

  it('activity factor scales TDEE', () => {
    const sed = computeMacroPlan({ ...baseMetrics, activity: 'sedentario' });
    const muy = computeMacroPlan({ ...baseMetrics, activity: 'muy_activo' });
    expect(muy.tdee).toBeGreaterThan(sed.tdee);
  });
});

describe('isValidMetrics', () => {
  it('accepts the base metrics', () => {
    expect(isValidMetrics(baseMetrics)).toBe(true);
  });

  it('rejects missing fields', () => {
    expect(isValidMetrics(undefined)).toBe(false);
    expect(isValidMetrics({ ...baseMetrics, age: 0 })).toBe(false);
    expect(isValidMetrics({ ...baseMetrics, bodyFatPct: 0 })).toBe(false);
  });
});

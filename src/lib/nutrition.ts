import type { ActivityLevel, BodyMetrics } from './types';

export interface MacroPlan {
  bmr: number;
  tdee: number;
  targetKcal: number;
  dailyDeltaKcal: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  weeklyWeightChangeKg: number;
  warning?: string;
}

export const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  ligero: 1.375,
  moderado: 1.55,
  activo: 1.725,
  muy_activo: 1.9,
};

export const ACTIVITY_LABEL: Record<ActivityLevel, string> = {
  sedentario: 'Sedentario',
  ligero: 'Ligero (1-3 días/sem)',
  moderado: 'Moderado (3-5 días/sem)',
  activo: 'Activo (gym 90+ min, L-V)',
  muy_activo: 'Muy activo (2x día)',
};

// Energía aproximada por kg de grasa corporal
const KCAL_PER_KG_FAT = 7700;
// Mínimo seguro absoluto para adultos
const ABSOLUTE_MIN_KCAL = 1200;

export function isValidMetrics(m: Partial<BodyMetrics> | undefined): m is BodyMetrics {
  if (!m) return false;
  return (
    typeof m.age === 'number' && m.age > 0 &&
    typeof m.heightCm === 'number' && m.heightCm > 0 &&
    typeof m.currentWeightKg === 'number' && m.currentWeightKg > 0 &&
    typeof m.targetWeightKg === 'number' && m.targetWeightKg > 0 &&
    typeof m.bodyFatPct === 'number' && m.bodyFatPct >= 3 && m.bodyFatPct < 70 &&
    typeof m.targetBodyFatPct === 'number' && m.targetBodyFatPct >= 3 && m.targetBodyFatPct < 70 &&
    typeof m.weeksToGoal === 'number' && m.weeksToGoal > 0 &&
    typeof m.activity === 'string'
  );
}

export function computeMacroPlan(m: BodyMetrics): MacroPlan {
  const weeks = Math.max(m.weeksToGoal, 1);

  // Masa magra (LBM) actual
  const lbmKg = m.currentWeightKg * (1 - m.bodyFatPct / 100);

  // BMR — Katch-McArdle
  const bmr = 370 + 21.6 * lbmKg;

  // TDEE
  const tdee = bmr * ACTIVITY_FACTORS[m.activity];

  // Energía a desplazar basada en el cambio de masa grasa
  const currentFatKg = m.currentWeightKg * (m.bodyFatPct / 100);
  const targetFatKg = m.targetWeightKg * (m.targetBodyFatPct / 100);
  const fatDeltaKg = targetFatKg - currentFatKg; // negativo = perder grasa
  const totalKcalDelta = fatDeltaKg * KCAL_PER_KG_FAT;
  const dailyDeltaKcal = totalKcalDelta / (weeks * 7);

  // Floor de seguridad: nunca por debajo de BMR ni por debajo de 1200 kcal
  const rawTarget = tdee + dailyDeltaKcal;
  const safeFloor = Math.max(bmr, ABSOLUTE_MIN_KCAL);
  const targetKcal = Math.round(Math.max(rawTarget, safeFloor));
  const warning =
    rawTarget < safeFloor
      ? 'El déficit propuesto es demasiado agresivo. Ajustamos al mínimo seguro.'
      : undefined;

  // Macros
  // Proteína: 2.2 g/kg LBM (alto, óptimo en déficit + entrenamiento de fuerza)
  const protein_g = Math.round(2.2 * lbmKg);
  // Grasa: 0.8 g/kg de peso corporal (suficiente para hormonas, deja más
  // espacio a carbos que alimentan el entrenamiento de fuerza)
  const fat_g = Math.round(0.8 * m.currentWeightKg);
  // Carbs: el resto
  const proteinKcal = protein_g * 4;
  const fatKcal = fat_g * 9;
  const carbsKcal = Math.max(0, targetKcal - proteinKcal - fatKcal);
  const carbs_g = Math.round(carbsKcal / 4);

  const weeklyWeightChangeKg = (m.targetWeightKg - m.currentWeightKg) / weeks;

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    targetKcal,
    dailyDeltaKcal: Math.round(dailyDeltaKcal),
    protein_g,
    carbs_g,
    fat_g,
    weeklyWeightChangeKg,
    warning,
  };
}

/**
 * Sugiere `targetWeightKg` y `targetBodyFatPct` a partir de edad, estatura,
 * peso actual y % de grasa actual. Heurística:
 *  - Peso meta = peso correspondiente a un BMI saludable (22.5), pero
 *    limitado a un cambio máximo de ±15% sobre el peso actual para evitar
 *    sugerencias irreales.
 *  - % grasa meta = current − 5, dentro del rango saludable (12% piso, 25% techo).
 *    Si no se conoce el % grasa actual, se usa un objetivo genérico por edad.
 */
export interface GoalSuggestion {
  targetWeightKg: number;
  targetBodyFatPct: number;
  weeksToGoal: number;
}

function suggestSafeWeeksToGoal(currentWeightKg: number, targetWeightKg: number): number {
  const lossKg = currentWeightKg - targetWeightKg;
  if (lossKg <= 0) return 12;

  const minLossPerWeekKg = currentWeightKg * 0.005;
  const maxLossPerWeekKg = currentWeightKg * 0.01;
  const preferredLossPerWeekKg = currentWeightKg * 0.0075;

  const minWeeks = Math.max(1, Math.ceil(lossKg / maxLossPerWeekKg));
  const maxWeeks = Math.max(minWeeks, Math.ceil(lossKg / minLossPerWeekKg));
  const preferredWeeks = Math.max(1, Math.ceil(lossKg / preferredLossPerWeekKg));

  return Math.max(minWeeks, Math.min(maxWeeks, preferredWeeks));
}

export function suggestGoals(m: {
  age?: number;
  heightCm?: number;
  currentWeightKg?: number;
  bodyFatPct?: number;
}): GoalSuggestion | null {
  if (!m.heightCm || m.heightCm <= 0) return null;
  if (!m.currentWeightKg || m.currentWeightKg <= 0) return null;

  const heightM = m.heightCm / 100;
  const healthyBmi = 22.5;
  const idealWeight = healthyBmi * heightM * heightM;

  // Limitar a ±15% sobre el peso actual
  const minAllowed = m.currentWeightKg * 0.85;
  const maxAllowed = m.currentWeightKg * 1.15;
  const targetWeightKg = Math.round(
    Math.max(minAllowed, Math.min(maxAllowed, idealWeight)) * 10,
  ) / 10;

  // % grasa meta
  let targetBodyFatPct: number;
  if (typeof m.bodyFatPct === 'number' && m.bodyFatPct > 0) {
    targetBodyFatPct = Math.max(12, Math.min(25, Math.round(m.bodyFatPct - 5)));
  } else {
    // Sin BF actual: objetivo genérico ajustado por edad
    const age = m.age ?? 30;
    targetBodyFatPct = age < 30 ? 15 : age < 45 ? 17 : 20;
  }

  const weeksToGoal = suggestSafeWeeksToGoal(m.currentWeightKg, targetWeightKg);

  return { targetWeightKg, targetBodyFatPct, weeksToGoal };
}

export function defaultMetrics(): BodyMetrics {
  return {
    age: 30,
    heightCm: 170,
    currentWeightKg: 75,
    targetWeightKg: 72,
    bodyFatPct: 20,
    targetBodyFatPct: 15,
    weeksToGoal: 12,
    activity: 'activo',
  };
}

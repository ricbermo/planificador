import { FOODS, FOODS_BY_ID } from '../data/foods';
import type {
  DayMeat,
  Food,
  Meal,
  MealItem,
  MealSlot,
} from './types';

// ──────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────

const rand = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const itemKcal = (item: MealItem): number =>
  FOODS_BY_ID[item.foodId].kcal * item.multiplier;

const itemProtein = (item: MealItem): number =>
  FOODS_BY_ID[item.foodId].protein * item.multiplier;

export function mealKcal(meal: Meal): number {
  return meal.items.reduce((s, i) => s + itemKcal(i), 0);
}

export function mealProtein(meal: Meal): number {
  return meal.items.reduce((s, i) => s + itemProtein(i), 0);
}

const itemCarbs = (item: MealItem): number =>
  FOODS_BY_ID[item.foodId].carb * item.multiplier;

export function mealCarbs(meal: Meal): number {
  return meal.items.reduce((s, i) => s + itemCarbs(i), 0);
}

const itemKcalP2 = (item: MealItem): number =>
  FOODS_BY_ID[item.foodId].kcal * (item.multiplierP2 ?? 0);

const itemProteinP2 = (item: MealItem): number =>
  FOODS_BY_ID[item.foodId].protein * (item.multiplierP2 ?? 0);

export function mealKcalP2(meal: Meal): number {
  return meal.items.reduce((s, i) => s + itemKcalP2(i), 0);
}

export function mealProteinP2(meal: Meal): number {
  return meal.items.reduce((s, i) => s + itemProteinP2(i), 0);
}

const itemCarbsP2 = (item: MealItem): number =>
  FOODS_BY_ID[item.foodId].carb * (item.multiplierP2 ?? 0);

export function mealCarbsP2(meal: Meal): number {
  return meal.items.reduce((s, i) => s + itemCarbsP2(i), 0);
}

export function itemGramsP2(item: MealItem): number {
  return FOODS_BY_ID[item.foodId].baseGrams * (item.multiplierP2 ?? 0);
}

export function mealGrams(item: MealItem): number {
  return FOODS_BY_ID[item.foodId].baseGrams * item.multiplier;
}

const itemsKcal = (items: MealItem[]): number =>
  items.reduce((sum, item) => sum + itemKcal(item), 0);

const clampMult = (food: Food, m: number): number => {
  const min = food.minMultiplier ?? 0.5;
  let max = food.maxMultiplier ?? 5;
  if (food.maxGrams !== undefined && food.baseGrams > 0) {
    max = Math.min(max, food.maxGrams / food.baseGrams);
  }
  return Math.max(min, Math.min(max, m));
};

const round = (m: number, step: number): number =>
  Math.round(m / step) * step;

const foodMaxMultiplier = (food: Food): number => {
  let max = food.maxMultiplier ?? 5;
  if (food.maxGrams !== undefined && food.baseGrams > 0) {
    max = Math.min(max, food.maxGrams / food.baseGrams);
  }
  return max;
};

const normalizeItemMultiplier = (item: MealItem): MealItem => {
  const food = FOODS_BY_ID[item.foodId];
  return {
    ...item,
    multiplier: roundMultiplier(food, clampMult(food, item.multiplier)),
  };
};

// ──────────────────────────────────────────────────────────────────────────
// Pools por slot/role
// ──────────────────────────────────────────────────────────────────────────

const dayMeats = (meat: DayMeat): Food[] =>
  FOODS.filter((f) => f.tags.includes('meat-day') && f.meat === meat);

const proteinsForMeal = (slot: MealSlot, dayMeat: DayMeat, useDayMeat: boolean): Food[] => {
  if (useDayMeat) return dayMeats(dayMeat);
  return FOODS.filter(
    (f) =>
      f.meals.includes(slot) &&
      f.role === 'protein' &&
      !f.tags.includes('meat-day') &&
      !f.tags.includes('shake'),
  );
};

const carbsForMeal = (slot: MealSlot): Food[] =>
  FOODS.filter((f) => f.meals.includes(slot) && f.role === 'carb');

const vegsForMeal = (slot: MealSlot): Food[] =>
  FOODS.filter((f) => f.meals.includes(slot) && f.role === 'veg');

const extrasForMeal = (slot: MealSlot): Food[] =>
  FOODS.filter((f) => f.meals.includes(slot) && f.role === 'extra');

// ──────────────────────────────────────────────────────────────────────────
// Reparto dinámico de calorías
// ──────────────────────────────────────────────────────────────────────────

/**
 * Reparte `remainingKcal` entre las comidas que NO están done.
 * Las comidas done conservan sus kcal actuales y se descuentan del total.
 */
export function splitKcal(
  remainingKcal: number,
  meals: Meal[],
): Record<MealSlot, number> {
  const pending = meals.filter((m) => !m.done).map((m) => m.slot);

  // pesos relativos por slot
  const weights: Record<MealSlot, number> = {
    breakfast: 0.30,
    lunch: 0.45,
    dinner: 0.25,
  };

  const totalWeight = pending.reduce((s, slot) => s + weights[slot], 0);
  const out: Record<MealSlot, number> = { breakfast: 0, lunch: 0, dinner: 0 };

  // comidas done conservan su valor real
  for (const m of meals) {
    if (m.done) out[m.slot] = mealKcal(m);
  }

  if (totalWeight === 0 || remainingKcal <= 0) return out;

  for (const slot of pending) {
    out[slot] = Math.round((remainingKcal * weights[slot]) / totalWeight);
  }
  return out;
}

// ──────────────────────────────────────────────────────────────────────────
// Generación por comida
// ──────────────────────────────────────────────────────────────────────────

interface BuildArgs {
  slot: MealSlot;
  budget: number;
  dayMeat: DayMeat;
  useDayMeat: boolean;
  archetype?: 'sandwich' | 'plate';
}

function buildBreakfast({ budget }: BuildArgs): MealItem[] {
  // Siempre whey + huevos + 1 carbo + opcional fruta/grasa
  const items: MealItem[] = [];

  // 1) Whey shake — fijo 1 scoop
  const whey = FOODS_BY_ID['whey'];
  items.push({ foodId: whey.id, multiplier: 1 });

  // 2) Proteína extra: huevos o yogur
  const extraProteinPool = [FOODS_BY_ID['egg'], FOODS_BY_ID['greek-yogurt']];
  const extraProtein = rand(extraProteinPool);
  items.push({
    foodId: extraProtein.id,
    multiplier: extraProtein.id === 'egg' ? 3 : 1,
  });

  // 3) Carbo de desayuno
  const carbPool = [
    FOODS_BY_ID['oats'],
    FOODS_BY_ID['sourdough'],
    FOODS_BY_ID['banana'],
  ];
  const carb = rand(carbPool);
  items.push({ foodId: carb.id, multiplier: 1 });

  // 4) Extra ocasional
  const extras = [
    FOODS_BY_ID['peanut-butter'],
    FOODS_BY_ID['almonds'],
    FOODS_BY_ID['apple'],
    FOODS_BY_ID['avocado'],
  ];
  if (Math.random() > 0.4) {
    items.push({ foodId: rand(extras).id, multiplier: 1 });
  }

  return scaleToBudget(items, budget);
}

function topUpMealToBudget(
  items: MealItem[],
  budget: number,
  slot: 'lunch' | 'dinner',
): MealItem[] {
  let scaled = scaleToBudget(items, budget);

  for (let attempt = 0; attempt < 3 && itemsKcal(scaled) < budget * 0.95; attempt++) {
    const enriched = scaled.slice();

    if (!enriched.some((item) => item.foodId === 'olive-oil')) {
      enriched.push({ foodId: 'olive-oil', multiplier: 0.5 });
    } else {
      const existingIds = new Set(enriched.map((item) => item.foodId));
      const extraCarbPool = carbsForMeal(slot).filter((food) => !existingIds.has(food.id));
      if (extraCarbPool.length === 0) break;
      enriched.push({ foodId: rand(extraCarbPool).id, multiplier: 1 });
    }

    scaled = scaleToBudget(enriched, budget);
  }

  return scaled;
}

function buildLunch({ budget, dayMeat, useDayMeat }: BuildArgs): MealItem[] {
  const items: MealItem[] = [];

  // proteína
  const protein = rand(proteinsForMeal('lunch', dayMeat, useDayMeat));
  items.push({ foodId: protein.id, multiplier: 2 });

  // carbo
  const carb = rand(carbsForMeal('lunch'));
  items.push({ foodId: carb.id, multiplier: 2 });

  // veg
  const veg = rand(vegsForMeal('lunch'));
  items.push({ foodId: veg.id, multiplier: 1 });

  // extra (grasa) ocasional
  if (Math.random() > 0.3) {
    items.push({ foodId: 'olive-oil', multiplier: 0.5 });
  }

  return topUpMealToBudget(items, budget, 'lunch');
}

function buildDinner({
  budget,
  dayMeat,
  useDayMeat,
  archetype,
}: BuildArgs): MealItem[] {
  const arch = archetype ?? (Math.random() > 0.5 ? 'sandwich' : 'plate');
  const items: MealItem[] = [];

  if (arch === 'sandwich') {
    items.push({ foodId: 'sourdough', multiplier: 2 });
    if (useDayMeat) {
      const m = rand(dayMeats(dayMeat));
      items.push({ foodId: m.id, multiplier: 1.2 });
    } else {
      items.push({ foodId: 'ham', multiplier: 2 });
    }
    if (Math.random() > 0.4) {
      items.push({ foodId: 'fresh-cheese', multiplier: 1 });
    }
    items.push({ foodId: 'tomato', multiplier: 1 });
  } else {
    // plate
    const protein = rand(proteinsForMeal('dinner', dayMeat, useDayMeat));
    items.push({ foodId: protein.id, multiplier: 1.5 });
    const carb = rand(carbsForMeal('dinner'));
    items.push({ foodId: carb.id, multiplier: 1.5 });
    items.push({ foodId: rand(vegsForMeal('dinner')).id, multiplier: 1 });
  }

  return topUpMealToBudget(items, budget, 'dinner');
}

// ──────────────────────────────────────────────────────────────────────────
// Escalado al presupuesto
// ──────────────────────────────────────────────────────────────────────────

/**
 * Escala los multiplicadores de los items para que su suma de kcal
 * cuadre con `budget` (±5%). Estrategia:
 *   1. Calcula el factor global = budget / kcalActual
 *   2. Lo aplica al item con role='carb' o 'protein' (preferentemente carb)
 *      respetando min/max del food.
 *   3. Si todavía hay gap, intenta sobre proteína.
 */
function scaleToBudget(items: MealItem[], budget: number): MealItem[] {
  if (items.length === 0 || budget <= 0) return items;

  const scaledItems = items.map(normalizeItemMultiplier);

  const totalKcal = (its: MealItem[]) =>
    its.reduce((s, i) => s + itemKcal(i), 0);

  const adjustItem = (idx: number, gap: number): boolean => {
    const it = scaledItems[idx];
    const food = FOODS_BY_ID[it.foodId];
    if (food.kcal === 0) return false;
    const prev = it.multiplier;
    const deltaMult = gap / food.kcal;
    const next = clampMult(food, it.multiplier + deltaMult);
    scaledItems[idx] = { ...it, multiplier: roundMultiplier(food, next) };
    return Math.abs(scaledItems[idx].multiplier - prev) > 0.001;
  };

  // Prioridad de targets para cuadrar: carb principal → proteína principal
  const carbIdx = scaledItems.findIndex((i) => FOODS_BY_ID[i.foodId].role === 'carb');
  const proteinIdx = scaledItems.findIndex(
    (i) => FOODS_BY_ID[i.foodId].role === 'protein',
  );

  for (let pass = 0; pass < 4; pass++) {
    const cur = totalKcal(scaledItems);
    const gap = budget - cur;
    if (Math.abs(gap) / budget < 0.05) break;

    let moved = false;
    if (carbIdx >= 0) {
      moved = adjustItem(carbIdx, gap);
    }

    if (!moved && proteinIdx >= 0) {
      moved = adjustItem(proteinIdx, gap);
    }

    if (!moved) {
      break;
    }

  }

  return scaledItems.map(normalizeItemMultiplier);
}

function p2MaxMultiplier(food: Food): number {
  return Math.max(foodMaxMultiplier(food) * 2, 8);
}

function roundMultiplierP2(food: Food, m: number): number {
  const clamped = Math.max(0, Math.min(p2MaxMultiplier(food), m));
  if (food.unit) return Math.round(clamped);
  return round(clamped, 0.25);
}

function normalizeItemMultiplierP2(item: MealItem): MealItem {
  const food = FOODS_BY_ID[item.foodId];
  return {
    ...item,
    multiplier: roundMultiplierP2(food, item.multiplier),
  };
}

function scaleToBudgetP2Relaxed(items: MealItem[], budget: number): MealItem[] {
  if (items.length === 0 || budget <= 0) return items.map((item) => ({ ...item, multiplier: 0 }));

  const scaledItems = items.map(normalizeItemMultiplierP2);

  const totalKcal = (its: MealItem[]) =>
    its.reduce((sum, item) => sum + itemKcal(item), 0);

  for (let pass = 0; pass < 16; pass++) {
    const cur = totalKcal(scaledItems);
    const gap = budget - cur;
    if (Math.abs(gap) / budget < 0.05) break;

    const candidates = scaledItems
      .map((item, idx) => {
        const food = FOODS_BY_ID[item.foodId];
        const roleBoost =
          gap >= 0
            ? food.role === 'carb' || food.role === 'protein'
              ? 0
              : food.role === 'extra'
                ? 1
                : 2
            : 0;
        return {
          idx,
          kcal: food.kcal,
          roleBoost,
        };
      })
      .sort((a, b) =>
        gap >= 0
          ? a.roleBoost - b.roleBoost || b.kcal - a.kcal
          : b.kcal - a.kcal,
      );

    let moved = false;

    for (const candidate of candidates) {
      const it = scaledItems[candidate.idx];
      const food = FOODS_BY_ID[it.foodId];
      if (food.kcal === 0) continue;
      const prev = it.multiplier;
      const deltaMult = gap / food.kcal;
      const next = roundMultiplierP2(food, it.multiplier + deltaMult);
      if (Math.abs(next - prev) <= 0.001) continue;
      scaledItems[candidate.idx] = { ...it, multiplier: next };
      moved = true;
      break;
    }

    if (!moved) break;
  }

  return scaledItems.map(normalizeItemMultiplierP2);
}

function proteinForMealItems(items: MealItem[]): number {
  return items.reduce((sum, item) => {
    const food = FOODS_BY_ID[item.foodId];
    return sum + (food.protein * item.multiplier);
  }, 0);
}

function totalProteinForMeals(meals: Meal[]): number {
  return meals.reduce((sum, meal) => sum + proteinForMealItems(meal.items), 0);
}

function proteinRolePriority(food: Food): number {
  if (food.role === 'protein') return 0;
  if (food.role === 'shake') return 1;
  if (food.tags.includes('protein')) return 2;
  return 3;
}

function enforceMinProteinTarget(
  meals: Meal[],
  budgets: Record<MealSlot, number>,
  minProteinTarget: number,
): void {
  if (minProteinTarget <= 0) return;

  for (let pass = 0; pass < 16; pass++) {
    const currentProtein = totalProteinForMeals(meals);
    const deficit = minProteinTarget - currentProtein;
    if (deficit <= 0.5) return;

    const candidates = meals.flatMap((meal, mealIndex) =>
      (meal.done ? [] :
      meal.items
        .map((item, itemIndex) => {
          const food = FOODS_BY_ID[item.foodId];
          const maxRounded = roundMultiplier(food, foodMaxMultiplier(food));
          const headroom = maxRounded - item.multiplier;
          if (headroom <= 0.001 || food.protein <= 0) return null;
          return {
            mealIndex,
            itemIndex,
            rolePriority: proteinRolePriority(food),
            proteinPerStep: food.protein,
          };
        })
        .filter((c): c is NonNullable<typeof c> => c !== null)),
    );

    if (candidates.length === 0) return;

    candidates.sort((a, b) =>
      a.rolePriority - b.rolePriority || b.proteinPerStep - a.proteinPerStep,
    );

    let improved = false;

    for (const candidate of candidates) {
      const meal = meals[candidate.mealIndex];
      const item = meal.items[candidate.itemIndex];
      const food = FOODS_BY_ID[item.foodId];
      const target = clampMult(food, item.multiplier + (deficit / food.protein));
      const nextMultiplier = roundMultiplier(food, target);
      if (nextMultiplier <= item.multiplier + 0.001) continue;

      const beforeProtein = proteinForMealItems(meal.items);
      const nextItems = meal.items.slice();
      nextItems[candidate.itemIndex] = { ...item, multiplier: nextMultiplier };
      const rescaled = scaleToBudget(nextItems, budgets[meal.slot]);
      const afterProtein = proteinForMealItems(rescaled);

      if (afterProtein <= beforeProtein + 0.1) continue;

      meal.items = rescaled;
      improved = true;
      break;
    }

    if (!improved) return;
  }
}

/**
 * Toma items ya generados (con `multiplier` para P1) y calcula `multiplierP2`
 * escalando al presupuesto de P2 — sin cambiar los foods elegidos.
 */
export function applyP2Multipliers(
  items: MealItem[],
  budgetP2: number,
  allowRelaxedBounds = false,
): MealItem[] {
  if (items.length === 0 || budgetP2 <= 0) {
    return items.map((i) => ({ ...i, multiplierP2: 0 }));
  }
  // Clonamos como si fueran items P1 con multipliers de P1 → escalamos al budget P2
  const clone: MealItem[] = items.map((i) => ({
    foodId: i.foodId,
    multiplier: i.multiplier,
  }));
  let scaled = scaleToBudget(clone, budgetP2);
  const pct = (itemsKcal(scaled) / budgetP2) * 100;
  if (allowRelaxedBounds && (pct < MIN_RANGE_PCT || pct > MAX_RANGE_PCT)) {
    scaled = scaleToBudgetP2Relaxed(clone, budgetP2);
  }
  return items.map((orig, idx) => ({
    ...orig,
    multiplierP2: scaled[idx].multiplier,
  }));
}

function roundMultiplier(food: Food, m: number): number {
  // Alimentos en unidades discretas → multiplier entero
  if (food.unit) {
    return Math.max(food.minMultiplier ?? 1, Math.round(m));
  }
  if (food.id === 'whey') return 1;
  // 100g step → multiplicador 0.5
  return round(m, 0.25);
}

// ──────────────────────────────────────────────────────────────────────────
// API pública
// ──────────────────────────────────────────────────────────────────────────

export interface GenerateOptions {
  targetKcal: number;
  remainingKcal?: number;
  dayMeat: DayMeat;
  minProteinTarget?: number;
  // Si se pasa, conserva las comidas done y reroll-ea las pendientes
  existing?: Meal[];
  // Override por slot si el usuario cambió el toggle "usar proteína del día"
  useDayMeatOverride?: Partial<Record<MealSlot, boolean>>;
  // Si está presente, calcula también las cantidades para una segunda persona
  remainingKcalP2?: number;
}

const DEFAULT_USE_DAY_MEAT: Record<MealSlot, boolean> = {
  breakfast: false, // desayuno usa whey + huevos
  lunch: true,
  dinner: false,
};

const MIN_RANGE_PCT = 95;
const MAX_RANGE_PCT = 105;
const MAX_GENERATION_ATTEMPTS = 30;

interface PlanEvaluation {
  ok: boolean;
  score: number;
}

function planKcal(meals: Meal[]): number {
  return meals.reduce((sum, meal) => sum + mealKcal(meal), 0);
}

function planKcalP2(meals: Meal[]): number {
  return meals.reduce((sum, meal) => sum + mealKcalP2(meal), 0);
}

function pctPenalty(value: number, min: number, max: number): number {
  if (value < min) return min - value;
  if (value > max) return value - max;
  return 0;
}

function evaluatePlan(meals: Meal[], opts: GenerateOptions): PlanEvaluation {
  const budgetP1 = opts.remainingKcal ?? opts.targetKcal;
  const kcal = planKcal(meals);
  const pct = budgetP1 > 0 ? (kcal / budgetP1) * 100 : 100;
  const kcalPenalty = pctPenalty(pct, MIN_RANGE_PCT, MAX_RANGE_PCT);

  const protein = totalProteinForMeals(meals);
  const proteinPenalty =
    opts.minProteinTarget !== undefined && opts.minProteinTarget > 0
      ? Math.max(0, opts.minProteinTarget - protein)
      : 0;

  let p2Penalty = 0;
  if (opts.remainingKcalP2 !== undefined && opts.remainingKcalP2 > 0) {
    const kcalP2 = planKcalP2(meals);
    const pctP2 = (kcalP2 / opts.remainingKcalP2) * 100;
    p2Penalty = pctPenalty(pctP2, MIN_RANGE_PCT, MAX_RANGE_PCT);
  }

  const score = kcalPenalty * 100 + p2Penalty * 80 + proteinPenalty;
  return {
    ok: kcalPenalty === 0 && p2Penalty === 0 && proteinPenalty <= 0.001,
    score,
  };
}

function buildDayOnce({
  targetKcal,
  remainingKcal,
  dayMeat,
  minProteinTarget,
  existing,
  useDayMeatOverride,
  remainingKcalP2,
}: GenerateOptions): Meal[] {
  const slots: MealSlot[] = ['breakfast', 'lunch', 'dinner'];

  // Construir base meals (preservando done de existing)
  const baseMeals: Meal[] = slots.map((slot) => {
    const prev = existing?.find((m) => m.slot === slot);
    return {
      slot,
      items: prev?.items ?? [],
      done: prev?.done ?? false,
      useDayMeat:
        useDayMeatOverride?.[slot] ?? prev?.useDayMeat ?? DEFAULT_USE_DAY_MEAT[slot],
      archetype: prev?.archetype,
    };
  });

  const remaining = remainingKcal ?? targetKcal;
  const budgets = splitKcal(remaining, baseMeals);

  for (const meal of baseMeals) {
    if (meal.done) continue; // congelada
    const budget = budgets[meal.slot];
    const args: BuildArgs = {
      slot: meal.slot,
      budget,
      dayMeat,
      useDayMeat: meal.useDayMeat,
      archetype: meal.archetype,
    };
    if (meal.slot === 'breakfast') meal.items = buildBreakfast(args);
    else if (meal.slot === 'lunch') meal.items = buildLunch(args);
    else {
      meal.items = buildDinner(args);
      if (!meal.archetype) {
        meal.archetype = Math.random() > 0.5 ? 'sandwich' : 'plate';
      }
    }
  }

  if (minProteinTarget !== undefined && minProteinTarget > 0) {
    enforceMinProteinTarget(baseMeals, budgets, minProteinTarget);
  }

  // Persona 2: re-usar foods, recalcular multipliers
  if (remainingKcalP2 !== undefined && remainingKcalP2 > 0) {
    const budgetsP2 = splitKcal(remainingKcalP2, baseMeals);
    for (const meal of baseMeals) {
      if (meal.done) {
        // Si la comida estaba congelada, conserva el multiplierP2 anterior
        continue;
      }
      meal.items = applyP2Multipliers(meal.items, budgetsP2[meal.slot], true);
    }
  } else {
    // Sin P2: limpiar cualquier multiplierP2 residual
    for (const meal of baseMeals) {
      if (!meal.done) {
        meal.items = meal.items.map((i) => {
          const { multiplierP2: _drop, ...rest } = i;
          void _drop;
          return rest;
        });
      }
    }
  }

  return baseMeals;
}

export function generateDay({
  targetKcal,
  remainingKcal,
  dayMeat,
  minProteinTarget,
  existing,
  useDayMeatOverride,
  remainingKcalP2,
}: GenerateOptions): Meal[] {
  const options: GenerateOptions = {
    targetKcal,
    remainingKcal,
    dayMeat,
    minProteinTarget,
    existing,
    useDayMeatOverride,
    remainingKcalP2,
  };

  let bestMeals = buildDayOnce(options);
  let bestEval = evaluatePlan(bestMeals, options);
  if (bestEval.ok) return bestMeals;

  const hasPendingMeals = bestMeals.some((meal) => !meal.done);
  if (!hasPendingMeals) return bestMeals;

  for (let attempt = 1; attempt < MAX_GENERATION_ATTEMPTS; attempt++) {
    const candidate = buildDayOnce(options);
    const candidateEval = evaluatePlan(candidate, options);
    if (candidateEval.ok) return candidate;
    if (candidateEval.score < bestEval.score) {
      bestMeals = candidate;
      bestEval = candidateEval;
    }
  }

  return bestMeals;
}

/**
 * Reroll de un único ítem dentro de una comida, manteniendo el rol.
 * Re-escala los gramos de la comida al mismo presupuesto.
 */
export function rerollItem(
  meal: Meal,
  itemIndex: number,
  budget: number,
  dayMeat: DayMeat,
  budgetP2?: number,
): Meal {
  const item = meal.items[itemIndex];
  const food = FOODS_BY_ID[item.foodId];
  const role = food.role ?? 'extra';

  let pool: Food[] = [];
  if (role === 'shake') {
    pool = [FOODS_BY_ID['whey']];
  } else if (role === 'protein') {
    if (food.tags.includes('meat-day')) {
      pool = dayMeats(dayMeat).filter((f) => f.id !== food.id);
      if (pool.length === 0) pool = dayMeats(dayMeat);
    } else {
      pool = proteinsForMeal(meal.slot, dayMeat, false).filter(
        (f) => f.id !== food.id,
      );
    }
  } else if (role === 'carb') {
    pool = carbsForMeal(meal.slot).filter((f) => f.id !== food.id);
  } else if (role === 'veg') {
    pool = vegsForMeal(meal.slot).filter((f) => f.id !== food.id);
  } else {
    pool = extrasForMeal(meal.slot).filter((f) => f.id !== food.id);
  }

  if (pool.length === 0) return meal;
  const next = rand(pool);

  const newItems = meal.items.slice();
  newItems[itemIndex] = { foodId: next.id, multiplier: item.multiplier };

  let scaled = scaleToBudget(newItems, budget);
  if (budgetP2 !== undefined && budgetP2 > 0) {
    scaled = applyP2Multipliers(scaled, budgetP2, true);
  }
  return {
    ...meal,
    items: scaled,
  };
}

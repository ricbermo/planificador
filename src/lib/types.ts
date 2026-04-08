export type FoodTag =
  | 'protein'
  | 'carb'
  | 'veg'
  | 'fruit'
  | 'fat'
  | 'dairy'
  | 'shake'
  | 'bread'
  | 'egg'
  | 'meat-day'; // pollo / res / cerdo (la "proteína del día")

export type MealSlot = 'breakfast' | 'lunch' | 'dinner';

export type DayMeat = 'chicken' | 'beef' | 'pork';

export interface Food {
  id: string;
  name: string;
  baseUnit: string;   // texto: "100 g", "1 (50 g)"
  baseGrams: number;  // gramos por porción base
  kcal: number;       // por porción base
  protein: number;
  carb: number;
  fat: number;
  tags: FoodTag[];
  meals: MealSlot[];
  // si pertenece a la categoría meat-day, qué animal:
  meat?: DayMeat;
  // pin: el slot que el ítem ocupa cuando se usa en plantilla
  // (protein/carb/veg/extra). Lo usamos al rerolear para mantener "rol".
  role?: 'protein' | 'carb' | 'veg' | 'extra' | 'shake';
  // multiplicador máximo razonable (para escalado de gramos)
  maxMultiplier?: number;
  // multiplicador mínimo razonable
  minMultiplier?: number;
  // tope absoluto en gramos por persona (independiente del multiplicador)
  maxGrams?: number;
  // Si está presente, el alimento se cuenta en unidades discretas (huevos,
  // latas, tortillas, rebanadas) en vez de gramos. El multiplier representa
  // la cantidad de unidades y siempre se redondea a entero.
  unit?: { singular: string; plural: string };
}

export interface MealItem {
  foodId: string;
  multiplier: number; // veces la porción base (persona 1)
  multiplierP2?: number; // veces la porción base (persona 2, opcional)
}

export type ActivityLevel =
  | 'sedentario'
  | 'ligero'
  | 'moderado'
  | 'activo'
  | 'muy_activo';

export interface BodyMetrics {
  age: number;
  heightCm: number;
  currentWeightKg: number;
  targetWeightKg: number;
  bodyFatPct: number;
  targetBodyFatPct: number;
  weeksToGoal: number;
  activity: ActivityLevel;
}

export interface MacroSummary {
  protein_g: number;
  carbs_g: number;
  fat_g: number;
  bmr: number;
  tdee: number;
  dailyDeltaKcal: number;
  weeklyWeightChangeKg: number;
  warning?: string;
}

export interface PersonInfo {
  name: string;
  targetKcal: number;
  remainingKcal: number;
  metrics?: BodyMetrics;
  manualKcalOverride?: boolean;
  macros?: MacroSummary;
}

export interface Meal {
  slot: MealSlot;
  items: MealItem[];
  done: boolean;
  // Si true, la proteína de este slot debe ser la "proteína del día"
  useDayMeat: boolean;
  // arquetipo elegido (solo cena: 'sandwich' | 'plate')
  archetype?: 'sandwich' | 'plate';
}

export interface DayState {
  targetKcal: number;
  remainingKcal: number;
  dayMeat: DayMeat;
  meals: Meal[];
  generatedAt: string;
  // Segunda persona opcional (misma comida, distintas cantidades)
  person2?: PersonInfo;
  // Nombre de la persona 1 (default "P1")
  person1Name?: string;
  // Métricas corporales y macros de la persona 1 (opcional para retrocompatibilidad)
  person1Metrics?: BodyMetrics;
  person1Macros?: MacroSummary;
  person1ManualKcalOverride?: boolean;
}

import { useEffect, useMemo, useState } from 'react';
import { SetupBar } from './components/SetupBar';
import { DayStatus } from './components/DayStatus';
import { MealCard } from './components/MealCard';
import { HowItWorksModal } from './components/HowItWorksModal';
import {
  generateDay,
  mealKcal,
  mealKcalP2,
  mealProtein,
  mealProteinP2,
  rerollItem,
  splitKcal,
} from './lib/generator';
import { computeMacroPlan, defaultMetrics, isValidMetrics } from './lib/nutrition';
import { loadDay, saveDay } from './lib/storage';
import type { BodyMetrics, DayMeat, DayState, MacroSummary, MealSlot } from './lib/types';

function planToSummary(plan: ReturnType<typeof computeMacroPlan>): MacroSummary {
  return {
    protein_g: plan.protein_g,
    carbs_g: plan.carbs_g,
    fat_g: plan.fat_g,
    bmr: plan.bmr,
    tdee: plan.tdee,
    dailyDeltaKcal: plan.dailyDeltaKcal,
    weeklyWeightChangeKg: plan.weeklyWeightChangeKg,
    warning: plan.warning,
  };
}

export default function App() {
  const [person1Metrics, setPerson1Metrics] = useState<BodyMetrics>(defaultMetrics);
  const [person1ManualOverride, setPerson1ManualOverride] = useState<boolean>(false);
  const [targetKcal, setTargetKcal] = useState<number>(2200);
  const [remainingKcal, setRemainingKcal] = useState<number>(2200);
  const [dayMeat, setDayMeat] = useState<DayMeat>('chicken');
  const [person1Name, setPerson1Name] = useState<string>('');

  const [p2Enabled, setP2Enabled] = useState<boolean>(false);
  const [p2Name, setP2Name] = useState<string>('');
  const [p2Metrics, setP2Metrics] = useState<BodyMetrics>(() => ({
    ...defaultMetrics(),
    currentWeightKg: 60,
    targetWeightKg: 56,
    bodyFatPct: 28,
    targetBodyFatPct: 22,
  }));
  const [p2ManualOverride, setP2ManualOverride] = useState<boolean>(false);
  const [p2TargetKcal, setP2TargetKcal] = useState<number>(1700);
  const [p2RemainingKcal, setP2RemainingKcal] = useState<number>(1700);

  const [day, setDay] = useState<DayState | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState<boolean>(false);

  // Planes calculados
  const person1Plan = useMemo(
    () => (isValidMetrics(person1Metrics) ? computeMacroPlan(person1Metrics) : null),
    [person1Metrics],
  );
  const person2Plan = useMemo(
    () => (isValidMetrics(p2Metrics) ? computeMacroPlan(p2Metrics) : null),
    [p2Metrics],
  );

  const person1Macros = useMemo<MacroSummary | undefined>(
    () => (person1Plan ? planToSummary(person1Plan) : undefined),
    [person1Plan],
  );
  const person2Macros = useMemo<MacroSummary | undefined>(
    () => (person2Plan ? planToSummary(person2Plan) : undefined),
    [person2Plan],
  );

  // Auto-aplica targetKcal calculado salvo override manual
  useEffect(() => {
    if (!person1ManualOverride && person1Plan) {
      setTargetKcal(person1Plan.targetKcal);
    }
  }, [person1Plan, person1ManualOverride]);

  useEffect(() => {
    if (!p2ManualOverride && person2Plan) {
      setP2TargetKcal(person2Plan.targetKcal);
    }
  }, [person2Plan, p2ManualOverride]);

  // Load on mount
  useEffect(() => {
    const stored = loadDay();
    if (stored) {
      setTargetKcal(stored.targetKcal);
      setRemainingKcal(stored.remainingKcal);
      setDayMeat(stored.dayMeat);
      setPerson1Name(stored.person1Name ?? 'Yo');
      if (stored.person1Metrics) setPerson1Metrics(stored.person1Metrics);
      if (stored.person1ManualKcalOverride) setPerson1ManualOverride(true);
      if (stored.person2) {
        setP2Enabled(true);
        setP2Name(stored.person2.name);
        setP2TargetKcal(stored.person2.targetKcal);
        setP2RemainingKcal(stored.person2.remainingKcal);
        if (stored.person2.metrics) setP2Metrics(stored.person2.metrics);
        if (stored.person2.manualKcalOverride) setP2ManualOverride(true);
      }
      setDay(stored);
    }
  }, []);

  // Persist whenever day changes
  useEffect(() => {
    if (day) saveDay(day);
  }, [day]);

  const buildDayState = (meals: DayState['meals']): DayState => ({
    targetKcal,
    remainingKcal,
    dayMeat,
    meals,
    generatedAt: new Date().toISOString(),
    person1Name,
    person1Metrics: isValidMetrics(person1Metrics) ? person1Metrics : undefined,
    person1Macros: person1Macros,
    person1ManualKcalOverride: person1ManualOverride,
    person2: p2Enabled
      ? {
          name: p2Name,
          targetKcal: p2TargetKcal,
          remainingKcal: p2RemainingKcal,
          metrics: isValidMetrics(p2Metrics) ? p2Metrics : undefined,
          macros: person2Macros,
          manualKcalOverride: p2ManualOverride,
        }
      : undefined,
  });

  const handleGenerate = () => {
    const meals = generateDay({
      targetKcal,
      dayMeat,
      remainingKcalP2: p2Enabled ? p2TargetKcal : undefined,
    });
    setRemainingKcal(targetKcal);
    if (p2Enabled) setP2RemainingKcal(p2TargetKcal);
    setDay({
      targetKcal,
      remainingKcal: targetKcal,
      dayMeat,
      meals,
      generatedAt: new Date().toISOString(),
      person1Name,
      person1Metrics: isValidMetrics(person1Metrics) ? person1Metrics : undefined,
      person1Macros,
      person1ManualKcalOverride: person1ManualOverride,
      person2: p2Enabled
        ? {
            name: p2Name,
            targetKcal: p2TargetKcal,
            remainingKcal: p2TargetKcal,
            metrics: isValidMetrics(p2Metrics) ? p2Metrics : undefined,
            macros: person2Macros,
            manualKcalOverride: p2ManualOverride,
          }
        : undefined,
    });
  };

  const handleRecalc = () => {
    if (!day) return;
    const meals = generateDay({
      targetKcal,
      remainingKcal,
      dayMeat,
      existing: day.meals,
      remainingKcalP2: p2Enabled ? p2RemainingKcal : undefined,
    });
    setDay(buildDayState(meals));
  };

  const toggleDone = (slot: MealSlot) => {
    if (!day) return;
    const meals = day.meals.map((m) =>
      m.slot === slot ? { ...m, done: !m.done } : m,
    );
    setDay({ ...day, meals });
  };

  const toggleDayMeat = (slot: MealSlot) => {
    if (!day) return;
    const flipped = !day.meals.find((m) => m.slot === slot)!.useDayMeat;
    const cleared = day.meals.map((m) =>
      m.slot === slot ? { ...m, items: [], done: false } : m,
    );
    const updated = generateDay({
      targetKcal,
      remainingKcal,
      dayMeat,
      existing: cleared,
      useDayMeatOverride: { [slot]: flipped },
      remainingKcalP2: p2Enabled ? p2RemainingKcal : undefined,
    });
    const merged = updated.map((m) => {
      if (m.slot === slot) return m;
      const orig = day.meals.find((o) => o.slot === m.slot)!;
      return { ...m, items: orig.items, done: orig.done };
    });
    setDay({ ...day, meals: merged });
  };

  const handleRerollItem = (slot: MealSlot, idx: number) => {
    if (!day) return;
    const meal = day.meals.find((m) => m.slot === slot)!;
    const budgets = splitKcal(remainingKcal, day.meals);
    const budgetsP2 = p2Enabled ? splitKcal(p2RemainingKcal, day.meals) : null;
    const newMeal = rerollItem(
      meal,
      idx,
      budgets[slot],
      dayMeat,
      budgetsP2 ? budgetsP2[slot] : undefined,
    );
    const meals = day.meals.map((m) => (m.slot === slot ? newMeal : m));
    setDay({ ...day, meals });
  };

  const handleRerollMeal = (slot: MealSlot) => {
    if (!day) return;
    const cleared = day.meals.map((m) =>
      m.slot === slot ? { ...m, items: [], archetype: undefined } : m,
    );
    const meals = generateDay({
      targetKcal,
      remainingKcal,
      dayMeat,
      existing: cleared,
      remainingKcalP2: p2Enabled ? p2RemainingKcal : undefined,
    });
    const merged = meals.map((m) => {
      if (m.slot === slot) return m;
      const orig = day.meals.find((o) => o.slot === m.slot)!;
      return { ...m, items: orig.items, done: orig.done };
    });
    setDay({ ...day, meals: merged });
  };

  const togglePerson2 = () => {
    setP2Enabled((v) => !v);
  };

  const handleTargetKcalManualChange = (n: number) => {
    setTargetKcal(n);
    setPerson1ManualOverride(true);
  };
  const handlePerson1ResetAuto = () => {
    setPerson1ManualOverride(false);
    if (person1Plan) setTargetKcal(person1Plan.targetKcal);
  };
  const handleP2TargetManualChange = (n: number) => {
    setP2TargetKcal(n);
    setP2ManualOverride(true);
  };
  const handleP2ResetAuto = () => {
    setP2ManualOverride(false);
    if (person2Plan) setP2TargetKcal(person2Plan.targetKcal);
  };

  const handlePerson1MetricsChange = (patch: Partial<BodyMetrics>) => {
    setPerson1Metrics((prev) => ({ ...prev, ...patch }));
  };
  const handleP2MetricsChange = (patch: Partial<BodyMetrics>) => {
    setP2Metrics((prev) => ({ ...prev, ...patch }));
  };

  const totals = useMemo(() => {
    if (!day) return { kcal: 0, protein: 0, kcal2: 0, protein2: 0 };
    return {
      kcal: day.meals.reduce((s, m) => s + mealKcal(m), 0),
      protein: day.meals.reduce((s, m) => s + mealProtein(m), 0),
      kcal2: day.meals.reduce((s, m) => s + mealKcalP2(m), 0),
      protein2: day.meals.reduce((s, m) => s + mealProteinP2(m), 0),
    };
  }, [day]);

  const budgets = useMemo(
    () => (day ? splitKcal(remainingKcal, day.meals) : null),
    [day, remainingKcal],
  );
  const budgetsP2 = useMemo(
    () => (day && p2Enabled ? splitKcal(p2RemainingKcal, day.meals) : null),
    [day, p2Enabled, p2RemainingKcal],
  );

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 sm:py-8">
        <header className="panel p-4 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="text-3xl sm:text-4xl font-bold text-slate-950">
                  Planificador de comidas
                </h1>
                <button
                  type="button"
                  onClick={() => setHowItWorksOpen(true)}
                  className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
                >
                  ¿Cómo funciona?
                </button>
              </div>
              <p className="mt-1 text-sm sm:text-base text-slate-700">
                Planifica y compara el día en segundos.
              </p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white/80 px-3 py-2 text-xs text-slate-600">
              {day
                ? `Última generación: ${new Date(day.generatedAt).toLocaleString('es-ES')}`
                : 'Sin generación previa'}
            </div>
          </div>
        </header>

        <SetupBar
          targetKcal={targetKcal}
          dayMeat={dayMeat}
          person1Name={person1Name}
          person1Metrics={person1Metrics}
          person1ManualOverride={person1ManualOverride}
          p2Enabled={p2Enabled}
          p2Name={p2Name}
          p2TargetKcal={p2TargetKcal}
          p2Metrics={p2Metrics}
          p2ManualOverride={p2ManualOverride}
          onTargetChange={handleTargetKcalManualChange}
          onMeatChange={setDayMeat}
          onPerson1NameChange={setPerson1Name}
          onPerson1MetricsChange={handlePerson1MetricsChange}
          onPerson1ResetAuto={handlePerson1ResetAuto}
          onTogglePerson2={togglePerson2}
          onP2NameChange={setP2Name}
          onP2TargetChange={handleP2TargetManualChange}
          onP2MetricsChange={handleP2MetricsChange}
          onP2ResetAuto={handleP2ResetAuto}
          onGenerate={handleGenerate}
        />

        {day && (
          <>
            <DayStatus
              rows={[
                {
                  name: person1Name,
                  color: 'blue',
                  targetKcal,
                  remainingKcal,
                  totalPlanned: totals.kcal,
                  totalProtein: totals.protein,
                  macros: person1Macros,
                  onRemainingChange: setRemainingKcal,
                },
                ...(p2Enabled
                  ? [
                      {
                        name: p2Name,
                        color: 'rose' as const,
                        targetKcal: p2TargetKcal,
                        remainingKcal: p2RemainingKcal,
                        totalPlanned: totals.kcal2,
                        totalProtein: totals.protein2,
                        macros: person2Macros,
                        onRemainingChange: setP2RemainingKcal,
                      },
                    ]
                  : []),
              ]}
              onRecalc={handleRecalc}
            />

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {day.meals.map((meal) => (
                <MealCard
                  key={meal.slot}
                  meal={meal}
                  budget={budgets ? budgets[meal.slot] : 0}
                  budgetP2={budgetsP2 ? budgetsP2[meal.slot] : undefined}
                  person1Name={person1Name}
                  person2Name={p2Enabled ? p2Name : undefined}
                  canToggleDayMeat={meal.slot !== 'breakfast'}
                  onToggleDone={() => toggleDone(meal.slot)}
                  onToggleDayMeat={() => toggleDayMeat(meal.slot)}
                  onRerollItem={(idx) => handleRerollItem(meal.slot, idx)}
                  onRerollMeal={() => handleRerollMeal(meal.slot)}
                />
              ))}
            </div>
          </>
        )}

        {!day && (
          <section className="panel border-dashed p-8 text-center">
            <p className="text-base font-semibold text-slate-800">Aún no hay plan del día</p>
            <p className="mt-1 text-sm text-slate-600">
              Completa la configuración y pulsa <strong>Generar día</strong> para iniciar.
            </p>
          </section>
        )}
      </div>

      <HowItWorksModal open={howItWorksOpen} onClose={() => setHowItWorksOpen(false)} />
    </div>
  );
}

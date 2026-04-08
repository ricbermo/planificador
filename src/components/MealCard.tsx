import { FOODS_BY_ID } from '../data/foods';
import {
  itemGramsP2,
  mealKcal,
  mealKcalP2,
  mealProtein,
  mealProteinP2,
} from '../lib/generator';
import type { Meal, MealSlot } from '../lib/types';

interface Props {
  meal: Meal;
  budget: number;
  budgetP2?: number;
  person1Name: string;
  person2Name?: string;
  canToggleDayMeat: boolean;
  onToggleDone: () => void;
  onToggleDayMeat: () => void;
  onRerollItem: (idx: number) => void;
  onRerollMeal: () => void;
}

const SLOT_LABEL: Record<MealSlot, string> = {
  breakfast: 'Desayuno',
  lunch: 'Almuerzo',
  dinner: 'Cena',
};

export function MealCard({
  meal,
  budget,
  budgetP2,
  person1Name,
  person2Name,
  canToggleDayMeat,
  onToggleDone,
  onToggleDayMeat,
  onRerollItem,
  onRerollMeal,
}: Props) {
  const hasP2 = budgetP2 !== undefined && budgetP2 > 0;
  const kcal = mealKcal(meal);
  const protein = mealProtein(meal);
  const kcal2 = hasP2 ? mealKcalP2(meal) : 0;
  const protein2 = hasP2 ? mealProteinP2(meal) : 0;

  const pct = budget > 0 ? Math.round((kcal / budget) * 100) : 0;
  const pct2 = hasP2 && budgetP2 ? Math.round((kcal2 / budgetP2) * 100) : 0;

  return (
    <article
      className={`panel p-4 flex flex-col gap-3 transition-opacity ${
        meal.done ? 'opacity-70' : 'opacity-100'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-lg font-bold text-slate-900">{SLOT_LABEL[meal.slot]}</h3>
        {!meal.done && meal.items.length > 0 && (
          <button
            onClick={onRerollMeal}
            className="rounded-md px-2.5 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          >
            Regenerar
          </button>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-600">
          {hasP2 ? 'Comparativa por persona' : 'Resumen de persona'}
        </p>
        <div className={`mt-2 grid gap-2 ${hasP2 ? 'sm:grid-cols-2' : 'grid-cols-1'}`}>
          <PersonSummary
            name={person1Name}
            color="blue"
            kcal={kcal}
            budget={budget}
            protein={protein}
            pct={pct}
          />
          {hasP2 && (
            <PersonSummary
              name={person2Name ?? 'P2'}
              color="rose"
              kcal={kcal2}
              budget={budgetP2 ?? 0}
              protein={protein2}
              pct={pct2}
            />
          )}
        </div>
      </div>

      {meal.items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 py-5 text-center text-sm text-slate-500">
          Sin sugerencias todavía. Pulsa <strong>Regenerar</strong> para proponer ingredientes.
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {meal.items.map((it, idx) => {
            const food = FOODS_BY_ID[it.foodId];
            const grams = Math.round(food.baseGrams * it.multiplier);
            const k = Math.round(food.kcal * it.multiplier);
            const p = Math.round(food.protein * it.multiplier);
            const units = food.unit ? Math.max(1, Math.round(it.multiplier)) : null;
            const unitLabel = food.unit
              ? units === 1
                ? food.unit.singular
                : food.unit.plural
              : null;

            const mult2 = it.multiplierP2 ?? 0;
            const grams2 = Math.round(itemGramsP2(it));
            const k2 = Math.round(food.kcal * mult2);
            const p2 = Math.round(food.protein * mult2);
            const units2 = food.unit && mult2 > 0 ? Math.max(1, Math.round(mult2)) : null;
            const unitLabel2 = food.unit
              ? units2 === 1
                ? food.unit.singular
                : food.unit.plural
              : null;

            return (
              <li key={idx} className="rounded-xl border border-slate-200 bg-white p-3">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-900">{food.name}</div>

                    {!meal.done && (
                      <button
                        onClick={() => onRerollItem(idx)}
                        aria-label={`Cambiar ${food.name}`}
                        className="rounded-md border border-slate-300 px-2 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        Cambiar
                      </button>
                    )}
                  </div>

                  <div className="mt-1 flex w-full flex-col gap-1.5 text-xs">
                    <PersonLine
                      label={person1Name}
                      color="blue"
                      grams={grams}
                      kcal={k}
                      protein={p}
                      units={units}
                      unitLabel={unitLabel}
                    />
                    {hasP2 && (
                      <PersonLine
                        label={person2Name ?? 'P2'}
                        color="rose"
                        grams={grams2}
                        kcal={k2}
                        protein={p2}
                        units={units2}
                        unitLabel={unitLabel2}
                      />
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-2">
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={meal.done}
            onChange={onToggleDone}
            className="h-4 w-4 accent-slate-900"
          />
          Marcar como hecha
        </label>

        {canToggleDayMeat && (
          <label className="flex items-center gap-2 text-xs text-slate-600">
            <input
              type="checkbox"
              checked={meal.useDayMeat}
              onChange={onToggleDayMeat}
              disabled={meal.done}
              className="h-3.5 w-3.5 accent-slate-900"
            />
            Usar proteína del día
          </label>
        )}
      </div>
    </article>
  );
}

function PersonSummary({
  name,
  color,
  kcal,
  budget,
  protein,
  pct,
}: {
  name: string;
  color: 'blue' | 'rose';
  kcal: number;
  budget: number;
  protein: number;
  pct: number;
}) {
  const tone = color === 'blue' ? 'border-blue-200 bg-blue-50/70' : 'border-rose-200 bg-rose-50/70';
  const titleTone = color === 'blue' ? 'text-blue-800' : 'text-rose-800';

  const pctTone =
    pct >= 95 && pct <= 105
      ? 'text-emerald-700'
      : pct >= 90 && pct <= 110
        ? 'text-amber-700'
        : 'text-rose-700';

  return (
    <div className={`rounded-lg border px-2.5 py-2 ${tone}`}>
      <div className={`text-sm font-bold ${titleTone}`}>{name}</div>
      <div className="text-xs text-slate-700">
        {Math.round(kcal)} / {budget} kcal ·{' '}
        <span className={`font-semibold ${pctTone}`}>{pct}%</span>
      </div>
      <div className="text-xs text-slate-600">{Math.round(protein)} g proteína</div>
    </div>
  );
}

function PersonLine({
  label,
  color,
  grams,
  kcal,
  protein,
  units,
  unitLabel,
}: {
  label: string;
  color: 'blue' | 'rose';
  grams: number;
  kcal: number;
  protein: number;
  units: number | null;
  unitLabel: string | null;
}) {
  const tone = color === 'blue' ? 'text-blue-800 border-blue-100 bg-blue-50/60' : 'text-rose-800 border-rose-100 bg-rose-50/60';

  const amount =
    units !== null && unitLabel
      ? `${units} ${unitLabel} (${grams} g)`
      : `${grams} g`;

  return (
    <div className={`w-full rounded-md border px-2 py-1 ${tone}`}>
      <span className="font-semibold">{label}:</span> {amount} · {kcal} kcal · {protein} g prot
    </div>
  );
}

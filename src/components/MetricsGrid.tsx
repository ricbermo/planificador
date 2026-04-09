import type { ActivityLevel, BodyMetrics } from '../lib/types';
import { ACTIVITY_LABEL, suggestGoals } from '../lib/nutrition';
import { Field } from './Field';

const ACTIVITY_KEYS: ActivityLevel[] = [
  'sedentario',
  'ligero',
  'moderado',
  'activo',
  'muy_activo',
];

export function MetricsGrid({
  idPrefix,
  metrics,
  onChange,
}: {
  idPrefix: string;
  metrics: BodyMetrics;
  onChange: (patch: Partial<BodyMetrics>) => void;
}) {
  const numHandler =
    (key: keyof BodyMetrics) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const v = Number(e.target.value);
      onChange({ [key]: Number.isFinite(v) ? v : 0 } as Partial<BodyMetrics>);
    };

  const canSuggest =
    metrics.heightCm > 0 && metrics.currentWeightKg > 0;
  const handleSuggest = () => {
    const s = suggestGoals({
      age: metrics.age,
      heightCm: metrics.heightCm,
      currentWeightKg: metrics.currentWeightKg,
      bodyFatPct: metrics.bodyFatPct,
    });
    if (s) {
      onChange({
        targetWeightKg: s.targetWeightKg,
        targetBodyFatPct: s.targetBodyFatPct,
        weeksToGoal: s.weeksToGoal,
      });
    }
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
      <Field label="Edad" htmlFor={`${idPrefix}-age`}>
        <input
          id={`${idPrefix}-age`}
          type="number"
          min={1}
          value={metrics.age || ''}
          onChange={numHandler('age')}
          className="input-base w-full"
          placeholder="30"
        />
      </Field>
      <Field label="Estatura (cm)" htmlFor={`${idPrefix}-height`}>
        <input
          id={`${idPrefix}-height`}
          type="number"
          min={1}
          value={metrics.heightCm || ''}
          onChange={numHandler('heightCm')}
          className="input-base w-full"
          placeholder="170"
        />
      </Field>
      <Field label="Peso (kg)" htmlFor={`${idPrefix}-current-weight`}>
        <input
          id={`${idPrefix}-current-weight`}
          type="number"
          step={0.1}
          min={1}
          value={metrics.currentWeightKg || ''}
          onChange={numHandler('currentWeightKg')}
          className="input-base w-full"
          placeholder="75"
        />
      </Field>
      <Field label="Peso meta (kg)" htmlFor={`${idPrefix}-target-weight`}>
        <div className="flex items-center gap-1.5">
          <input
            id={`${idPrefix}-target-weight`}
            type="number"
            step={0.1}
            min={1}
            value={metrics.targetWeightKg || ''}
            onChange={numHandler('targetWeightKg')}
            className="input-base w-full"
            placeholder="72"
          />
          <button
            type="button"
            onClick={handleSuggest}
            disabled={!canSuggest}
            title="Sugerir peso, % grasa y semanas meta con ritmo seguro"
            className="rounded-md border border-slate-300 bg-white px-2 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Sugerir
          </button>
        </div>
      </Field>
      <Field label="% grasa" htmlFor={`${idPrefix}-bf`}>
        <input
          id={`${idPrefix}-bf`}
          type="number"
          step={0.1}
          min={3}
          max={70}
          value={metrics.bodyFatPct || ''}
          onChange={numHandler('bodyFatPct')}
          className="input-base w-full"
          placeholder="20"
        />
      </Field>
      <Field label="% grasa meta" htmlFor={`${idPrefix}-bf-target`}>
        <input
          id={`${idPrefix}-bf-target`}
          type="number"
          step={0.1}
          min={3}
          max={70}
          value={metrics.targetBodyFatPct || ''}
          onChange={numHandler('targetBodyFatPct')}
          className="input-base w-full"
          placeholder="15"
        />
      </Field>
      <Field label="Semanas" htmlFor={`${idPrefix}-weeks`}>
        <input
          id={`${idPrefix}-weeks`}
          type="number"
          min={1}
          value={metrics.weeksToGoal || ''}
          onChange={numHandler('weeksToGoal')}
          className="input-base w-full"
          placeholder="12"
        />
      </Field>
      <div className="col-span-2">
        <Field label="Nivel de actividad" htmlFor={`${idPrefix}-activity`}>
          <select
            id={`${idPrefix}-activity`}
            value={metrics.activity}
            onChange={(e) =>
              onChange({ activity: e.target.value as ActivityLevel })
            }
            className="input-base w-full"
          >
            {ACTIVITY_KEYS.map((k) => (
              <option key={k} value={k}>
                {ACTIVITY_LABEL[k]}
              </option>
            ))}
          </select>
        </Field>
      </div>
    </div>
  );
}

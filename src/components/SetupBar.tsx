import type { ActivityLevel, BodyMetrics, DayMeat } from '../lib/types';
import { ACTIVITY_LABEL, suggestGoals } from '../lib/nutrition';

interface Props {
  targetKcal: number;
  dayMeat: DayMeat;
  person1Name: string;
  person1Metrics: BodyMetrics;
  person1ManualOverride: boolean;
  p2Enabled: boolean;
  p2Name: string;
  p2TargetKcal: number;
  p2Metrics: BodyMetrics;
  p2ManualOverride: boolean;
  onTargetChange: (n: number) => void;
  onMeatChange: (m: DayMeat) => void;
  onPerson1NameChange: (s: string) => void;
  onPerson1MetricsChange: (patch: Partial<BodyMetrics>) => void;
  onPerson1ResetAuto: () => void;
  onTogglePerson2: () => void;
  onP2NameChange: (s: string) => void;
  onP2TargetChange: (n: number) => void;
  onP2MetricsChange: (patch: Partial<BodyMetrics>) => void;
  onP2ResetAuto: () => void;
  onGenerate: () => void;
}

const MEAT_LABEL: Record<DayMeat, string> = {
  chicken: 'Pollo',
  beef: 'Res',
  pork: 'Cerdo',
};

const ACTIVITY_KEYS: ActivityLevel[] = [
  'sedentario',
  'ligero',
  'moderado',
  'activo',
  'muy_activo',
];

export function SetupBar({
  targetKcal,
  dayMeat,
  person1Name,
  person1Metrics,
  person1ManualOverride,
  p2Enabled,
  p2Name,
  p2TargetKcal,
  p2Metrics,
  p2ManualOverride,
  onTargetChange,
  onMeatChange,
  onPerson1NameChange,
  onPerson1MetricsChange,
  onPerson1ResetAuto,
  onTogglePerson2,
  onP2NameChange,
  onP2TargetChange,
  onP2MetricsChange,
  onP2ResetAuto,
  onGenerate,
}: Props) {
  const p2Tone = p2Enabled
    ? 'border-rose-200 bg-rose-50/60'
    : 'border-slate-200 bg-slate-50/70';

  return (
    <section className="panel p-4 sm:p-5 flex flex-col gap-4" aria-label="Configuración del día">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Configuración del día</h2>
          <p className="text-sm text-slate-600">
            Ingresa tus métricas y la app calculará automáticamente kcal y macros.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <fieldset className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-blue-800">
            Persona 1
          </legend>

          <div className="flex flex-col gap-3">
            <Field label="Nombre" htmlFor="person1-name">
              <input
                id="person1-name"
                type="text"
                value={person1Name}
                onChange={(e) => onPerson1NameChange(e.target.value)}
                className="input-base w-full"
                placeholder="Yo"
              />
            </Field>

            <MetricsGrid
              idPrefix="person1"
              metrics={person1Metrics}
              onChange={onPerson1MetricsChange}
            />

            <KcalRow
              idPrefix="person1"
              targetKcal={targetKcal}
              manualOverride={person1ManualOverride}
              onTargetChange={onTargetChange}
              onResetAuto={onPerson1ResetAuto}
            />
          </div>
        </fieldset>

        <fieldset className={`rounded-xl border p-3 transition-colors ${p2Tone}`}>
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-700">
            Persona 2 (opcional)
          </legend>

          <div className="flex flex-col gap-3">
            {!p2Enabled && (
              <div className="flex flex-col items-center justify-center gap-3 py-6">
                <p className="text-sm text-slate-700 text-center">
                  Activa esta opción si compartes comidas con otra persona.
                </p>
                <button
                  onClick={onTogglePerson2}
                  className="rounded-lg border border-slate-300 bg-white px-5 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                >
                  Agregar
                </button>
              </div>
            )}

            {p2Enabled && (
              <>
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm text-slate-700">
                    Comparación activa para ambos perfiles.
                  </p>
                  <button
                    onClick={onTogglePerson2}
                    className="rounded-lg border border-rose-300 bg-rose-100 px-3 py-2 text-sm font-semibold text-rose-800 transition hover:bg-rose-200"
                  >
                    Quitar
                  </button>
                </div>

                <Field label="Nombre" htmlFor="person2-name">
                  <input
                    id="person2-name"
                    type="text"
                    value={p2Name}
                    onChange={(e) => onP2NameChange(e.target.value)}
                    className="input-base w-full"
                    placeholder="Persona 2"
                  />
                </Field>

                <MetricsGrid
                  idPrefix="person2"
                  metrics={p2Metrics}
                  onChange={onP2MetricsChange}
                />

                <KcalRow
                  idPrefix="person2"
                  targetKcal={p2TargetKcal}
                  manualOverride={p2ManualOverride}
                  onTargetChange={onP2TargetChange}
                  onResetAuto={onP2ResetAuto}
                />
              </>
            )}
          </div>
        </fieldset>
      </div>

      <div className="flex flex-wrap items-end gap-3 border-t border-slate-200/70 pt-3">
        <Field label="Proteína del día" htmlFor="day-meat">
          <select
            id="day-meat"
            value={dayMeat}
            onChange={(e) => onMeatChange(e.target.value as DayMeat)}
            className="input-base min-w-36"
          >
            {(Object.keys(MEAT_LABEL) as DayMeat[]).map((m) => (
              <option key={m} value={m}>
                {MEAT_LABEL[m]}
              </option>
            ))}
          </select>
        </Field>

        <button
          onClick={onGenerate}
          className="ml-auto rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold px-5 py-2.5 shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Generar día
        </button>
      </div>
    </section>
  );
}

function MetricsGrid({
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
            title="Sugerir peso y % grasa meta a partir de tus métricas"
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

function KcalRow({
  idPrefix,
  targetKcal,
  manualOverride,
  onTargetChange,
  onResetAuto,
}: {
  idPrefix: string;
  targetKcal: number;
  manualOverride: boolean;
  onTargetChange: (n: number) => void;
  onResetAuto: () => void;
}) {
  return (
    <div className="flex items-end gap-2">
      <Field label="Kcal objetivo" htmlFor={`${idPrefix}-target-kcal`}>
        <input
          id={`${idPrefix}-target-kcal`}
          type="number"
          value={targetKcal || ''}
          onChange={(e) => onTargetChange(Number(e.target.value) || 0)}
          className="input-base w-full font-semibold"
          placeholder="2200"
        />
      </Field>
      {manualOverride && (
        <button
          type="button"
          onClick={onResetAuto}
          className="rounded-lg border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
          title="Volver al valor calculado automáticamente"
        >
          Auto
        </button>
      )}
    </div>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <label htmlFor={htmlFor} className="text-xs font-semibold uppercase tracking-wide text-slate-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

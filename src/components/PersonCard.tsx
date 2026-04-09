import type { MacroSummary } from '../lib/types';
import { Metric } from './Metric';

export interface PersonRow {
  name: string;
  color: 'blue' | 'rose';
  targetKcal: number;
  remainingKcal: number;
  totalPlanned: number;
  totalProtein: number;
  macros?: MacroSummary;
  onRemainingChange: (n: number) => void;
}

type StatusTone = 'on-track' | 'near' | 'off';

function getTone(pct: number): StatusTone {
  if (pct >= 95 && pct <= 105) return 'on-track';
  if (pct >= 90 && pct <= 110) return 'near';
  return 'off';
}

function toneLabel(tone: StatusTone): string {
  if (tone === 'on-track') return 'En rango';
  if (tone === 'near') return 'Cerca';
  return 'Ajustar';
}

export function PersonCard({ row }: { row: PersonRow }) {
  const safeName = row.name.toLowerCase().replace(/\s+/g, '-');
  const pct = row.targetKcal > 0 ? Math.round((row.totalPlanned / row.targetKcal) * 100) : 0;
  const tone = getTone(pct);
  const chipTone =
    tone === 'on-track'
      ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
      : tone === 'near'
        ? 'bg-amber-100 text-amber-800 border-amber-200'
        : 'bg-rose-100 text-rose-800 border-rose-200';
  const accent = row.color === 'blue' ? 'from-blue-100 to-blue-50 border-blue-200' : 'from-rose-100 to-rose-50 border-rose-200';
  const progressTone =
    tone === 'on-track' ? 'bg-emerald-500' : tone === 'near' ? 'bg-amber-500' : 'bg-rose-500';

  return (
    <article className={`rounded-xl border bg-gradient-to-b p-4 ${accent}`}>
      <div className="flex items-center justify-between gap-2">
        <h3 className="text-base font-bold text-slate-900">{row.name}</h3>
        <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${chipTone}`}>
          Estado: {toneLabel(tone)}
        </span>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
        <Metric label="Objetivo" value={`${row.targetKcal} kcal`} />
        <Metric label="Planeado" value={`${Math.round(row.totalPlanned)} kcal`} />
        <Metric label="Proteína" value={`${Math.round(row.totalProtein)} g`} />
        <Metric label="Restantes" value={`${row.remainingKcal} kcal`} />
        {row.macros && (
          <>
            <Metric label="Carbs meta" value={`${row.macros.carbs_g} g`} />
            <Metric label="Grasa meta" value={`${row.macros.fat_g} g`} />
          </>
        )}
      </div>

      {row.macros && (
        <div className="mt-3 rounded-lg border border-white/80 bg-white/60 p-2.5 text-xs text-slate-700">
          <div className="grid grid-cols-3 gap-2">
            <span><strong className="text-slate-900">BMR:</strong> {row.macros.bmr}</span>
            <span><strong className="text-slate-900">TDEE:</strong> {row.macros.tdee}</span>
            <span>
              <strong className="text-slate-900">Δ/sem:</strong>{' '}
              {row.macros.weeklyWeightChangeKg >= 0 ? '+' : ''}
              {row.macros.weeklyWeightChangeKg.toFixed(2)} kg
            </span>
          </div>
          {row.macros.warning && (
            <p className="mt-1.5 font-semibold text-amber-700">
              ⚠ {row.macros.warning}
            </p>
          )}
        </div>
      )}

      <div className="mt-3 flex flex-col gap-1.5">
        <div className="flex items-center justify-between text-xs text-slate-600">
          <span>Progreso</span>
          <span className="font-semibold">{pct}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-slate-200" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={140} aria-label={`Progreso de ${row.name}`}>
          <div
            className={`h-full rounded-full ${progressTone}`}
            style={{ width: `${Math.max(0, Math.min(pct, 140)) / 1.4}%` }}
          />
        </div>
      </div>

      <div className="mt-3 flex flex-col gap-1.5">
        <label
          htmlFor={`remaining-kcal-${safeName}`}
          className="text-xs font-semibold uppercase tracking-wide text-slate-600"
        >
          Kcal restantes
        </label>
        <input
          id={`remaining-kcal-${safeName}`}
          type="number"
          value={row.remainingKcal || ''}
          onChange={(e) => row.onRemainingChange(Number(e.target.value) || 0)}
          className="input-base w-32"
        />
      </div>
    </article>
  );
}

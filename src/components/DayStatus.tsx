import { PersonCard, type PersonRow } from './PersonCard';

interface Props {
  rows: PersonRow[];
  onRecalc: () => void;
}

export function DayStatus({ rows, onRecalc }: Props) {
  const leader = rows
    .slice()
    .sort((a, b) => Math.abs(a.remainingKcal) - Math.abs(b.remainingKcal))[0];

  return (
    <section className="panel p-4 sm:p-5 flex flex-col gap-4" aria-label="Scoreboard diario">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Scoreboard diario</h2>
          <p className="text-sm text-slate-600">
            Estado actual por persona para ajustar porciones antes de cerrar el día.
          </p>
        </div>
        {rows.length > 1 && leader && (
          <span className="rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-800">
            Más cerca del objetivo: {leader.name}
          </span>
        )}
      </div>

      <div className="grid gap-3 lg:grid-cols-2">
        {rows.map((row) => (
          <PersonCard key={row.name} row={row} />
        ))}
      </div>

      <div className="flex justify-end">
        <button
          onClick={onRecalc}
          className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-800 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
        >
          Recalcular
        </button>
      </div>
    </section>
  );
}

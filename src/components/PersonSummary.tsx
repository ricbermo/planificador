interface Props {
  name: string;
  color: 'blue' | 'rose';
  kcal: number;
  budget: number;
  protein: number;
  carbs: number;
  pct: number;
}

export function PersonSummary({ name, color, kcal, budget, protein, carbs, pct }: Props) {
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
      <div className="text-xs text-slate-600">
        {Math.round(protein)} g prot · {Math.round(carbs)} g carbs
      </div>
    </div>
  );
}

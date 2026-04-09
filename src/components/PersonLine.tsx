interface Props {
  label: string;
  color: 'blue' | 'rose';
  grams: number;
  kcal: number;
  protein: number;
  carbs: number;
  units: number | null;
  unitLabel: string | null;
}

export function PersonLine({ label, color, grams, kcal, protein, carbs, units, unitLabel }: Props) {
  const tone = color === 'blue' ? 'text-blue-800 border-blue-100 bg-blue-50/60' : 'text-rose-800 border-rose-100 bg-rose-50/60';

  const amount =
    units !== null && unitLabel
      ? `${units} ${unitLabel} (${grams} g)`
      : `${grams} g`;

  return (
    <div className={`w-full rounded-md border px-2 py-1 ${tone}`}>
      <span className="font-semibold">{label}:</span> {amount} · {kcal} kcal · {protein} g prot · {carbs} g carbs
    </div>
  );
}

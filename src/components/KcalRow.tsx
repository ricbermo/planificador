import { Field } from './Field';

export function KcalRow({
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

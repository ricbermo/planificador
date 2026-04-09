export function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/80 bg-white/75 px-2.5 py-2">
      <span className="block text-[11px] font-semibold uppercase tracking-wide text-slate-600">{label}</span>
      <span className="block text-sm font-bold text-slate-900">{value}</span>
    </div>
  );
}

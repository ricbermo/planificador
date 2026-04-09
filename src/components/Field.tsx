export function Field({
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

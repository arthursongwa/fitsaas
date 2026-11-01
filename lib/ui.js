export const btn = "inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-glow-success transition hover:brightness-110";
export const btn2 = "inline-flex items-center justify-center gap-2 rounded-lg border border-border px-4 py-2 text-sm hover:bg-accent";
export const btnWarn = "inline-flex items-center justify-center gap-2 rounded-lg border border-streak/50 px-4 py-2 text-sm text-streak hover:bg-streak/10";

export function Bar({ value, tone = "success" }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={`h-full rounded-full transition-all duration-700 ${tone === "success" ? "bg-gradient-success" : "bg-gradient-streak"}`} style={{ width: `${Math.max(0, Math.min(100, value || 0))}%` }} />
    </div>
  );
}
export function Stat({ label, value, note, good = true }) {
  return (
    <div className="panel p-5">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      {note && <p className={`mt-1 text-xs font-medium ${good ? "text-success" : "text-streak"}`}>{note}</p>}
    </div>
  );
}
export function Field({ label, hint, children }) {
  return (
    <label className="block space-y-1 text-sm">
      <span className="text-muted-foreground">{label}</span>
      {children}
      {hint && <span className="block text-xs text-muted-foreground">{hint}</span>}
    </label>
  );
}
export function Choice({ value, onChange, options, cols = 3 }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}>
      {options.map(([k, l]) => (
        <button type="button" key={k} onClick={() => onChange(k)} className={`rounded-lg border p-2 text-xs ${String(value) === String(k) ? "border-success bg-success/10 text-success" : "border-border hover:bg-accent"}`}>{l}</button>
      ))}
    </div>
  );
}
export const Err = ({ children }) => (children ? <p className="rounded-lg border border-streak/40 bg-streak/10 p-3 text-sm text-streak">{children}</p> : null);
export const Ok = ({ children }) => (children ? <p className="text-sm text-success">{children}</p> : null);
export function download(content, name, type) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([content], { type }));
  a.download = name; a.click(); URL.revokeObjectURL(a.href);
}
export const Empty = ({ children }) => <div className="panel p-6 text-sm text-muted-foreground">{children}</div>;

type KpiCardProps = {
  label: string;
  value: string;
  note?: string;
  tone?: "neutral" | "good" | "warning" | "danger";
  loading?: boolean;
};

const toneClass = {
  neutral: "border-line from-surface to-info/10",
  good: "border-success/25 from-surface to-success/15",
  warning: "border-warning/35 from-surface to-warning/20",
  danger: "border-danger/30 from-surface to-danger/15"
};

const markerClass = {
  neutral: "bg-info",
  good: "bg-success",
  warning: "bg-warning",
  danger: "bg-danger"
};

export function KpiCard({ label, value, note, tone = "neutral", loading = false }: KpiCardProps) {
  if (loading) {
    return (
      <section aria-busy="true" aria-label={`Carregando ${label}`} className="app-card p-4">
        <span aria-hidden className="skeleton-shimmer block h-3 w-24 rounded" />
        <span aria-hidden className="skeleton-shimmer mt-3 block h-7 w-32 rounded" />
        <span className="sr-only">Carregando {label}</span>
      </section>
    );
  }

  return (
    <section 
      className={`interactive-card animate-rise-in relative overflow-hidden rounded-app border bg-gradient-to-br p-4 shadow-soft select-none ${toneClass[tone]}`}
      role="status"
      aria-label={`${label}: ${value}${note ? ` (${note})` : ""}`}
    >
      <span className={`absolute right-4 top-4 h-2.5 w-2.5 rounded-full shadow-sm ${markerClass[tone]}`} />
      <span className="text-xs font-bold uppercase tracking-normal text-muted">{label}</span>
      <strong className="metric-number animate-text-reveal mt-2 block text-2xl leading-tight">{value}</strong>
      {note ? <p className="mt-1 text-sm text-muted">{note}</p> : null}
    </section>
  );
}

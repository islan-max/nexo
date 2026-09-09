/**
 * Placeholder dos gráficos carregados sob demanda.
 *
 * Ocupa exatamente a altura do gráfico final: sem isso, o chunk do recharts
 * chegando depois empurraria o conteúdo abaixo e geraria layout shift.
 */
export function ChartSkeleton({ height, label }: { height: number; label: string }) {
  return (
    <div
      aria-label={label}
      className="flex h-full w-full items-end justify-center gap-2 px-4 pb-6"
      role="img"
      style={{ height }}
    >
      {[0.45, 0.7, 0.35, 0.85, 0.55, 0.65].map((ratio, index) => (
        <div
          className="skeleton-shimmer w-full rounded-t"
          key={index}
          style={{ height: `${ratio * 100}%`, animationDelay: `${index * 90}ms` }}
        />
      ))}
      <span className="sr-only">{label}</span>
    </div>
  );
}

import { AlertTriangle, CheckCircle2, TrendingDown } from "@/components/icons";
import { formatBRL } from "@/lib/format";
import type { Alert, Dashboard } from "@/types/finance";

const statusCopy = {
  green: "Seu ritmo hoje está dentro da meta.",
  yellow: "Seu ritmo pede atenção hoje.",
  red: "Seu ritmo está acima do planejado."
};

const statusClass = {
  green: "border-success bg-success/10 text-success",
  yellow: "border-warning bg-warning/10 text-ink",
  red: "border-danger bg-danger/10 text-danger"
};

type MainInsightCardProps = {
  userName?: string;
  dashboard?: Dashboard | null;
  alert?: Alert;
  /** Enquanto true, mostra esqueleto em vez de zeros — R$ 0,00 durante o
      carregamento é indistinguível de uma conta realmente vazia. */
  loading?: boolean;
};

type MiniMetricProps = {
  label: string;
  value: string;
};

function MiniMetric({ label, value }: MiniMetricProps) {
  return (
    <div className="interactive-list-item rounded-app bg-white/[0.14] p-3 backdrop-blur">
      <span className="text-xs font-semibold text-white/85">{label}</span>
      <strong className="animate-text-reveal mt-1 block text-lg font-bold text-white">{value}</strong>
    </div>
  );
}

/** Barra clara sobre o fundo escuro do hero. */
function HeroBar({ className }: { className: string }) {
  return <span aria-hidden className={`block animate-pulse rounded bg-white/25 ${className}`} />;
}

export function MainInsightCard({ userName, dashboard, alert, loading = false }: MainInsightCardProps) {
  const status = dashboard?.rhythmStatus || "green";
  const Icon = status === "green" ? CheckCircle2 : status === "yellow" ? AlertTriangle : TrendingDown;

  if (loading) {
    return (
      <section
        aria-busy="true"
        aria-label="Carregando o resumo do mês"
        className="hero-card animate-rise-in relative overflow-hidden rounded-app border border-white/15 p-5 shadow-lift"
      >
        <HeroBar className="h-4 w-32" />
        <HeroBar className="mt-3 h-6 w-64 max-w-full" />
        <div className="mt-8">
          <HeroBar className="h-4 w-40" />
          <HeroBar className="mt-3 h-12 w-56 max-w-full" />
          <HeroBar className="mt-3 h-4 w-72 max-w-full" />
        </div>
        <HeroBar className="mt-5 h-14 w-full" />
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {[0, 1, 2, 3].map((index) => (
            <HeroBar className="h-16 w-full" key={index} />
          ))}
        </div>
        <span className="sr-only">Carregando o resumo do mês</span>
      </section>
    );
  }

  return (
    <section className="hero-card animate-rise-in relative overflow-hidden rounded-app border border-white/15 p-5 shadow-lift">
      <div className="pointer-events-none absolute -right-12 -top-16 h-44 w-44 rounded-full bg-leaf/20 blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-24 w-44 rounded-tl-full border-l border-t border-white/10" />
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white/85">Olá{userName ? `, ${userName}` : ""}.</p>
          <h1 className="animate-text-reveal mt-1 text-2xl font-bold leading-tight">{dashboard ? statusCopy[status] : "Seu resumo está carregando."}</h1>
        </div>
        <span className={`relative flex h-11 w-11 shrink-0 items-center justify-center rounded-app border ${statusClass[status]}`}>
          <Icon size={22} />
        </span>
      </div>
      <div className="mt-6">
        <span className="text-sm font-semibold text-white/85">Você pode gastar hoje</span>
        <strong className="animate-text-reveal mt-2 block text-4xl font-black leading-tight tracking-normal sm:text-5xl">{formatBRL(dashboard?.availableToday || 0)}</strong>
        <p className="mt-2 text-sm text-white/85">
          Saldo restante: {formatBRL(dashboard?.projectedBalance || 0)} considerando salário, entradas e despesas do mês.
        </p>
      </div>
      <div className="relative mt-4 rounded-app border border-white/20 bg-white/[0.14] p-3 text-sm text-white/90 backdrop-blur">
        {alert?.message || "Cadastre suas entradas e despesas para o app apontar o próximo melhor ajuste."}
      </div>
      <div className="relative mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        <MiniMetric label="Salário" value={formatBRL(dashboard?.salaryBase || 0)} />
        <MiniMetric label="Entradas" value={formatBRL(dashboard?.inflow || 0)} />
        <MiniMetric label="Saídas" value={formatBRL(dashboard?.outflow || 0)} />
        <MiniMetric label="Saldo Restante" value={formatBRL(dashboard?.projectedBalance || 0)} />
      </div>
    </section>
  );
}

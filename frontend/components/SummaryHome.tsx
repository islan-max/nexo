"use client";

import Link from "next/link";
import { useState } from "react";
import { BarChart3, FileUp, Layers3, PieChart as PieIcon, ReceiptText, Wallet } from "@/components/icons";
import dynamic from "next/dynamic";
import { ChartSkeleton } from "@/components/charts/ChartSkeleton";
import { colorForPaymentMethod, getChartTheme, CATEGORICAL_COLORS } from "@/components/charts/chartTheme";
import { ActionRecommendationCard } from "@/components/ActionRecommendationCard";
import { EmptyState } from "@/components/EmptyState";
import { KpiCard } from "@/components/KpiCard";
import { MainInsightCard } from "@/components/MainInsightCard";
import { QuickSettingsCard } from "@/components/QuickSettingsCard";
import { SectionIntro } from "@/components/SectionIntro";
import { TransactionList } from "@/components/TransactionList";
import { formatBRL } from "@/lib/format";
import { useTheme } from "@/lib/theme";
import type { Bootstrap } from "@/types/finance";

// O recharts responde por ~140 kB do bundle. Como o dashboard e a primeira tela
// depois do login, ele sai do carregamento inicial e chega junto com os dados.
// ssr:false porque a biblioteca mede o container para dimensionar o desenho.
const CategoryPieChart = dynamic(() => import("@/components/charts/CategoryPieChart"), {
  ssr: false,
  loading: () => <ChartSkeleton height={256} label="Carregando gráfico de categorias" />
});

const PaymentBarChart = dynamic(() => import("@/components/charts/PaymentBarChart"), {
  ssr: false,
  loading: () => <ChartSkeleton height={224} label="Carregando gráfico de formas de pagamento" />
});

type SummaryHomeProps = {
  data: Bootstrap | null;
  chartsReady: boolean;
  onEditPlanning: () => void;
};

/** Sem dados carregados ainda: os cards mostram esqueleto, não zeros. */

const statusTone = {
  green: "good",
  yellow: "warning",
  red: "danger"
} as const;

export function SummaryHome({ data, chartsReady, onEditPlanning }: SummaryHomeProps) {
  const { effectiveTheme } = useTheme();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<string | null>(null);
  const dashboard = data?.dashboard;
  const loading = !data;
  const tone = dashboard ? statusTone[dashboard.rhythmStatus] : "neutral";
  const pieData = (dashboard?.categoryBreakdown || []).map((item, index) => ({
    name: item.name || "Sem categoria",
    total: Number(item.total || 0),
    color: item.color || CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length]
  }));
  
  const paymentData = (dashboard?.paymentMethodBreakdown || []).map((item, index) => ({
    payment_method: item.payment_method || "Outro",
    total: Number(item.total || 0),
    color: colorForPaymentMethod(item.payment_method || "", index)
  }));
  
  const hasBudget = Boolean(data?.budget.items.length);
  const chartTheme = getChartTheme(effectiveTheme === "dark");

  return (
    <div className="grid gap-4">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <MainInsightCard alert={data?.alerts[0]} dashboard={dashboard} loading={loading} userName={data?.user.name} />
        <div className="grid gap-4">
          <QuickSettingsCard settings={data?.settings || null} onEdit={onEditPlanning} />
          <ActionRecommendationCard dashboard={dashboard} alerts={data?.alerts || []} hasBudget={hasBudget} transactions={data?.transactions || []} />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard loading={loading} label="Salário do mês" value={formatBRL(dashboard?.salaryBase || 0)} note={`${dashboard?.salaryCommittedPercent || 0}% comprometido`} />
        <KpiCard loading={loading} label="Entradas" value={formatBRL(dashboard?.inflow || 0)} tone="good" />
        <KpiCard loading={loading} label="Saídas" value={formatBRL(dashboard?.outflow || 0)} tone={dashboard && dashboard.outflow > dashboard.salaryBase ? "danger" : "neutral"} />
        <KpiCard loading={loading} label="Score Trevo" value={String(data?.score.score || "--")} note={data?.score.label} tone={tone} />
      </div>

      <section className="app-card p-4">
        <SectionIntro
          title="Categorias do mês"
          description="Veja quais áreas mais consumiram seu dinheiro neste mês. Isso ajuda a identificar onde você pode economizar."
          helpText="Cada fatia representa uma categoria de despesa. Quanto maior a fatia, maior o impacto no seu salário."
        />
        {pieData.length ? (
          <div className="grid gap-4 lg:grid-cols-[260px_1fr]">
            <div className="h-64">
              {chartsReady ? (
                <CategoryPieChart
                  activeCategory={activeCategory}
                  data={pieData}
                  onActiveChange={setActiveCategory}
                  theme={chartTheme}
                />
              ) : (
                <ChartSkeleton height={256} label="Carregando gráfico de categorias" />
              )}
            </div>
            <div className="space-y-2">
              {pieData.slice(0, 6).map((item) => (
                <div
                  key={item.name}
                  className={`interactive-list-item flex items-center justify-between gap-3 rounded-app border p-3 text-sm shadow-sm ${activeCategory === item.name ? "border-leaf/60 bg-leaf/10" : "border-line bg-surface/75"}`}
                  onMouseEnter={() => setActiveCategory(item.name)}
                  onMouseLeave={() => setActiveCategory(null)}
                >
                  <span className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                    {item.name}
                  </span>
                  <strong>{formatBRL(item.total)}</strong>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState
            title="Nenhuma categoria com gasto ainda"
            description="Cadastre suas despesas do mês para descobrir para onde seu dinheiro está indo."
            actionLabel="Cadastrar despesa"
            href="/transacoes"
            icon={PieIcon}
          />
        )}
      </section>

      <section className="grid gap-4 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="app-card p-4">
          <SectionIntro
            title="Formas de pagamento"
            description="Entenda se seus gastos estão concentrados em Pix, débito, crédito ou dinheiro."
            helpText="Use esse gráfico para perceber se alguma forma de pagamento está pesando demais no mês."
          />
          {paymentData.length ? (
            <div className="space-y-4">
              <div className="h-56">
                {chartsReady ? (
                  <PaymentBarChart
                    activePayment={activePayment}
                    data={paymentData}
                    onActiveChange={setActivePayment}
                    theme={chartTheme}
                  />
                ) : (
                  <ChartSkeleton height={224} label="Carregando gráfico de formas de pagamento" />
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {paymentData.map((item) => (
                  <div
                    key={item.payment_method}
                    className={`interactive-list-item flex items-center justify-between rounded-app border p-3 text-sm shadow-sm ${activePayment === item.payment_method ? "border-leaf/60 bg-leaf/10" : "border-line bg-surface/75"}`}
                    onMouseEnter={() => setActivePayment(item.payment_method)}
                    onMouseLeave={() => setActivePayment(null)}
                  >
                    <span className="flex items-center gap-2">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      {item.payment_method}
                    </span>
                    <strong>{formatBRL(item.total)}</strong>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <EmptyState
              title="Sem formas de pagamento ainda"
              description="Cadastre despesas para entender como você costuma pagar."
              actionLabel="Cadastrar despesa"
              href="/transacoes"
              icon={Wallet}
            />
          )}
        </div>

        <div className="app-card p-4">
          <SectionIntro
            title="Movimentações recentes"
            description="Aqui aparecem suas movimentações mais recentes. Cadastre entradas e despesas para acompanhar seu fluxo financeiro."
            helpText="Use esta lista para conferir rapidamente se o mês está atualizado."
          />
          {dashboard?.recentTransactions.length ? (
            <TransactionList items={dashboard.recentTransactions} />
          ) : (
            <EmptyState
              title="Nenhuma movimentação ainda"
              description="Comece por uma entrada, uma despesa ou importe seu extrato para preencher o Resumo."
              actionLabel="Cadastrar movimentação"
              href="/transacoes"
              icon={ReceiptText}
            />
          )}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-3">
        {[
          { href: "/parcelas", icon: Layers3, title: "Simular compra parcelada", description: "Veja o impacto nos próximos meses antes de registrar uma compra." },
          { href: "/importar", icon: FileUp, title: "Importar extrato CSV", description: "Traga movimentações do banco e revise tudo antes de confirmar." },
          { href: "/relatorios", icon: BarChart3, title: "Ver relatório do mês", description: "Analise categorias, formas de pagamento e evolução mensal." }
        ].map((action) => (
          <Link className="app-card interactive-card focus-ring p-4 transition hover:-translate-y-0.5 hover:border-leaf/50" href={action.href} key={action.href}>
            <span className="flex h-10 w-10 items-center justify-center rounded-app bg-leaf/10 text-leaf">
              <action.icon size={20} aria-hidden />
            </span>
            <strong className="mt-3 block text-sm text-ink">{action.title}</strong>
            <span className="mt-1 block text-sm text-muted">{action.description}</span>
          </Link>
        ))}
      </section>
    </div>
  );
}

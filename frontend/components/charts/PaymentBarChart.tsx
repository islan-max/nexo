"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBRL } from "@/lib/format";
import type { ChartTheme } from "@/components/charts/chartTheme";

export type PaymentBar = {
  payment_method: string;
  total: number;
  color: string;
};

type PaymentBarChartProps = {
  data: PaymentBar[];
  activePayment: string | null;
  onActiveChange: (method: string | null) => void;
  theme: ChartTheme;
};

/** Eixo Y em milhares só quando os valores justificam; abaixo disso, valor cheio. */
function formatAxisValue(value: number, useThousands: boolean): string {
  if (!useThousands) return `R$${Math.round(value)}`;
  return `R$${(value / 1000).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}k`;
}

export default function PaymentBarChart({ data, activePayment, onActiveChange, theme }: PaymentBarChartProps) {
  // O eixo antigo dividia tudo por mil, então R$ 240 virava "R$0.24k".
  const maxValue = data.reduce((max, item) => Math.max(max, item.total), 0);
  const useThousands = maxValue >= 1000;

  return (
    <ResponsiveContainer height="100%" width="100%">
      <BarChart data={data} margin={{ top: 5, right: 16, left: 0, bottom: 5 }}>
        <CartesianGrid stroke={theme.grid} strokeDasharray="3 3" vertical={false} />
        <XAxis
          axisLine={false}
          dataKey="payment_method"
          height={64}
          interval={0}
          tick={{ fontSize: 12, fill: theme.text }}
          tickLine={false}
        />
        <YAxis
          axisLine={false}
          tick={{ fill: theme.text, fontSize: 12 }}
          tickFormatter={(value) => formatAxisValue(Number(value), useThousands)}
          tickLine={false}
          width={useThousands ? 56 : 64}
        />
        <Tooltip contentStyle={theme.tooltip} cursor={{ fill: theme.grid, opacity: 0.35 }} formatter={(value) => formatBRL(Number(value))} />
        <Bar
          activeBar={{ fillOpacity: 0.88, stroke: theme.stroke, strokeWidth: 2 }}
          animationDuration={650}
          animationEasing="ease-out"
          dataKey="total"
          isAnimationActive
          onMouseEnter={(_: unknown, index: number) => onActiveChange(data[index]?.payment_method || null)}
          onMouseLeave={() => onActiveChange(null)}
          radius={[10, 10, 0, 0]}
        >
          {data.map((entry) => (
            <Cell
              fill={entry.color}
              key={entry.payment_method}
              opacity={!activePayment || activePayment === entry.payment_method ? 1 : 0.42}
            />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

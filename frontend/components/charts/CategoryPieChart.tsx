"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatBRL } from "@/lib/format";
import type { ChartTheme } from "@/components/charts/chartTheme";

export type CategorySlice = {
  name: string;
  total: number;
  color: string;
};

type CategoryPieChartProps = {
  data: CategorySlice[];
  activeCategory: string | null;
  onActiveChange: (name: string | null) => void;
  theme: ChartTheme;
};

/**
 * Rosca de gastos por categoria.
 *
 * Vive em módulo próprio para o recharts (~140 kB) sair do bundle inicial do
 * dashboard e ser carregado sob demanda — ver SummaryHome.
 */
export default function CategoryPieChart({ data, activeCategory, onActiveChange, theme }: CategoryPieChartProps) {
  return (
    <ResponsiveContainer height="100%" width="100%">
      <PieChart>
        <Pie
          animationDuration={650}
          animationEasing="ease-out"
          data={data}
          dataKey="total"
          innerRadius={48}
          isAnimationActive
          nameKey="name"
          onMouseEnter={(_: unknown, index: number) => onActiveChange(data[index]?.name || null)}
          onMouseLeave={() => onActiveChange(null)}
          outerRadius={88}
          paddingAngle={3}
        >
          {data.map((item) => (
            <Cell
              fill={item.color}
              key={item.name}
              opacity={!activeCategory || activeCategory === item.name ? 1 : 0.38}
              stroke={activeCategory === item.name ? theme.stroke : "transparent"}
              strokeWidth={activeCategory === item.name ? 2 : 0}
            />
          ))}
        </Pie>
        <Tooltip contentStyle={theme.tooltip} formatter={(value) => formatBRL(Number(value))} />
      </PieChart>
    </ResponsiveContainer>
  );
}

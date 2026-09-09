/**
 * Tema dos gráficos.
 *
 * As cores vinham hardcoded em cada componente — inclusive um roxo e um rosa
 * herdados da marca antiga, que não conversavam com o verde do Trevo. Aqui elas
 * saem de uma fonte só, derivada da paleta da marca, e o eixo/grade/tooltip
 * seguem o tema ativo em vez de valores fixos.
 */

export type ChartTheme = {
  grid: string;
  text: string;
  stroke: string;
  tooltip: {
    backgroundColor: string;
    border: string;
    borderRadius: number;
    color: string;
  };
};

export function getChartTheme(isDark: boolean): ChartTheme {
  const grid = isDark ? "#2B3235" : "#DCE5DE";
  const text = isDark ? "#A2AAB3" : "#5C7062";
  const stroke = isDark ? "#E7EBE8" : "#171A18";
  return {
    grid,
    text,
    stroke,
    tooltip: {
      backgroundColor: isDark ? "#16191C" : "#FFFFFF",
      border: `1px solid ${grid}`,
      borderRadius: 12,
      color: isDark ? "#E7EBE8" : "#171A18"
    }
  };
}

/**
 * Sequência categórica para séries sem cor própria.
 *
 * Começa no verde da marca e abre em matizes distinguíveis entre si, mantendo
 * luminosidade próxima para nenhuma fatia dominar por brilho. Também sobrevive
 * às formas comuns de daltonismo, porque evita o par vermelho/verde puro.
 */
export const CATEGORICAL_COLORS = [
  "#2E9D5B",
  "#3F7EA6",
  "#D9A441",
  "#7E63B8",
  "#C2683F",
  "#4FB897",
  "#B85C7E",
  "#6B8F3D"
] as const;

/** Cor estável por forma de pagamento; o resto entra pela sequência acima. */
export const PAYMENT_COLORS: Record<string, string> = {
  pix: "#2E9D5B",
  "pix ": "#2E9D5B",
  debit: "#3F7EA6",
  débito: "#3F7EA6",
  debito: "#3F7EA6",
  credit: "#7E63B8",
  crédito: "#7E63B8",
  credito: "#7E63B8",
  cash: "#D9A441",
  dinheiro: "#D9A441",
  transfer: "#4FB897",
  transferência: "#4FB897",
  transferencia: "#4FB897",
  boleto: "#C2683F"
};

export function colorForPaymentMethod(method: string, index: number): string {
  const key = (method || "").toLowerCase().trim();
  return PAYMENT_COLORS[key] || CATEGORICAL_COLORS[index % CATEGORICAL_COLORS.length];
}

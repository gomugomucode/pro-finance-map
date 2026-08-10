import React from "react";
import { formatMoney } from "@/lib/money";

interface TooltipPayloadItem {
  name?: string;
  value?: number;
  color?: string;
  dataKey?: string;
  payload?: Record<string, any>;
}

interface FinancialChartTooltipProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string | number;
  currency?: string;
  showNetCashFlow?: boolean;
}

export const FinancialChartTooltip: React.FC<FinancialChartTooltipProps> = ({
  active,
  payload,
  label,
  currency = "USD",
  showNetCashFlow = true,
}) => {
  if (!active || !payload || payload.length === 0) {
    return null;
  }

  let incomeVal: number | null = null;
  let expenseVal: number | null = null;

  payload.forEach((item) => {
    const key = (item.dataKey || item.name || "").toString().toLowerCase();
    if (key.includes("income")) {
      incomeVal = item.value ?? 0;
    } else if (key.includes("expense")) {
      expenseVal = item.value ?? 0;
    }
  });

  const hasNetFlow = showNetCashFlow && incomeVal !== null && expenseVal !== null;
  const inc = incomeVal ?? 0;
  const exp = expenseVal ?? 0;
  const netFlow = hasNetFlow ? inc - exp : 0;

  return (
    <div className="rounded-xl border border-border bg-card p-3 shadow-xl backdrop-blur-md transition-all text-xs space-y-2 min-w-44 z-50 pointer-events-none">
      {label && (
        <div className="font-mono font-bold tracking-tight text-foreground border-b border-border/60 pb-1 text-[11px]">
          {label}
        </div>
      )}

      <div className="space-y-1.5">
        {payload.map((item, idx) => {
          const rawVal = item.value ?? 0;
          // Note: If payload values are already in major currency units, convert to minor or pass decimals
          const formattedVal = formatMoney(rawVal * 100, currency);
          const isInc = (item.name || item.dataKey || "")
            .toString()
            .toLowerCase()
            .includes("income");
          const isExp = (item.name || item.dataKey || "")
            .toString()
            .toLowerCase()
            .includes("expense");

          return (
            <div key={idx} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2.5 w-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color || "var(--primary)" }}
                />
                <span className="text-muted-foreground font-medium">
                  {item.name || item.dataKey}
                </span>
              </div>
              <span
                className={`font-mono font-bold tabular ${
                  isInc
                    ? "text-emerald-600 dark:text-emerald-400"
                    : isExp
                      ? "text-rose-600 dark:text-rose-400"
                      : "text-foreground"
                }`}
              >
                {isInc ? `+${formattedVal}` : isExp ? `-${formattedVal}` : formattedVal}
              </span>
            </div>
          );
        })}

        {hasNetFlow && (
          <div className="border-t border-border/60 pt-1.5 flex items-center justify-between gap-4 font-semibold">
            <span className="text-muted-foreground">Net Cash Flow</span>
            <span
              className={`font-mono font-extrabold tabular ${
                netFlow >= 0
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-rose-600 dark:text-rose-400"
              }`}
            >
              {netFlow >= 0
                ? `+${formatMoney(netFlow * 100, currency)}`
                : formatMoney(netFlow * 100, currency)}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

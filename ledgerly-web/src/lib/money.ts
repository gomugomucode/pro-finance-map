// Money utilities — all storage in integer minor units.
export type Currency = { code: string; symbol: string; decimals: number };

export const DEFAULT_DECIMALS = 2;

export function toMinor(amount: number, decimals = DEFAULT_DECIMALS): number {
  if (!isFinite(amount)) return 0;
  return Math.round(amount * Math.pow(10, decimals));
}

export function fromMinor(minor: number | bigint | string, decimals = DEFAULT_DECIMALS): number {
  const n = typeof minor === "bigint" ? Number(minor) : Number(minor);
  return n / Math.pow(10, decimals);
}

export function formatMoney(
  minor: number | bigint | string | null | undefined,
  currency = "USD",
  decimals = DEFAULT_DECIMALS,
  opts: { signed?: boolean; compact?: boolean } = {},
): string {
  const value = fromMinor(minor ?? 0, decimals);
  const abs = Math.abs(value);
  try {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: decimals,
      notation: opts.compact && abs >= 10_000 ? "compact" : "standard",
    });
    const formatted = formatter.format(abs);
    if (opts.signed) return `${value < 0 ? "-" : value > 0 ? "+" : ""}${formatted}`;
    return `${value < 0 ? "-" : ""}${formatted}`;
  } catch {
    return `${value.toFixed(decimals)} ${currency}`;
  }
}

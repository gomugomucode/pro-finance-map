export function toMinor(amount: number): number {
  return Math.round((amount || 0) * 100);
}

export function fromMinor(minorAmount: number): number {
  return (minorAmount || 0) / 100;
}

export function formatMoney(minorAmount: number, currency = "USD"): string {
  const amount = fromMinor(minorAmount);
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`;
  }
}

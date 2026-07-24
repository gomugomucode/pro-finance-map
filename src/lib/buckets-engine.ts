export interface MoneyBucketSummary {
  availableMinor: number;
  reservedMinor: number;
  investedMinor: number;
  lockedMinor: number;
  totalNetWorthMinor: number;
  breakdown: {
    purpose: string;
    amountMinor: number;
    accountCount: number;
    color: string;
  }[];
}

export function calculateMoneyBuckets(accounts: any[]): MoneyBucketSummary {
  let availableMinor = 0;
  let reservedMinor = 0;
  let investedMinor = 0;
  let lockedMinor = 0;

  const purposeTotals: Record<string, { amount: number; count: number; color: string }> = {
    "Daily Spending": { amount: 0, count: 0, color: "#2563EB" },
    "Emergency Fund": { amount: 0, count: 0, color: "#10B981" },
    "Bills Reserve": { amount: 0, count: 0, color: "#F59E0B" },
    Investments: { amount: 0, count: 0, color: "#8B5CF6" },
    Taxes: { amount: 0, count: 0, color: "#EF4444" },
    "Locked / Fixed": { amount: 0, count: 0, color: "#64748B" },
  };

  (accounts || []).forEach((acc) => {
    const bal = Number(acc.current_balance_minor || 0);
    const type = (acc.type || "").toLowerCase();
    const name = (acc.name || "").toLowerCase();

    if (type === "investment" || name.includes("stock") || name.includes("crypto")) {
      investedMinor += bal;
      purposeTotals["Investments"].amount += bal;
      purposeTotals["Investments"].count += 1;
    } else if (name.includes("emergency") || name.includes("savings")) {
      reservedMinor += bal;
      purposeTotals["Emergency Fund"].amount += bal;
      purposeTotals["Emergency Fund"].count += 1;
    } else if (name.includes("tax") || name.includes("bill")) {
      reservedMinor += bal;
      purposeTotals["Bills Reserve"].amount += bal;
      purposeTotals["Bills Reserve"].count += 1;
    } else if (type === "loan" || type === "mortgage" || name.includes("locked")) {
      lockedMinor += bal;
      purposeTotals["Locked / Fixed"].amount += bal;
      purposeTotals["Locked / Fixed"].count += 1;
    } else {
      availableMinor += bal;
      purposeTotals["Daily Spending"].amount += bal;
      purposeTotals["Daily Spending"].count += 1;
    }
  });

  const totalNetWorthMinor = availableMinor + reservedMinor + investedMinor + lockedMinor;

  const breakdown = Object.entries(purposeTotals).map(([purpose, val]) => ({
    purpose,
    amountMinor: val.amount,
    accountCount: val.count,
    color: val.color,
  }));

  return {
    availableMinor,
    reservedMinor,
    investedMinor,
    lockedMinor,
    totalNetWorthMinor,
    breakdown,
  };
}

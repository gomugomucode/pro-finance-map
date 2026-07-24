export interface EmergencyFundAdvisorResult {
  monthsRunway: number;
  recommendedFundMinor: number;
  currentFundMinor: number;
  savingsGapMinor: number;
  monthlyTargetContributionMinor: number;
}

export interface FinancialMilestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progressPct: number;
}

export function calculateEmergencyFundAdvisor(data: {
  liquidBalanceMinor: number;
  monthlyExpenseMinor: number;
}): EmergencyFundAdvisorResult {
  const { liquidBalanceMinor, monthlyExpenseMinor } = data;
  const safeMonthly = monthlyExpenseMinor > 0 ? monthlyExpenseMinor : 150000;

  const monthsRunway = liquidBalanceMinor / safeMonthly;
  const recommendedFundMinor = safeMonthly * 6; // 6 months standard safety net
  const currentFundMinor = liquidBalanceMinor;
  const savingsGapMinor = Math.max(0, recommendedFundMinor - currentFundMinor);
  const monthlyTargetContributionMinor = savingsGapMinor > 0 ? Math.round(savingsGapMinor / 12) : 0;

  return {
    monthsRunway,
    recommendedFundMinor,
    currentFundMinor,
    savingsGapMinor,
    monthlyTargetContributionMinor,
  };
}

export function evaluateFinancialMilestones(data: {
  transactionCount: number;
  netWorthMinor: number;
  budgetExceededCount: number;
  savingsGoalsCount: number;
}): FinancialMilestone[] {
  const { transactionCount, netWorthMinor, budgetExceededCount } = data;

  return [
    {
      id: "first-month-under-budget",
      title: "Budget Master",
      description: "Kept spending under all category limits for a full month.",
      icon: "🎯",
      unlocked: budgetExceededCount === 0,
      progressPct: budgetExceededCount === 0 ? 100 : 60,
    },
    {
      id: "100-transactions",
      title: "Century Ledger",
      description: "Recorded over 100 transactions in your operating system.",
      icon: "📊",
      unlocked: transactionCount >= 100,
      progressPct: Math.min(100, (transactionCount / 100) * 100),
    },
    {
      id: "positive-net-worth",
      title: "Wealth Builder",
      description: "Maintained a positive net worth across liquid accounts.",
      icon: "💎",
      unlocked: netWorthMinor > 0,
      progressPct: netWorthMinor > 0 ? 100 : 0,
    },
    {
      id: "emergency-reserve",
      title: "Fortress Reserves",
      description: "Built an emergency fund covering 3+ months of expenses.",
      icon: "🛡️",
      unlocked: netWorthMinor >= 450000,
      progressPct: Math.min(100, Math.round((netWorthMinor / 450000) * 100)),
    },
  ];
}

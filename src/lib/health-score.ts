export interface HealthDeduction {
  factor: string;
  pointsDeducted: number;
  maxPoints: number;
  reason: string;
  recommendation: string;
}

export interface HealthScoreResult {
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  status: "Excellent" | "Good" | "Fair" | "Needs Attention" | "Critical";
  deductions: HealthDeduction[];
}

export function calculateHealthScoreV2(data: {
  netWorthMinor: number;
  monthIncomeMinor: number;
  monthExpenseMinor: number;
  accounts: any[];
  budgets?: any[];
}): HealthScoreResult {
  const { netWorthMinor, monthIncomeMinor, monthExpenseMinor, accounts, budgets } = data;

  let totalScore = 100;
  const deductions: HealthDeduction[] = [];

  // 1. Savings Ratio (Max 25 pts)
  const savingsPct = monthIncomeMinor > 0 ? ((monthIncomeMinor - monthExpenseMinor) / monthIncomeMinor) * 100 : 0;
  if (savingsPct < 20) {
    const pts = Math.min(25, Math.round((20 - Math.max(0, savingsPct)) * 1.25));
    totalScore -= pts;
    deductions.push({
      factor: "Savings Ratio",
      pointsDeducted: pts,
      maxPoints: 25,
      reason: `Monthly savings rate is ${savingsPct.toFixed(1)}% (target is 20%+).`,
      recommendation: "Aim to save at least 20% of net income by trimming non-essential subscriptions.",
    });
  }

  // 2. Emergency Fund Reserve (Max 25 pts)
  const monthlyExpense = monthExpenseMinor > 0 ? monthExpenseMinor : 100000;
  const monthsCovered = netWorthMinor / monthlyExpense;
  if (monthsCovered < 3) {
    const pts = Math.min(25, Math.round((3 - Math.max(0, monthsCovered)) * 8));
    totalScore -= pts;
    deductions.push({
      factor: "Emergency Fund",
      pointsDeducted: pts,
      maxPoints: 25,
      reason: `Liquid reserves cover ${monthsCovered.toFixed(1)} months of expenses (target is 3-6 months).`,
      recommendation: "Build liquid savings to cover at least 3 months of essential living expenses.",
    });
  }

  // 3. Debt & Credit Liabilities (Max 25 pts)
  const creditBalanceMinor = accounts
    .filter((a) => a.type === "credit")
    .reduce((sum, a) => sum + Math.abs(Number(a.current_balance_minor || 0)), 0);

  if (creditBalanceMinor > 0 && netWorthMinor > 0) {
    const debtRatio = (creditBalanceMinor / netWorthMinor) * 100;
    if (debtRatio > 30) {
      const pts = Math.min(25, Math.round((debtRatio - 30) * 0.5));
      totalScore -= pts;
      deductions.push({
        factor: "Debt Liabilities",
        pointsDeducted: pts,
        maxPoints: 25,
        reason: `Credit card debt represents ${debtRatio.toFixed(1)}% of net worth.`,
        recommendation: "Pay down high-interest credit card debt to preserve long-term net worth.",
      });
    }
  }

  // 4. Budget Compliance (Max 25 pts)
  if (budgets && budgets.length > 0) {
    const overBudget = budgets.filter((b) => Number(b.spent_minor || 0) > Number(b.limit_minor || 0));
    if (overBudget.length > 0) {
      const pts = Math.min(25, overBudget.length * 8);
      totalScore -= pts;
      deductions.push({
        factor: "Budget Compliance",
        pointsDeducted: pts,
        maxPoints: 25,
        reason: `${overBudget.length} category budget limits exceeded this month.`,
        recommendation: "Review exceeded budgets and adjust limits or curb discretionary category spending.",
      });
    }
  }

  const finalScore = Math.max(0, Math.min(100, Math.round(totalScore)));

  let grade: HealthScoreResult["grade"] = "A+";
  let status: HealthScoreResult["status"] = "Excellent";

  if (finalScore >= 90) {
    grade = "A+";
    status = "Excellent";
  } else if (finalScore >= 80) {
    grade = "A";
    status = "Good";
  } else if (finalScore >= 70) {
    grade = "B";
    status = "Fair";
  } else if (finalScore >= 50) {
    grade = "C";
    status = "Needs Attention";
  } else {
    grade = "F";
    status = "Critical";
  }

  return {
    score: finalScore,
    grade,
    status,
    deductions,
  };
}

export interface CashFlowForecastPoint {
  day: number;
  label: string;
  expectedMinor: number;
  bestCaseMinor: number;
  worstCaseMinor: number;
}

export function generateCashFlowForecast(data: {
  netWorthMinor: number;
  monthIncomeMinor: number;
  monthExpenseMinor: number;
}): CashFlowForecastPoint[] {
  const { netWorthMinor, monthIncomeMinor, monthExpenseMinor } = data;

  const now = new Date();
  const daysInMonth = Math.max(1, now.getDate());

  // Daily net burn/growth rate in minor units
  const dailyIncome = monthIncomeMinor / daysInMonth;
  const dailyExpense = monthExpenseMinor / daysInMonth;
  const dailyNet = dailyIncome - dailyExpense;

  const points: CashFlowForecastPoint[] = [];
  const milestones = [0, 7, 14, 30, 60, 90];

  milestones.forEach((days) => {
    const expected = netWorthMinor + dailyNet * days;
    const bestCase = netWorthMinor + (dailyIncome * 1.1 - dailyExpense * 0.85) * days;
    const worstCase = netWorthMinor + (dailyIncome * 0.9 - dailyExpense * 1.25) * days;

    points.push({
      day: days,
      label: days === 0 ? "Today" : `Day ${days}`,
      expectedMinor: Math.round(expected),
      bestCaseMinor: Math.round(bestCase),
      worstCaseMinor: Math.round(worstCase),
    });
  });

  return points;
}

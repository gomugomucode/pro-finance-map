export interface FinancialInsight {
  id: string;
  type: "warning" | "positive" | "info" | "alert";
  title: string;
  description: string;
  metric?: string;
  category?: string;
}

export function generateFinancialInsights(data: {
  transactions: any[];
  accounts: any[];
  categories: any[];
  budgets?: any[];
}): FinancialInsight[] {
  const insights: FinancialInsight[] = [];
  const { transactions, accounts, categories } = data;

  if (!transactions || transactions.length === 0) {
    insights.push({
      id: "no-data",
      type: "info",
      title: "Start Recording Transactions",
      description: "Add your first transaction to unlock automated spending insights and pattern detection.",
    });
    return insights;
  }

  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  // 1. Filter current & previous month transactions
  const currentMonthTxns = transactions.filter(
    (t) => new Date(t.occurred_at || t.created_at) >= currentMonthStart
  );
  const prevMonthTxns = transactions.filter((t) => {
    const d = new Date(t.occurred_at || t.created_at);
    return d >= prevMonthStart && d < currentMonthStart;
  });

  // 2. Average Daily Spending
  const daysPassed = Math.max(1, now.getDate());
  const currentExpensesMinor = currentMonthTxns
    .filter((t) => t.kind === "expense")
    .reduce((sum, t) => sum + Number(t.amount_minor || 0), 0);
  const avgDailySpendMinor = currentExpensesMinor / daysPassed;

  insights.push({
    id: "daily-avg",
    type: "info",
    title: "Daily Spend Pace",
    description: `Your average daily spending this month is $${(avgDailySpendMinor / 100).toFixed(2)}.`,
    metric: `$${(avgDailySpendMinor / 100).toFixed(2)}/day`,
  });

  // 3. Category Comparison (This month vs last month)
  const currentCatTotals: Record<string, number> = {};
  const prevCatTotals: Record<string, number> = {};

  currentMonthTxns.forEach((t) => {
    if (t.kind === "expense" && t.category_id) {
      currentCatTotals[t.category_id] = (currentCatTotals[t.category_id] || 0) + Number(t.amount_minor || 0);
    }
  });

  prevMonthTxns.forEach((t) => {
    if (t.kind === "expense" && t.category_id) {
      prevCatTotals[t.category_id] = (prevCatTotals[t.category_id] || 0) + Number(t.amount_minor || 0);
    }
  });

  const catMap = new Map(categories.map((c) => [c.id, c.name]));

  Object.keys(currentCatTotals).forEach((catId) => {
    const curr = currentCatTotals[catId];
    const prev = prevCatTotals[catId] || 0;
    const name = catMap.get(catId) || "Category";

    if (prev > 0) {
      const diffPct = Math.round(((curr - prev) / prev) * 100);
      if (diffPct >= 15) {
        insights.push({
          id: `cat-spike-${catId}`,
          type: "warning",
          title: `${name} Spending Increased`,
          description: `You spent ${diffPct}% more on ${name} this month compared to last month.`,
          metric: `+${diffPct}%`,
          category: name,
        });
      } else if (diffPct <= -10) {
        insights.push({
          id: `cat-drop-${catId}`,
          type: "positive",
          title: `${name} Spending Reduced`,
          description: `${name} spending decreased by ${Math.abs(diffPct)}% this month. Great job!`,
          metric: `${diffPct}%`,
          category: name,
        });
      }
    }
  });

  // 4. Largest Single Expense This Week
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const weekExpenses = transactions.filter(
    (t) => t.kind === "expense" && new Date(t.occurred_at || t.created_at) >= oneWeekAgo
  );

  if (weekExpenses.length > 0) {
    const largest = weekExpenses.reduce((prev, current) =>
      Number(current.amount_minor || 0) > Number(prev.amount_minor || 0) ? current : prev
    );
    const merchant = largest.merchant_name || largest.description || "Expense";
    const amt = (Number(largest.amount_minor || 0) / 100).toFixed(2);

    insights.push({
      id: "largest-week-expense",
      type: "info",
      title: "Largest Recent Expense",
      description: `Your largest single expense this week was $${amt} at ${merchant}.`,
      metric: `$${amt}`,
    });
  }

  // 5. Weekend Overspending Pattern
  let weekendSpend = 0;
  let weekdaySpend = 0;
  let weekendDays = 0;
  let weekdayDays = 0;

  currentMonthTxns.forEach((t) => {
    if (t.kind === "expense") {
      const day = new Date(t.occurred_at || t.created_at).getDay();
      const amt = Number(t.amount_minor || 0);
      if (day === 0 || day === 6) {
        weekendSpend += amt;
      } else {
        weekdaySpend += amt;
      }
    }
  });

  const weekendAvg = weekendSpend / Math.max(1, (daysPassed / 7) * 2);
  const weekdayAvg = weekdaySpend / Math.max(1, (daysPassed / 7) * 5);

  if (weekendAvg > weekdayAvg * 1.5 && weekendSpend > 0) {
    insights.push({
      id: "weekend-spike",
      type: "warning",
      title: "Weekend Spending Pattern",
      description: "Weekend spending is 50%+ higher than weekday daily averages.",
      metric: "Weekend Heavy",
    });
  }

  return insights;
}

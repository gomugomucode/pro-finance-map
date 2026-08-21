import { calculateEmergencyFundAdvisor, evaluateFinancialMilestones } from "./advisor-engine";
import { calculateHealthScoreV2 } from "./health-score";
import { parseQuickInput } from "./smart-parser";
import { getExchangeRate, convertCurrency } from "./fx-engine";

export interface DiagnosticResult {
  suite: string;
  passed: boolean;
  message: string;
  durationMs: number;
}

export async function runSystemDiagnostics(): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // 1. Advisor & Milestones Diagnostic
  const t0 = performance.now();
  try {
    const advisor = calculateEmergencyFundAdvisor({
      liquidBalanceMinor: 600000,
      monthlyExpenseMinor: 100000,
    });
    if (advisor.monthsRunway !== 6) throw new Error("Emergency fund runway mismatch");

    const milestones = evaluateFinancialMilestones({
      transactionCount: 150,
      netWorthMinor: 500000,
      budgetExceededCount: 0,
      savingsGoalsCount: 2,
    });
    if (!milestones.some((m) => m.unlocked)) throw new Error("Milestones failed to evaluate");

    results.push({
      suite: "Advisor & Financial Intelligence",
      passed: true,
      message: "Emergency fund runway and milestone unlock evaluation passed.",
      durationMs: Math.round(performance.now() - t0),
    });
  } catch (err) {
    results.push({
      suite: "Advisor & Financial Intelligence",
      passed: false,
      message: err instanceof Error ? err.message : String(err),
      durationMs: Math.round(performance.now() - t0),
    });
  }

  // 2. Health Score Diagnostic
  const t1 = performance.now();
  try {
    const health = calculateHealthScoreV2({
      netWorthMinor: 400000,
      monthIncomeMinor: 300000,
      monthExpenseMinor: 200000,
      accounts: [{ type: "cash", current_balance_minor: 500000 }],
      budgets: [],
    });
    if (health.score < 0 || health.score > 100) throw new Error("Health score out of bounds");

    results.push({
      suite: "Health Score Engine",
      passed: true,
      message: `Score generated: ${health.score}/100 (Grade: ${health.grade}, Status: "${health.status}").`,
      durationMs: Math.round(performance.now() - t1),
    });
  } catch (err) {
    results.push({
      suite: "Health Score Engine",
      passed: false,
      message: err instanceof Error ? err.message : String(err),
      durationMs: Math.round(performance.now() - t1),
    });
  }

  // 3. Multi-Currency FX Engine Diagnostic
  const t2 = performance.now();
  try {
    const rate = getExchangeRate("USD", "EUR");
    if (rate <= 0) throw new Error("Invalid FX rate returned");

    const converted = convertCurrency(10000, "USD", "EUR");
    if (converted <= 0) throw new Error("Invalid currency conversion result");

    results.push({
      suite: "Multi-Currency & FX Engine",
      passed: true,
      message: "Triangular currency conversion and rates table operational.",
      durationMs: Math.round(performance.now() - t2),
    });
  } catch (err) {
    results.push({
      suite: "Multi-Currency & FX Engine",
      passed: false,
      message: err instanceof Error ? err.message : String(err),
      durationMs: Math.round(performance.now() - t2),
    });
  }

  // 4. Natural Language Smart Parser
  const t3 = performance.now();
  try {
    const parsed = parseQuickInput("25 coffee at Peets", [], []);
    if (parsed.amount !== 25) throw new Error("Smart parser amount extraction failed");

    results.push({
      suite: "Smart Natural Language Parser",
      passed: true,
      message: "Quick natural language transaction parsing validated.",
      durationMs: Math.round(performance.now() - t3),
    });
  } catch (err) {
    results.push({
      suite: "Smart Natural Language Parser",
      passed: false,
      message: err instanceof Error ? err.message : String(err),
      durationMs: Math.round(performance.now() - t3),
    });
  }

  return results;
}

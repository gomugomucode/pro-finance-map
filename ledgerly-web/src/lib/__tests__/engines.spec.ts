import { describe, it, expect } from "vitest";
import { calculateEmergencyFundAdvisor, evaluateFinancialMilestones } from "../advisor-engine";
import { calculateHealthScoreV2 } from "../health-score";
import { parseQuickInput } from "../smart-parser";

describe("Financial Intelligence Engines", () => {
  it("calculates emergency fund advisor runway and savings gap", () => {
    const advisorResult = calculateEmergencyFundAdvisor({
      liquidBalanceMinor: 600000, // $6,000
      monthlyExpenseMinor: 100000, // $1,000
    });

    expect(advisorResult.monthsRunway).toBe(6);
    expect(advisorResult.recommendedFundMinor).toBe(600000);
    expect(advisorResult.savingsGapMinor).toBe(0);
  });

  it("evaluates financial milestone unlocks", () => {
    const milestones = evaluateFinancialMilestones({
      transactionCount: 150,
      netWorthMinor: 500000,
      budgetExceededCount: 0,
      savingsGoalsCount: 2,
    });

    const budgetMaster = milestones.find((m) => m.id === "first-month-under-budget");
    expect(budgetMaster?.unlocked).toBe(true);

    const centuryLedger = milestones.find((m) => m.id === "100-transactions");
    expect(centuryLedger?.unlocked).toBe(true);
  });

  it("computes health score accurately", () => {
    const mockAccounts = [
      { type: "cash", current_balance_minor: 500000 },
      { type: "credit", current_balance_minor: -100000 },
    ];
    const healthResult = calculateHealthScoreV2({
      netWorthMinor: 400000,
      monthIncomeMinor: 300000,
      monthExpenseMinor: 200000,
      accounts: mockAccounts,
      budgets: [],
    });

    expect(healthResult.score).toBeGreaterThanOrEqual(50);
  });

  it("parses natural language quick inputs with smart-parser", () => {
    const mockCategories = [
      { id: "cat-1", name: "Food & Dining", kind: "expense" },
      { id: "cat-2", name: "Salary", kind: "income" },
    ];
    const mockAccountsList = [{ id: "acc-1", name: "Chase Checking" }];

    const parseResult = parseQuickInput(
      "250 coffee at Starbucks",
      mockCategories,
      mockAccountsList,
    );

    expect(parseResult.amount).toBe(250);
    expect(parseResult.kind).toBe("expense");
  });
});

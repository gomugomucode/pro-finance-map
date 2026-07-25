import { calculateEmergencyFundAdvisor, evaluateFinancialMilestones } from "../advisor-engine";
import { calculateHealthScoreV2 } from "../health-score";
import { parseQuickInput } from "../smart-parser";

export async function runEnginesSelfTest() {
  console.log("🚀 Starting Financial Engines Self-Tests...");

  // 1. Test: calculateEmergencyFundAdvisor
  const advisorResult = calculateEmergencyFundAdvisor({
    liquidBalanceMinor: 600000, // $6,000
    monthlyExpenseMinor: 100000, // $1,000
  });

  if (advisorResult.monthsRunway !== 6) {
    throw new Error(
      `advisor-engine runway mismatch: expected 6, got ${advisorResult.monthsRunway}`,
    );
  }
  if (advisorResult.recommendedFundMinor !== 600000) {
    throw new Error(
      `advisor-engine recommendation mismatch: expected 600000, got ${advisorResult.recommendedFundMinor}`,
    );
  }
  if (advisorResult.savingsGapMinor !== 0) {
    throw new Error(
      `advisor-engine savings gap mismatch: expected 0, got ${advisorResult.savingsGapMinor}`,
    );
  }

  // 2. Test: evaluateFinancialMilestones
  const milestones = evaluateFinancialMilestones({
    transactionCount: 150,
    netWorthMinor: 500000,
    budgetExceededCount: 0,
    savingsGoalsCount: 2,
  });

  const budgetMaster = milestones.find((m) => m.id === "first-month-under-budget");
  if (!budgetMaster || !budgetMaster.unlocked) {
    throw new Error("advisor-engine milestones: Budget Master should be unlocked");
  }

  const centuryLedger = milestones.find((m) => m.id === "100-transactions");
  if (!centuryLedger || !centuryLedger.unlocked) {
    throw new Error("advisor-engine milestones: Century Ledger should be unlocked");
  }

  // 3. Test: calculateHealthScoreV2
  const mockAccounts = [
    { type: "cash", current_balance_minor: 500000 },
    { type: "credit", current_balance_minor: -100000 }, // Credit debt
  ];
  const healthResult = calculateHealthScoreV2({
    netWorthMinor: 400000,
    monthIncomeMinor: 300000,
    monthExpenseMinor: 200000, // Savings = 33% (>=20% target)
    accounts: mockAccounts,
    budgets: [],
  });

  if (healthResult.score < 50) {
    throw new Error(`health-score unexpectedly low: score ${healthResult.score}`);
  }

  // 4. Test: parseQuickInput (smart-parser)
  const mockCategories = [
    { id: "cat-1", name: "Food & Dining", kind: "expense" },
    { id: "cat-2", name: "Salary", kind: "income" },
  ];
  const mockAccountsList = [{ id: "acc-1", name: "Chase Checking" }];

  const parseExpenseResult = parseQuickInput(
    "250 coffee at Starbucks",
    mockCategories,
    mockAccountsList,
  );
  if (parseExpenseResult.amount !== 250) {
    throw new Error(
      `smart-parser amount parse mismatch: expected 250, got ${parseExpenseResult.amount}`,
    );
  }
  if (parseExpenseResult.kind !== "expense") {
    throw new Error(`smart-parser kind mismatch: expected expense, got ${parseExpenseResult.kind}`);
  }

  console.log("✅ All Financial Engine Self-Tests Passed Successfully!");
  return true;
}

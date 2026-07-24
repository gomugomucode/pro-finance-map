export interface FinancialRule {
  id: string;
  conditionField: "merchant" | "amount" | "account";
  conditionOperator: "contains" | "equals" | "greater_than";
  conditionValue: string;
  actionType: "assign_category" | "require_confirmation" | "salary_split";
  actionValue: string;
}

export interface RuleExecutionResult {
  categoryId?: string;
  categoryName?: string;
  requiresConfirmation?: boolean;
  salarySplit?: { savings: number; investment: number; spending: number };
}

export function evaluateFinancialRules(
  transaction: { merchant_name?: string; amount_minor?: number },
  rules: FinancialRule[] = []
): RuleExecutionResult {
  const result: RuleExecutionResult = {};
  const merchant = (transaction.merchant_name || "").toLowerCase();
  const amt = Number(transaction.amount_minor || 0) / 100;

  // Built-in smart rules
  if (merchant.includes("starbucks") || merchant.includes("coffee")) {
    result.categoryName = "Coffee & Dining";
  } else if (merchant.includes("uber") || merchant.includes("lyft") || merchant.includes("gas")) {
    result.categoryName = "Transport";
  } else if (merchant.includes("netflix") || merchant.includes("spotify")) {
    result.categoryName = "Subscriptions";
  }

  // Large Amount rule (> $1000)
  if (amt >= 1000) {
    result.requiresConfirmation = true;
  }

  // Salary split rule
  if (merchant.includes("payroll") || merchant.includes("salary")) {
    result.salarySplit = { savings: 30, investment: 20, spending: 50 };
  }

  return result;
}

export function predictCategoryConfidence(
  merchantName: string,
  categories: any[]
): { suggestedCategory: string; confidence: number } {
  const name = (merchantName || "").toLowerCase();
  if (!name) return { suggestedCategory: "General", confidence: 50 };

  if (name.includes("food") || name.includes("burger") || name.includes("starbucks")) {
    return { suggestedCategory: "Food & Dining", confidence: 95 };
  }
  if (name.includes("uber") || name.includes("flight") || name.includes("fuel")) {
    return { suggestedCategory: "Transportation", confidence: 92 };
  }
  if (name.includes("apple") || name.includes("amazon") || name.includes("target")) {
    return { suggestedCategory: "Shopping", confidence: 85 };
  }

  return { suggestedCategory: "General Expense", confidence: 60 };
}

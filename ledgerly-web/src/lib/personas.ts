import { CapabilityId } from "./capabilities";
import { WorkspaceType } from "./modules";

export interface PersonaDefinition {
  id: WorkspaceType;
  name: string;
  badge: string;
  icon: string;
  description: string;
  coreCapabilities: CapabilityId[];
  optionalCapabilities: CapabilityId[];
  excludedCapabilities: CapabilityId[];
  dashboardWidgets: string[];
  quickActions: { label: string; action: string; capability?: CapabilityId }[];
  terminology: Record<string, string>;
}

export const PERSONA_CONFIG: Record<WorkspaceType, PersonaDefinition> = {
  personal: {
    id: "personal",
    name: "Personal Finance",
    badge: "Personal",
    icon: "👤",
    description: "Manage day-to-day spending, personal budgets, savings goals, and cash flow.",
    coreCapabilities: [
      "dashboard",
      "accounts",
      "transactions",
      "categories",
      "budgets",
      "savings",
      "recurring",
      "subscriptions",
      "health",
      "feedback",
      "settings",
    ],
    optionalCapabilities: ["vault", "loans", "analytics", "calendar", "timeline", "import-export"],
    excludedCapabilities: ["wealth", "merchants"],
    dashboardWidgets: [
      "netWorthSummary",
      "monthIncome",
      "monthExpense",
      "cashFlowChart",
      "spendingBreakdown",
      "accountsList",
      "recentTransactions",
    ],
    quickActions: [
      { label: "Quick Transaction", action: "quickAdd", capability: "transactions" },
      { label: "New Budget", action: "newBudget", capability: "budgets" },
      { label: "New Savings Goal", action: "newSavings", capability: "savings" },
    ],
    terminology: {
      accountsTitle: "Personal Accounts",
      budgetsTitle: "Personal Budgets",
      savingsTitle: "Savings Goals",
    },
  },

  student: {
    id: "student",
    name: "Student Budget",
    badge: "Student",
    icon: "🎓",
    description:
      "Keep pocket money under control with simple daily budgets, expense limits, and student loans.",
    coreCapabilities: [
      "dashboard",
      "accounts",
      "transactions",
      "categories",
      "budgets",
      "savings",
      "subscriptions",
      "loans",
      "health",
      "feedback",
      "settings",
    ],
    optionalCapabilities: ["recurring", "calendar", "timeline"],
    excludedCapabilities: ["wealth", "merchants", "vault", "import-export", "analytics"],
    dashboardWidgets: [
      "studentBalanceCard",
      "dailyBudgetRemaining",
      "monthExpense",
      "recentTransactions",
      "savingsGoalsSummary",
    ],
    quickActions: [
      { label: "Log Expense", action: "quickAdd", capability: "transactions" },
      { label: "Check Budget", action: "viewBudgets", capability: "budgets" },
      { label: "Add Savings Goal", action: "newSavings", capability: "savings" },
    ],
    terminology: {
      accountsTitle: "Student Wallets",
      budgetsTitle: "Daily & Pocket Budgets",
      savingsTitle: "Target Savings",
    },
  },

  family: {
    id: "family",
    name: "Family Finance",
    badge: "Family",
    icon: "🏡",
    description:
      "Manage household accounts, joint budgets, shared savings goals, and upcoming bills.",
    coreCapabilities: [
      "dashboard",
      "accounts",
      "transactions",
      "categories",
      "budgets",
      "savings",
      "vault",
      "calendar",
      "recurring",
      "timeline",
      "health",
      "feedback",
      "settings",
    ],
    optionalCapabilities: ["loans", "subscriptions", "analytics", "import-export"],
    excludedCapabilities: ["wealth", "merchants"],
    dashboardWidgets: [
      "householdNetWorth",
      "householdCashFlow",
      "sharedAccounts",
      "householdBudget",
      "upcomingBillsCalendar",
      "savingsGoalsSummary",
      "recentTransactions",
    ],
    quickActions: [
      { label: "Log Shared Transaction", action: "quickAdd", capability: "transactions" },
      { label: "Add Bill / Recurring", action: "newRecurring", capability: "recurring" },
      { label: "Family Budget", action: "newBudget", capability: "budgets" },
    ],
    terminology: {
      accountsTitle: "Household Accounts",
      budgetsTitle: "Shared Family Budgets",
      savingsTitle: "Family Savings Goals",
    },
  },

  investor: {
    id: "investor",
    name: "Investor / Wealth",
    badge: "Investor",
    icon: "📈",
    description:
      "Monitor net worth, portfolio allocations, asset performance, and debt liabilities.",
    coreCapabilities: [
      "dashboard",
      "accounts",
      "transactions",
      "categories",
      "wealth",
      "loans",
      "analytics",
      "import-export",
      "vault",
      "health",
      "feedback",
      "settings",
    ],
    optionalCapabilities: ["budgets", "recurring", "calendar", "timeline"],
    excludedCapabilities: ["merchants"],
    dashboardWidgets: [
      "netWorthTrajectoryCard",
      "assetValuationBreakdown",
      "liabilitySummaryCard",
      "investmentPortfolioWidget",
      "cashFlowForecastChart",
    ],
    quickActions: [
      { label: "Record Asset / Investment", action: "addAsset", capability: "wealth" },
      { label: "Log Transaction", action: "quickAdd", capability: "transactions" },
      { label: "View Net Worth", action: "viewWealth", capability: "wealth" },
    ],
    terminology: {
      accountsTitle: "Investment & Cash Accounts",
      budgetsTitle: "Capital Allocation",
      savingsTitle: "Portfolio Growth Targets",
    },
  },

  business: {
    id: "business",
    name: "Business Finance",
    badge: "Business",
    icon: "💼",
    description: "Track revenues, business accounts, merchant expenses, invoices, and taxes.",
    coreCapabilities: [
      "dashboard",
      "accounts",
      "transactions",
      "categories",
      "budgets",
      "merchants",
      "vault",
      "analytics",
      "recurring",
      "subscriptions",
      "import-export",
      "health",
      "feedback",
      "settings",
    ],
    optionalCapabilities: ["loans", "calendar", "timeline"],
    excludedCapabilities: ["wealth"],
    dashboardWidgets: [
      "businessRevenueKPI",
      "operatingExpensesKPI",
      "businessCashFlowChart",
      "topMerchantsWidget",
      "receiptVaultStatus",
      "recentTransactions",
    ],
    quickActions: [
      { label: "Log Revenue / Expense", action: "quickAdd", capability: "transactions" },
      { label: "Upload Receipt", action: "uploadVault", capability: "vault" },
      { label: "Merchant Analytics", action: "viewMerchants", capability: "merchants" },
    ],
    terminology: {
      accountsTitle: "Business & Operating Accounts",
      budgetsTitle: "Operating Budgets",
      savingsTitle: "Reserve Funds",
    },
  },
};

export function getPersonaConfig(workspaceType: WorkspaceType = "personal"): PersonaDefinition {
  return PERSONA_CONFIG[workspaceType] || PERSONA_CONFIG.personal;
}

export function isCapabilityExcludedForPersona(
  capability: CapabilityId,
  workspaceType: WorkspaceType = "personal",
): boolean {
  const config = getPersonaConfig(workspaceType);
  return config.excludedCapabilities.includes(capability);
}

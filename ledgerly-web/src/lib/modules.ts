import {
  LayoutDashboard,
  Wallet,
  ArrowLeftRight,
  Tags,
  Store,
  PieChart,
  PiggyBank,
  HandCoins,
  Repeat,
  Tv,
  Calendar,
  BarChart3,
  Bell,
  Download,
  Settings as SettingsIcon,
  FileText,
  Landmark,
  Smartphone,
  Sparkles,
  Activity,
  MessageSquare,
  LucideIcon,
} from "lucide-react";

export type WorkspaceType = "personal" | "business" | "family" | "student" | "investor";
export type FeatureFlagStatus = "stable" | "beta" | "experimental" | "future";
export type NavigationGroup =
  | "Core"
  | "Planning & Goals"
  | "Evidence & Vault"
  | "Business & Analytics"
  | "Wealth & Liabilities"
  | "System";

export interface SystemModule {
  id: string;
  name: string;
  shortName?: string;
  icon: LucideIcon;
  description: string;
  route: string;
  navigationGroup: NavigationGroup;
  defaultWorkspaces: WorkspaceType[];
  featureFlag: FeatureFlagStatus;
  isCore?: boolean;
}

export const WORKSPACE_CONFIGS: Record<
  WorkspaceType,
  { name: string; description: string; badge: string; icon: string }
> = {
  personal: {
    name: "Personal Finance",
    description: "Manage day-to-day spending, personal budgets, savings goals, and cash flow.",
    badge: "Personal",
    icon: "👤",
  },
  business: {
    name: "Business Finance",
    description: "Track revenues, business accounts, merchant expenses, invoices, and taxes.",
    badge: "Business",
    icon: "💼",
  },
  family: {
    name: "Family Finance",
    description: "Manage household accounts, joint budgets, shared savings goals, and upcoming bills.",
    badge: "Family",
    icon: "🏡",
  },
  student: {
    name: "Student Budget",
    description: "Keep pocket money under control with simple daily budgets, expense limits, and student loans.",
    badge: "Student",
    icon: "🎓",
  },
  investor: {
    name: "Investor / Wealth",
    description: "Monitor net worth, portfolio allocations, asset performance, and debt liabilities.",
    badge: "Investor",
    icon: "📈",
  },
};

export const MODULE_REGISTRY: SystemModule[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    description: "Central command center with KPIs, cash flow charts, and recent activity.",
    route: "/dashboard",
    navigationGroup: "Core",
    defaultWorkspaces: ["personal", "business", "family", "student", "investor"],
    featureFlag: "stable",
    isCore: true,
  },
  {
    id: "insights",
    name: "AI Assistant & Insights",
    shortName: "Insights",
    icon: Sparkles,
    description: "Smart pattern detection, cash flow forecasting, and Financial Health Score v2.",
    route: "/insights",
    navigationGroup: "Core",
    defaultWorkspaces: ["personal", "business", "family", "student", "investor"],
    featureFlag: "stable",
    isCore: true,
  },
  {
    id: "accounts",
    name: "Accounts & Wallets",
    shortName: "Accounts",
    icon: Wallet,
    description: "Bank accounts, credit cards, investment portfolios, and digital wallets.",
    route: "/accounts",
    navigationGroup: "Core",
    defaultWorkspaces: ["personal", "business", "family", "student", "investor"],
    featureFlag: "stable",
    isCore: true,
  },
  {
    id: "transactions",
    name: "Transactions",
    icon: ArrowLeftRight,
    description: "Comprehensive history of income, expenses, and account transfers.",
    route: "/transactions",
    navigationGroup: "Core",
    defaultWorkspaces: ["personal", "business", "family", "student", "investor"],
    featureFlag: "stable",
    isCore: true,
  },
  {
    id: "categories",
    name: "Categories",
    icon: Tags,
    description: "Organize transactions into custom income and expense categories.",
    route: "/categories",
    navigationGroup: "Core",
    defaultWorkspaces: ["personal", "business", "family", "student", "investor"],
    featureFlag: "stable",
  },
  {
    id: "vault",
    name: "Receipt Vault",
    shortName: "Vault",
    icon: FileText,
    description: "Document management repository for receipts, invoices, and warranties.",
    route: "/vault",
    navigationGroup: "Evidence & Vault",
    defaultWorkspaces: ["personal", "business", "family", "investor"],
    featureFlag: "stable",
  },
  {
    id: "wealth",
    name: "Wealth & Net Worth",
    shortName: "Wealth",
    icon: Landmark,
    description: "Track net worth trajectory, assets, investments, and liabilities.",
    route: "/wealth",
    navigationGroup: "Wealth & Liabilities",
    defaultWorkspaces: ["investor", "personal", "family"],
    featureFlag: "stable",
  },
  {
    id: "budgets",
    name: "Budgets",
    icon: PieChart,
    description: "Set category spending limits and monitor progress in real-time.",
    route: "/budgets",
    navigationGroup: "Planning & Goals",
    defaultWorkspaces: ["personal", "family", "student", "business"],
    featureFlag: "stable",
  },
  {
    id: "savings",
    name: "Savings Goals",
    shortName: "Savings",
    icon: PiggyBank,
    description: "Set targeted savings goals for emergency funds, vacations, or purchases.",
    route: "/savings",
    navigationGroup: "Planning & Goals",
    defaultWorkspaces: ["personal", "family", "student"],
    featureFlag: "stable",
  },
  {
    id: "loans",
    name: "Loans & Debts",
    shortName: "Loans",
    icon: HandCoins,
    description: "Track mortgages, student loans, personal debts, and amortization schedules.",
    route: "/loans",
    navigationGroup: "Wealth & Liabilities",
    defaultWorkspaces: ["personal", "student", "family", "business", "investor"],
    featureFlag: "stable",
  },
  {
    id: "recurring",
    name: "Recurring Bills",
    shortName: "Recurring",
    icon: Repeat,
    description: "Automate tracking of recurring income and scheduled bill payments.",
    route: "/recurring",
    navigationGroup: "Planning & Goals",
    defaultWorkspaces: ["personal", "business", "family"],
    featureFlag: "stable",
  },
  {
    id: "subscriptions",
    name: "Subscriptions",
    icon: Tv,
    description: "Monitor active software, streaming, and recurring service memberships.",
    route: "/subscriptions",
    navigationGroup: "Planning & Goals",
    defaultWorkspaces: ["personal", "business", "student"],
    featureFlag: "stable",
  },
  {
    id: "merchants",
    name: "Merchants",
    icon: Store,
    description: "Vendor intelligence, spend per merchant, and location trends.",
    route: "/merchants",
    navigationGroup: "Business & Analytics",
    defaultWorkspaces: ["business", "personal"],
    featureFlag: "stable",
  },
  {
    id: "calendar",
    name: "Financial Calendar",
    shortName: "Calendar",
    icon: Calendar,
    description: "Visual calendar view of past transactions and upcoming bill due dates.",
    route: "/calendar",
    navigationGroup: "Planning & Goals",
    defaultWorkspaces: ["personal", "family", "business"],
    featureFlag: "stable",
  },
  {
    id: "analytics",
    name: "Analytics & Reports",
    shortName: "Analytics",
    icon: BarChart3,
    description: "In-depth financial reports, cash flow breakdown, and exportable data.",
    route: "/analytics",
    navigationGroup: "Business & Analytics",
    defaultWorkspaces: ["business", "investor", "personal"],
    featureFlag: "stable",
  },
  {
    id: "notifications",
    name: "Notifications",
    icon: Bell,
    description: "Alerts for budget limits, upcoming bills, and account sync statuses.",
    route: "/notifications",
    navigationGroup: "System",
    defaultWorkspaces: ["personal", "business", "family", "student", "investor"],
    featureFlag: "stable",
  },
  {
    id: "import-export",
    name: "Import & Export",
    shortName: "Import/Export",
    icon: Download,
    description: "Import bank CSV statements or export financial evidence reports.",
    route: "/import-export",
    navigationGroup: "Evidence & Vault",
    defaultWorkspaces: ["personal", "business", "investor"],
    featureFlag: "stable",
  },
  {
    id: "health",
    name: "Health Check Center",
    shortName: "Health Check",
    icon: Activity,
    description: "Database diagnostics, negative balance warnings, and 1-click repairs.",
    route: "/health",
    navigationGroup: "System",
    defaultWorkspaces: ["personal", "business", "family", "student", "investor"],
    featureFlag: "stable",
  },
  {
    id: "feedback",
    name: "Feedback & Support",
    shortName: "Feedback",
    icon: MessageSquare,
    description: "Submit bug reports, feature requests, ratings, and diagnostic logs.",
    route: "/feedback",
    navigationGroup: "System",
    defaultWorkspaces: ["personal", "business", "family", "student", "investor"],
    featureFlag: "stable",
  },
  {
    id: "timeline",
    name: "Upcoming Money Timeline",
    shortName: "Timeline",
    icon: Calendar,
    description: "Money Buckets classification, cash flow planner, and emergency fund advisor.",
    route: "/timeline",
    navigationGroup: "Planning & Goals",
    defaultWorkspaces: ["personal", "business", "family", "student", "investor"],
    featureFlag: "stable",
  },
  {
    id: "settings",
    name: "Settings",
    icon: SettingsIcon,
    description: "User profile, workspace configuration, currencies, and security settings.",
    route: "/settings",
    navigationGroup: "System",
    defaultWorkspaces: ["personal", "business", "family", "student", "investor"],
    featureFlag: "stable",
    isCore: true,
  },
];

export function getVisibleModules(
  workspaceType: WorkspaceType = "personal",
  disabledModules: string[] = [],
  includeBeta: boolean = false
): SystemModule[] {
  return MODULE_REGISTRY.filter((mod) => {
    // Core modules can never be hidden
    if (mod.isCore) return true;

    // Check if explicitly disabled by user
    if (disabledModules.includes(mod.id)) return false;

    // Check feature flag requirements
    if (mod.featureFlag === "beta" && !includeBeta) return false;
    if (mod.featureFlag === "experimental" && !includeBeta) return false;

    // Check if module belongs to workspace defaults or user enabled it
    return mod.defaultWorkspaces.includes(workspaceType);
  });
}
